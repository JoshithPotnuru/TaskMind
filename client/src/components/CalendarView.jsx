import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const CalendarView = ({ tasks = [], onCardClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Compile dates array for the calendar grid
  const gridCells = [];

  // Padded cells from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    gridCells.push({
      day: prevMonthTotalDays - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthTotalDays - i)
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    gridCells.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }

  // Padded cells from next month
  const totalGridCapacity = 42; // 6 rows * 7 days
  const remainingCells = totalGridCapacity - gridCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    gridCells.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  // Get tasks due on a specific date
  const getTasksForDate = (date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const dDate = new Date(task.dueDate);
      return (
        dDate.getDate() === date.getDate() &&
        dDate.getMonth() === date.getMonth() &&
        dDate.getFullYear() === date.getFullYear()
      );
    });
  };

  return (
    <div className="border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-2xl p-6 flex flex-col h-full">
      
      {/* Navigation & Title */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-dark-border gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
              {monthNames[month]} {year}
            </h3>
            <p className="text-xs text-gray-400">Track deadlines, milestones, and task deliverables.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToday}
            className="px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg text-xs font-semibold"
          >
            Today
          </button>
          <div className="flex items-center border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-50 dark:hover:bg-dark-bg text-gray-500"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="w-px h-5 bg-gray-200 dark:bg-dark-border" />
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-50 dark:hover:bg-dark-bg text-gray-500"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col min-h-[500px]">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center font-bold text-xs uppercase text-gray-400 tracking-wider mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>

        {/* Day Cells Grid */}
        <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-1">
          {gridCells.map((cell, idx) => {
            const dayTasks = getTasksForDate(cell.date);
            const isToday =
              new Date().getDate() === cell.date.getDate() &&
              new Date().getMonth() === cell.date.getMonth() &&
              new Date().getFullYear() === cell.date.getFullYear();

            return (
              <div
                key={idx}
                className={`min-h-[85px] border border-gray-100 dark:border-dark-border/40 rounded-xl p-2 flex flex-col justify-between transition-colors overflow-hidden ${
                  cell.isCurrentMonth
                    ? 'bg-white dark:bg-dark-card'
                    : 'bg-gray-50/50 dark:bg-dark-bg/10 text-gray-400'
                } ${isToday ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-dark-card' : ''}`}
              >
                {/* Date Number Label */}
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-xs font-bold w-5.5 h-5.5 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-brand-600 text-white font-extrabold' : ''
                    }`}
                  >
                    {cell.day}
                  </span>
                </div>

                {/* Day Tasks List */}
                <div className="flex-1 overflow-y-auto space-y-1.5">
                  {dayTasks.map((t) => (
                    <button
                      key={t._id}
                      onClick={() => onCardClick(t._id)}
                      className={`w-full text-left truncate text-[9px] font-bold px-2 py-1 rounded-md transition-all ${
                        t.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                          : t.priority === 'Critical'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-brand-950/25 dark:text-brand-300 dark:border-brand-900/30'
                      }`}
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
