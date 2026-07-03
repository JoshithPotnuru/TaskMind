import React, { useState, useEffect } from 'react';
import { X, Calendar, UserPlus, CheckSquare, Clock, Plus, Trash2, Send, Paperclip, MessageSquare, Sparkles, AlertTriangle, ShieldCheck, Play, Square, Timer } from 'lucide-react';
import api from '../services/api.js';
import { toast } from 'react-toastify';

const TaskDetailsModal = ({ taskId, onClose, projectMembers = [], onUpdate }) => {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [storyPoints, setStoryPoints] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  // AI & Timer States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [timeLogs, setTimeLogs] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [manualHours, setManualHours] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/tasks/${taskId}`);
      setTask(data.task);
      setComments(data.comments);

      // Populate form state
      setTitle(data.task.title);
      setDescription(data.task.description || '');
      setStatus(data.task.status);
      setPriority(data.task.priority);
      setStoryPoints(data.task.storyPoints || 1);
      setDueDate(data.task.dueDate ? data.task.dueDate.split('T')[0] : '');

      // Load time logs
      const { data: logs } = await api.get(`/tasks/time/logs?taskId=${taskId}`);
      setTimeLogs(logs);

      // Check if there is an active running timer
      const running = logs.find(log => !log.endTime);
      if (running) {
        setActiveTimer(running);
      } else {
        setActiveTimer(null);
      }
    } catch (error) {
      toast.error('Failed to load task details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  const handleFieldUpdate = async (field, value) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { [field]: value });
      setTask(data.task);
      onUpdate && onUpdate(data.task);
    } catch (error) {
      toast.error(`Failed to update ${field}`);
    }
  };

  // AI Actions
  const handleAIPrioritize = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/prioritize', { taskId });
      setPriority(data.priority);
      setTask(prev => ({ ...prev, priority: data.priority }));
      toast.success(`AI suggested priority: ${data.priority}`);
      onUpdate && onUpdate({ ...task, priority: data.priority });
    } catch (error) {
      toast.error('AI prioritization failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIDeadlinePredict = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/predict', { taskId });
      setAiPrediction(data);
      toast.success('AI deadline risk predicted successfully!');
    } catch (error) {
      toast.error('AI prediction failed');
    } finally {
      setAiLoading(false);
    }
  };

  // Time Tracking Controls
  const handleStartTimer = async () => {
    try {
      const { data } = await api.post('/tasks/time/start', { taskId });
      setActiveTimer(data.timer);
      setTimeLogs([data.timer, ...timeLogs]);
      toast.success('Stopwatch timer started!');
    } catch (error) {
      toast.error(error.message || 'Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    try {
      const { data } = await api.post('/tasks/time/stop', {
        timerId: activeTimer._id,
        description: 'Timer session completed'
      });
      toast.success(`Timer stopped! Logged ${data.hoursTracked} hours.`);
      fetchTaskDetails(); // reload to get cumulative hours
    } catch (error) {
      toast.error('Failed to stop active timer');
    }
  };

  const handleLogManualTime = async (e) => {
    e.preventDefault();
    if (!manualHours || isNaN(manualHours)) {
      toast.error('Please enter a valid hours value');
      return;
    }

    try {
      await api.post('/tasks/time/manual', {
        taskId,
        durationHours: parseFloat(manualHours),
        description: 'Manual hours logged'
      });
      toast.success(`Logged ${manualHours} hours successfully!`);
      setManualHours('');
      fetchTaskDetails();
    } catch (error) {
      toast.error('Failed to log manual hours');
    }
  };

  // File Upload
  const handleAttachFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post(`/projects/${task.project}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update task local attachments list (mock dynamic addition if needed, or trigger reload)
      toast.success('Attachment uploaded successfully!');
      fetchTaskDetails();
    } catch (error) {
      toast.error('Attachment upload failed. Check file type restrictions.');
    } finally {
      setUploading(false);
    }
  };

  // Checklist / Comment functions
  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    try {
      const { data } = await api.post(`/tasks/${taskId}/checklist`, { text: newChecklistText });
      setTask(data.task);
      setNewChecklistText('');
      onUpdate && onUpdate(data.task);
    } catch (error) {
      toast.error('Failed to add checklist item');
    }
  };

  const handleToggleChecklistItem = async (itemId, isCompleted) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}/checklist`, { itemId, isCompleted });
      setTask(data.task);
      onUpdate && onUpdate(data.task);
    } catch (error) {
      toast.error('Failed to toggle checklist item');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const { data } = await api.post(`/tasks/${taskId}/comments`, { text: newCommentText });
      setComments([data.comment, ...comments]);
      setNewCommentText('');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/tasks/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  if (loading || !task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header bar */}
        <div className="flex items-center justify-between p-5 border-b border-gray-150">
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400 font-bold px-2 py-0.5 rounded">
              TASK-{task._id.slice(-4).toUpperCase()}
            </span>
            <span className="text-xs text-gray-400">|</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); handleFieldUpdate('status', e.target.value); }}
              className="text-xs font-bold bg-gray-50 dark:bg-dark-bg px-2.5 py-1 border border-gray-250 rounded-xl focus:outline-none"
            >
              <option value="Backlog">Backlog</option>
              <option value="Todo">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Testing">Testing</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-dark-border text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main columns (Title, details, comments) */}
          <div className="md:col-span-2 space-y-6">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleFieldUpdate('title', title)}
              className="w-full text-xl font-bold bg-transparent border-0 border-b border-transparent focus:border-brand-500 focus:outline-none pb-1.5 placeholder-gray-400"
            />

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleFieldUpdate('description', description)}
                placeholder="Add description..."
                className="w-full h-32 px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:border-brand-500 focus:outline-none rounded-xl text-sm placeholder-gray-500 transition-colors resize-none"
              />
            </div>

            {/* AI Predictions / Analytics Dashboard */}
            <div className="p-4 bg-brand-500/5 border border-brand-500/10 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-xs flex items-center gap-1.5"><Sparkles size={14} className="text-brand-500" /> AI Insights Hub</span>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAIPrioritize}
                    disabled={aiLoading}
                    className="text-[10px] font-bold bg-brand-600 hover:bg-brand-700 text-white px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    Prioritize
                  </button>
                  <button
                    onClick={handleAIDeadlinePredict}
                    disabled={aiLoading}
                    className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    Predict Delay
                  </button>
                </div>
              </div>

              {aiPrediction && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-brand-500/10 text-xs">
                  <div className="space-y-1">
                    <span className="text-gray-400 block text-[10px]">Predicted Completion</span>
                    <span className="font-bold text-brand-500">{aiPrediction.completionDate}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 block text-[10px]">Delay Risk</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2/3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            aiPrediction.delayProbability > 50 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${aiPrediction.delayProbability}%` }}
                        />
                      </div>
                      <span className="font-bold">{aiPrediction.delayProbability}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Checklist</label>
              <div className="space-y-1.5">
                {task.checklist?.map((item) => (
                  <div key={item._id} className="flex items-center space-x-2.5">
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={(e) => handleToggleChecklistItem(item._id, e.target.checked)}
                      className="rounded border-gray-300 dark:border-dark-border text-brand-600 focus:ring-brand-500"
                    />
                    <span className={`text-xs ${item.isCompleted ? 'line-through text-gray-400' : ''}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleAddChecklistItem} className="flex space-x-2 mt-2">
                <input
                  type="text"
                  placeholder="Add item..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-dark-bg border border-gray-250 focus:border-brand-500 focus:outline-none rounded-lg"
                />
                <button type="submit" className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold">
                  Add
                </button>
              </form>
            </div>

            {/* Comments Thread */}
            <div className="space-y-4 pt-4 border-t border-gray-150">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} /> Comments ({comments.length})
              </label>

              <form onSubmit={handleAddComment} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs bg-gray-50 dark:bg-dark-bg border border-gray-250 focus:border-brand-500 focus:outline-none rounded-xl"
                />
                <button type="submit" className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl">
                  <Send size={16} />
                </button>
              </form>

              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {comments.map((comm) => (
                  <div key={comm._id} className="flex space-x-3 p-3 bg-gray-50/50 dark:bg-dark-bg/25 border border-gray-200/50 dark:border-dark-border/40 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-xs font-bold overflow-hidden text-brand-600">
                      {comm.user?.avatar ? <img src={comm.user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : comm.user?.name?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span className="font-bold text-gray-700 dark:text-gray-300">{comm.user?.name}</span>
                        <div className="flex items-center space-x-2">
                          <span>{new Date(comm.createdAt).toLocaleDateString()}</span>
                          {comm.user?._id === user?.id && (
                            <button onClick={() => handleDeleteComment(comm._id)} className="text-rose-500 hover:underline">Delete</button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">{comm.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Attributes (Priority, time track stopwatch, due date, files) */}
          <div className="space-y-6 bg-gray-550/50 dark:bg-dark-bg/15 border border-gray-250/50 rounded-2xl p-4 h-fit">
            
            {/* Priority Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Priority</label>
              <select
                value={priority}
                onChange={(e) => { setPriority(e.target.value); handleFieldUpdate('priority', e.target.value); }}
                className="w-full text-xs bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border px-3 py-2 rounded-xl focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Time stopwatch tracking */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Timer size={12} /> Stopwatch & Time Tracking</label>
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border">
                <span className="text-xs font-semibold">
                  {activeTimer ? 'Timer Active...' : 'Timer Stopped'}
                </span>
                
                {activeTimer ? (
                  <button
                    onClick={handleStopTimer}
                    className="p-1.5 rounded-lg bg-rose-600 text-white flex items-center gap-1 text-[10px] font-bold animate-pulse"
                  >
                    <Square size={10} /> Stop
                  </button>
                ) : (
                  <button
                    onClick={handleStartTimer}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white flex items-center gap-1 text-[10px] font-bold"
                  >
                    <Play size={10} /> Start
                  </button>
                )}
              </div>

              {/* Log Manual hours form */}
              <form onSubmit={handleLogManualTime} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. 2.5"
                  value={manualHours}
                  onChange={(e) => setManualHours(e.target.value)}
                  className="w-20 px-2 py-1.5 text-xs bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg text-center"
                />
                <button type="submit" className="flex-1 bg-brand-600 text-white text-[10px] font-bold py-1.5 rounded-lg">
                  Log Hours
                </button>
              </form>
              <span className="block text-[10px] text-gray-400">Total Tracked: <strong>{task.actualTime || 0} hours</strong> / {task.estimatedTime || 0}h</span>
            </div>

            {/* Due Date & Story points */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Story Points</label>
                <input
                  type="number"
                  value={storyPoints}
                  onChange={(e) => { setStoryPoints(parseInt(e.target.value)); handleFieldUpdate('storyPoints', parseInt(e.target.value)); }}
                  className="w-full text-xs bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border px-3 py-1.5 rounded-lg text-center"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => { setDueDate(e.target.value); handleFieldUpdate('dueDate', e.target.value); }}
                  className="w-full text-xs bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border px-2 py-1.5 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Document attachments */}
            <div className="space-y-2.5 pt-4 border-t border-gray-200/50">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Paperclip size={12} /> Document Attachments
                </label>
                <label className="text-[10px] font-bold text-brand-500 hover:underline cursor-pointer">
                  {uploading ? 'Attaching...' : 'Attach File'}
                  <input type="file" className="hidden" onChange={handleAttachFile} disabled={uploading} />
                </label>
              </div>

              {/* Attachments List */}
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {task.attachments?.length === 0 ? (
                  <span className="text-[10px] text-gray-400 italic block py-2 text-center">No files uploaded.</span>
                ) : (
                  task.attachments?.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-[10px] hover:underline"
                    >
                      <span className="truncate max-w-[120px]">{file.name}</span>
                      <span className="text-gray-400">{new Date(file.createdAt).toLocaleDateString()}</span>
                    </a>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default TaskDetailsModal;
