import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';

const Pomodoro = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('work'); // 'work' | 'shortBreak' | 'longBreak'
  const [showPanel, setShowPanel] = useState(false);

  // Request browser notification permissions on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            handleTimerExpiration();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const handleTimerExpiration = () => {
    setIsActive(false);
    
    // Trigger desktop browser alert if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Taskmind Timer', {
        body: mode === 'work' ? 'Focus session complete! Time to take a break.' : 'Break finished! Ready to get back to work?',
      });
    }

    if (mode === 'work') {
      toast.success('Focus session complete! Take a break.', { autoClose: false });
      setMode('shortBreak');
      setMinutes(5);
    } else {
      toast.info('Break finished! Ready to focus?', { autoClose: false });
      setMode('work');
      setMinutes(25);
    }
    setSeconds(0);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'work') setMinutes(25);
    else if (mode === 'shortBreak') setMinutes(5);
    else setMinutes(15);
    setSeconds(0);
  };

  const switchMode = (newMode) => {
    setIsActive(false);
    setMode(newMode);
    if (newMode === 'work') setMinutes(25);
    else if (newMode === 'shortBreak') setMinutes(5);
    else setMinutes(15);
    setSeconds(0);
  };

  return (
    <div className="relative text-gray-900 dark:text-white">
      {/* Small Pill in Navbar */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-brand-900/50 hover:bg-brand-500/10 transition-colors text-xs font-semibold cursor-pointer ${
          isActive ? 'bg-brand-500/10 text-brand-500 animate-pulse' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        <Timer size={14} />
        <span>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <span className="hidden md:inline text-[9px] uppercase tracking-wider bg-brand-500/20 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded-full">
          {mode}
        </span>
      </button>

      {/* Popover Control Panel */}
      {showPanel && (
        <div className="absolute right-0 mt-2 w-64 border shadow-2xl glass-light dark:glass-dark rounded-2xl p-4 text-center z-30">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pomodoro Timer</span>
            <Sparkles size={14} className="text-brand-500" />
          </div>

          {/* Time Dial */}
          <div className="text-3xl font-black font-sans my-4 tracking-wider text-gray-900 dark:text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          {/* Mode Switchers */}
          <div className="grid grid-cols-3 gap-1 mb-4">
            <button
              onClick={() => switchMode('work')}
              className={`text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer ${
                mode === 'work'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-150 text-gray-700 hover:bg-gray-200 dark:bg-dark-border dark:text-gray-300 dark:hover:bg-dark-border/80'
              }`}
            >
              Focus
            </button>
            <button
              onClick={() => switchMode('shortBreak')}
              className={`text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer ${
                mode === 'shortBreak'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-150 text-gray-700 hover:bg-gray-200 dark:bg-dark-border dark:text-gray-300 dark:hover:bg-dark-border/80'
              }`}
            >
              Short
            </button>
            <button
              onClick={() => switchMode('longBreak')}
              className={`text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer ${
                mode === 'longBreak'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-150 text-gray-700 hover:bg-gray-200 dark:bg-dark-border dark:text-gray-300 dark:hover:bg-dark-border/80'
              }`}
            >
              Long
            </button>
          </div>

          {/* Play / Pause / Reset Actions */}
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={toggleTimer}
              className="p-2.5 rounded-full bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20 cursor-pointer"
            >
              {isActive ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={resetTimer}
              className="p-2.5 rounded-full bg-gray-150 text-gray-700 hover:bg-gray-200 dark:bg-dark-border dark:text-gray-300 dark:hover:bg-dark-bg cursor-pointer transition-colors"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pomodoro;
