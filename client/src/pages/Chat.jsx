import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Paperclip, MessageSquare, ShieldAlert, Mic, Users, Landmark, User, FileText } from 'lucide-react';
import api from '../services/api.js';
import {
  connectSocket,
  joinChatRoom,
  leaveChatRoom,
  emitTypingStart,
  emitTypingStop,
  getSocket
} from '../services/socket.js';
import { setActiveRoom, setMessages } from '../redux/slices/chatSlice.js';
import { toast } from 'react-toastify';

const Chat = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { activeRoom, messages, typingUsers } = useSelector((state) => state.chat);

  const [usersList, setUsersList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [typing, setTyping] = useState(false);

  const chatEndRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      connectSocket(user.id);
      
      // Fetch org users, projects, teams for channels sidebar
      const fetchSidebarData = async () => {
        if (!user || !user.organization) {
          setUsersList([]);
          setProjectsList([]);
          setTeamsList([]);
          return;
        }

        try {
          const { data: orgData } = await api.get(`/orgs/${user.organization}`);
          setUsersList(orgData.members?.filter(m => m.user?._id !== user.id).map(m => m.user) || []);

          const { data: projects } = await api.get('/projects');
          setProjectsList(projects);

          // Standard seed team fallback
          setTeamsList([{ _id: 'core-team-id', name: 'Core Product Team' }]);
        } catch (error) {
          console.error(error);
        }
      };

      fetchSidebarData();
    }
  }, [user]);

  // Handle active room switching
  useEffect(() => {
    if (activeRoom) {
      // Create room identifier
      const roomId = activeRoom.type === 'direct'
        ? [user.id, activeRoom.id].sort().join('_')
        : activeRoom.id;

      joinChatRoom(roomId);

      // Load historic messages
      const loadHistory = async () => {
        try {
          const queryParam = activeRoom.type === 'project'
            ? `projectId=${activeRoom.id}`
            : activeRoom.type === 'team'
            ? `teamId=${activeRoom.id}`
            : `recipientId=${activeRoom.id}`;

          const { data } = await api.get(`/chat?${queryParam}`);
          dispatch(setMessages(data));
        } catch (error) {
          console.error('Error fetching chat history:', error);
        }
      };

      loadHistory();

      return () => {
        leaveChatRoom(roomId);
      };
    }
  }, [activeRoom]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setText(e.target.value);
    
    if (!activeRoom) return;
    const roomId = activeRoom.type === 'direct'
      ? [user.id, activeRoom.id].sort().join('_')
      : activeRoom.id;

    if (!typing) {
      setTyping(true);
      emitTypingStart(roomId, user.name);
    }

    // Stop typing timeout
    setTimeout(() => {
      setTyping(false);
      emitTypingStop(roomId, user.name);
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;

    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      if (file) formData.append('file', file);

      if (activeRoom.type === 'project') {
        formData.append('projectId', activeRoom.id);
      } else if (activeRoom.type === 'team') {
        formData.append('teamId', activeRoom.id);
      } else {
        formData.append('recipientId', activeRoom.id);
      }

      // 1. Post to API to save
      const { data: savedMsg } = await api.post('/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 2. Broadcast via Sockets
      const roomId = activeRoom.type === 'direct'
        ? [user.id, activeRoom.id].sort().join('_')
        : activeRoom.id;

      const socketInstance = getSocket();
      if (socketInstance) {
        socketInstance.emit('new_chat_message', { roomId, message: savedMsg });
      }

      setText('');
      setFile(null);
    } catch (error) {
      toast.error('Failed to dispatch message');
    }
  };

  // Get active room typing indicator text
  const getTypingText = () => {
    if (!activeRoom) return '';
    const roomId = activeRoom.type === 'direct'
      ? [user.id, activeRoom.id].sort().join('_')
      : activeRoom.id;

    const list = typingUsers[roomId] || [];
    if (list.length === 0) return '';
    if (list.length === 1) return `${list[0]} is typing...`;
    return 'Multiple users are typing...';
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full font-sans overflow-hidden">
      
      {/* Sidebar Channels Lists */}
      <aside className="w-80 border-r border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col justify-between overflow-y-auto">
        <div className="p-4 space-y-6">
          
          {/* Projects Channels */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-2 mb-2">Project Channels</span>
            <div className="space-y-0.5">
              {projectsList.map((p) => (
                <button
                  key={p._id}
                  onClick={() => dispatch(setActiveRoom({ id: p._id, type: 'project', name: p.title }))}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center space-x-2.5 transition-colors ${
                    activeRoom?.id === p._id ? 'bg-brand-600 text-white font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border'
                  }`}
                >
                  <Landmark size={14} />
                  <span className="truncate">{p.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Teams Channels */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-2 mb-2">Team Channels</span>
            <div className="space-y-0.5">
              {teamsList.map((t) => (
                <button
                  key={t._id}
                  onClick={() => dispatch(setActiveRoom({ id: t._id, type: 'team', name: t.name }))}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center space-x-2.5 transition-colors ${
                    activeRoom?.id === t._id ? 'bg-brand-600 text-white font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border'
                  }`}
                >
                  <Users size={14} />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Peers Messages */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-2 mb-2">Direct Messages</span>
            <div className="space-y-0.5">
              {usersList.map((peer) => (
                <button
                  key={peer._id}
                  onClick={() => dispatch(setActiveRoom({ id: peer._id, type: 'direct', name: peer.name }))}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center space-x-2.5 transition-colors ${
                    activeRoom?.id === peer._id ? 'bg-brand-600 text-white font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border'
                  }`}
                >
                  <User size={14} />
                  <span>{peer.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </aside>

      {/* Main Chat Box */}
      <main className="flex-1 flex flex-col justify-between bg-gray-50 dark:bg-dark-bg overflow-hidden">
        {activeRoom ? (
          <>
            {/* Header */}
            <div className="h-14 px-6 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card flex items-center justify-between">
              <span className="font-extrabold text-sm">{activeRoom.name}</span>
              <span className="text-[10px] text-gray-400 italic">{getTypingText()}</span>
            </div>

            {/* Conversation Messages Lists */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((msg) => {
                const isSelf = msg.sender._id === user.id;
                return (
                  <div key={msg._id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md p-3.5 rounded-2xl border text-xs shadow-sm ${
                      isSelf
                        ? 'bg-brand-600 border-brand-500 text-white rounded-tr-none'
                        : 'bg-white border-gray-200 dark:bg-dark-card dark:border-dark-border text-gray-900 dark:text-white rounded-tl-none'
                    }`}>
                      <span className={`block text-[9px] font-bold ${
                        isSelf ? 'text-indigo-200' : 'text-brand-600 dark:text-brand-400'
                      } mb-1`}>
                        {msg.sender.name}
                      </span>
                      
                      {/* Text */}
                      {msg.text && (
                        <p className={`leading-relaxed ${
                          isSelf ? 'text-white' : 'text-gray-800 dark:text-gray-150'
                        }`}>
                          {msg.text}
                        </p>
                      )}

                      {/* File attachment */}
                      {msg.attachment && (
                        <a
                          href={msg.attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-2 mt-2 p-2 rounded bg-black/10 text-white hover:underline text-[10px]"
                        >
                          <FileText size={14} />
                          <span className="truncate max-w-[150px]">{msg.attachment.name}</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Send Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card flex items-center space-x-2.5">
              <label className="p-2.5 rounded-xl bg-gray-100 dark:bg-dark-border text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors">
                <Paperclip size={18} />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const selected = e.target.files[0];
                    setFile(selected);
                    toast.info(`Attached file: ${selected.name}`);
                  }}
                />
              </label>

              <input
                type="text"
                placeholder={`Message ${activeRoom.name}...`}
                value={text}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />

              <button type="submit" className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors">
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-400">
            <MessageSquare size={48} className="text-gray-300 mb-2 animate-bounce" />
            <span className="font-bold text-gray-700 dark:text-gray-300">Select a room channel</span>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Click on project channels, team rooms, or colleagues on the left sidebar to start messaging.</p>
          </div>
        )}
      </main>

    </div>
  );
};

export default Chat;
