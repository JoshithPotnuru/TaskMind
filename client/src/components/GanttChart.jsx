import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

const GanttChart = ({ tasks = [] }) => {
  // Filter tasks that have start and due dates
  const datedTasks = tasks.filter(t => t.startDate && t.dueDate);

  if (datedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-gray-200 dark:border-dark-border rounded-3xl bg-white dark:bg-dark-card text-center text-gray-500">
        <Calendar size={48} className="text-gray-400 mb-2 animate-bounce" />
        <span className="font-bold text-gray-700 dark:text-gray-300">No dated tasks found</span>
        <p className="text-xs max-w-xs mt-1 text-gray-400">Add start and due dates to your tasks to visualize them on the project Gantt timeline.</p>
      </div>
    );
  }

  // Calculate project range
  const dates = datedTasks.map(t => [new Date(t.startDate), new Date(t.dueDate)]).flat();
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  
  // Extend range a bit for margins
  minDate.setDate(minDate.getDate() - 2);
  maxDate.setDate(maxDate.getDate() + 7);

  const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / (24 * 60 * 60 * 1000)));

  // Generate day columns headers (e.g. July 3, July 4)
  const columns = [];
  const currDate = new Date(minDate);
  for (let i = 0; i < totalDays; i += 3) { // group in 3-day steps to keep layout clean
    columns.push(new Date(currDate));
    currDate.setDate(currDate.getDate() + 3);
  }

  const getPercentageOffsets = (startStr, dueStr) => {
    const start = new Date(startStr);
    const due = new Date(dueStr);

    const leftDiff = Math.max(0, start - minDate);
    const duration = Math.max(24 * 60 * 60 * 1000, due - start);

    const leftPercent = (leftDiff / (maxDate - minDate)) * 100;
    const widthPercent = (duration / (maxDate - minDate)) * 100;

    return {
      left: `${Math.min(95, Math.max(0, leftPercent))}%`,
      width: `${Math.min(100, Math.max(5, widthPercent))}%`,
    };
  };

  return (
    <div className="border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-2xl p-6 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-dark-border pb-4">
        <div>
          <span className="font-extrabold text-lg">Project Gantt Timeline</span>
          <p className="text-xs text-gray-500">Track task dependencies, overlapping milestones, and schedules visually.</p>
        </div>
      </div>

      <div className="overflow-x-auto min-w-full">
        {/* Chart Grid */}
        <div className="min-w-[800px] border border-gray-100 dark:border-dark-border/50 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-dark-border/40">
          
          {/* Header Row */}
          <div className="flex bg-gray-50 dark:bg-dark-bg py-3">
            <div className="w-1/3 px-4 font-bold text-xs text-gray-400 uppercase tracking-wider">
              Task Details
            </div>
            <div className="w-2/3 relative flex justify-between px-2 font-bold text-[10px] text-gray-400 uppercase">
              {columns.map((date, idx) => (
                <div key={idx} className="flex-1 text-center border-l border-gray-200 dark:border-dark-border/30 first:border-0 truncate">
                  {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              ))}
            </div>
          </div>

          {/* Body Rows */}
          {datedTasks.map((task) => {
            const { left, width } = getPercentageOffsets(task.startDate, task.dueDate);
            return (
              <div key={task._id} className="flex items-center py-3.5 hover:bg-gray-50/50 dark:hover:bg-dark-bg/20 transition-colors">
                {/* Title & Assignees */}
                <div className="w-1/3 px-4 flex flex-col pr-6">
                  <span className="font-semibold text-sm truncate">{task.title}</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      task.status === 'Completed' ? 'bg-emerald-500' :
                      task.status === 'Blocked' ? 'bg-rose-500' : 'bg-brand-500'
                    }`} />
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{task.status}</span>
                  </div>
                </div>

                {/* Horizontal Gantt Bar Container */}
                <div className="w-2/3 px-2 relative h-8 flex items-center bg-gray-100/20 dark:bg-dark-bg/5 rounded-lg">
                  {/* Task Bar */}
                  <div
                    style={{ left, width }}
                    className="absolute h-5.5 rounded-lg bg-gradient-to-r from-brand-500 to-indigo-600 text-white text-[9px] font-bold px-2.5 flex items-center shadow-lg shadow-brand-500/15 overflow-hidden truncate"
                    title={`${task.title} (${new Date(task.startDate).toLocaleDateString()} - ${new Date(task.dueDate).toLocaleDateString()})`}
                  >
                    <span className="truncate">{task.title}</span>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
};

export default GanttChart;
