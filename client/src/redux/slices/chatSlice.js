import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeRoom: null, // { id: String, type: 'direct' | 'project' | 'team', name: String }
  messages: [],
  typingUsers: {}, // roomId -> [username]
  onlineUsers: {}, // userId -> 'online' | 'offline'
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveRoom: (state, action) => {
      state.activeRoom = action.payload;
      state.messages = [];
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      // Append only if the message belongs to the active room
      const msg = action.payload;
      const isCurrentDirect = state.activeRoom?.type === 'direct' && 
        ((msg.sender._id === state.activeRoom.id && msg.recipient === null) || 
         (msg.recipient?._id === state.activeRoom.id) || 
         (msg.sender._id === state.activeRoom.id) ||
         (msg.recipient === state.activeRoom.id));
         
      const isCurrentProject = state.activeRoom?.type === 'project' && msg.project === state.activeRoom.id;
      const isCurrentTeam = state.activeRoom?.type === 'team' && msg.team === state.activeRoom.id;

      if (isCurrentDirect || isCurrentProject || isCurrentTeam || state.activeRoom?.id === msg.sender._id || state.activeRoom?.id === msg.recipient?._id) {
        state.messages.push(msg);
      }
    },
    setTypingStatus: (state, action) => {
      const { roomId, username, isTyping } = action.payload;
      if (!state.typingUsers[roomId]) {
        state.typingUsers[roomId] = [];
      }

      if (isTyping) {
        if (!state.typingUsers[roomId].includes(username)) {
          state.typingUsers[roomId].push(username);
        }
      } else {
        state.typingUsers[roomId] = state.typingUsers[roomId].filter(u => u !== username);
      }
    },
    setUserOnlineStatus: (state, action) => {
      const { userId, status } = action.payload;
      state.onlineUsers[userId] = status;
    },
  },
});

export const { setActiveRoom, setMessages, addMessage, setTypingStatus, setUserOnlineStatus } = chatSlice.actions;
export default chatSlice.reducer;
