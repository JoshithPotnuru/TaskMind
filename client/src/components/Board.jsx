import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Clock, MessageSquare, Plus, AlertCircle, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { emitTaskMoved } from '../services/socket.js';
import api from '../services/api.js';
import { toast } from 'react-toastify';

const COLUMNS = [
  { id: 'Backlog', name: 'Backlog', color: 'bg-zinc-500' },
  { id: 'Todo', name: 'To Do', color: 'bg-indigo-500' },
  { id: 'In Progress', name: 'In Progress', color: 'bg-blue-500' },
  { id: 'Review', name: 'Review', color: 'bg-amber-500' },
  { id: 'Testing', name: 'Testing', color: 'bg-purple-500' },
  { id: 'Blocked', name: 'Blocked', color: 'bg-rose-500' },
  { id: 'Completed', name: 'Completed', color: 'bg-emerald-500' }
];

const Board = ({ projectId, tasks = [], setTasks, onCardClick, onCreateTask }) => {
  const [boardData, setBoardData] = useState({});

  useEffect(() => {
    // Group tasks by status
    const initialColumns = {};
    COLUMNS.forEach(c => {
      initialColumns[c.id] = [];
    });

    tasks.forEach(t => {
      if (initialColumns[t.status]) {
        initialColumns[t.status].push(t);
      } else {
        // Fallback for undefined statuses
        initialColumns['Todo'] = initialColumns['Todo'] || [];
        initialColumns['Todo'].push(t);
      }
    });

    setBoardData(initialColumns);
  }, [tasks]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside list
    if (!destination) return;

    // No actual movement
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const startColId = source.droppableId;
    const endColId = destination.droppableId;

    const startList = Array.from(boardData[startColId]);
    const endList = Array.from(boardData[endColId]);
    const movedTask = startList.find(t => t._id === draggableId);

    if (!movedTask) return;

    // 1. Update Client local State immediately for optimistic update
    const updatedTask = { ...movedTask, status: endColId };

    if (startColId === endColId) {
      startList.splice(source.index, 1);
      startList.splice(destination.index, 0, movedTask);
      setBoardData({
        ...boardData,
        [startColId]: startList
      });
    } else {
      startList.splice(source.index, 1);
      endList.splice(destination.index, 0, updatedTask);
      setBoardData({
        ...boardData,
        [startColId]: startList,
        [endColId]: endList
      });
    }

    // 2. Broadcast via Sockets for real-time collaborative updates
    emitTaskMoved(projectId, draggableId, startColId, endColId, updatedTask);

    // 3. Save to database API
    try {
      await api.put(`/tasks/${draggableId}`, { status: endColId });
      
      // Update parent list
      setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: endColId } : t));
    } catch (error) {
      toast.error('Failed to sync board movement to database');
      // Rollback changes by reloading tasks
      setTasks([...tasks]);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'Critical':
        return <AlertCircle size={14} className="text-rose-500" />;
      case 'High':
        return <ArrowUp size={14} className="text-amber-500 font-bold" />;
      case 'Medium':
        return <ArrowUp size={14} className="text-blue-500" />;
      default:
        return <ArrowDown size={14} className="text-gray-400" />;
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex space-x-4 overflow-x-auto pb-4 pt-1 w-full max-w-full">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 bg-gray-50/50 dark:bg-dark-card/30 border border-gray-200 dark:border-dark-border/60 rounded-2xl p-4 flex flex-col max-h-[750px] overflow-hidden"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1.5">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${column.color}`} />
                <span className="font-bold text-sm">{column.name}</span>
                <span className="text-xs bg-gray-200 dark:bg-dark-border text-gray-500 px-2 py-0.5 rounded-full font-bold">
                  {boardData[column.id]?.length || 0}
                </span>
              </div>
              <button
                onClick={() => onCreateTask(column.id)}
                className="p-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-dark-border text-gray-500"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Droppable Card List */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 overflow-y-auto space-y-3 pr-1 min-h-[400px] kanban-column rounded-xl p-1 ${
                    snapshot.isDraggingOver ? 'bg-gray-200/30 dark:bg-dark-border/20' : ''
                  }`}
                >
                  {boardData[column.id]?.map((task, index) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onCardClick(task._id)}
                          className={`bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-dark-border/80 shadow-sm cursor-grab active:cursor-grabbing hover:border-brand-500 dark:hover:border-brand-500 transition-all duration-200 ${
                            snapshot.isDragging ? 'shadow-xl scale-105 border-brand-500' : ''
                          }`}
                        >
                          {/* Card Tags / Labels */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {task.labels?.map((label, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400"
                              >
                                {label}
                              </span>
                            ))}
                          </div>

                          {/* Title */}
                          <h4 className="font-semibold text-sm line-clamp-2 leading-relaxed mb-3">
                            {task.title}
                          </h4>

                          {/* Footer Details */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border/40 text-[10px] text-gray-500">
                            <div className="flex items-center space-x-3">
                              {/* Priority Info */}
                              <div className="flex items-center space-x-1">
                                {getPriorityIcon(task.priority)}
                                <span className="font-medium">{task.priority}</span>
                              </div>
                              
                              {/* Due Date Indicator */}
                              {task.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <Clock size={11} />
                                  <span>{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                </div>
                              )}
                            </div>

                            {/* Assignee Avatar */}
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {task.assignedUsers?.slice(0, 3).map((user, idx) => (
                                <div
                                  key={idx}
                                  className="w-5.5 h-5.5 rounded-full bg-brand-600 border border-white dark:border-dark-card text-white text-[8px] font-bold flex items-center justify-center overflow-hidden"
                                >
                                  {user.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    user.name[0]
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default Board;
