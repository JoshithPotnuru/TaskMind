import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Kanban,
  CheckSquare,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingUp,
  Activity,
  Layers,
  Flame,
  Check,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import api from '../services/api.js';
import { PageSkeleton } from '../components/Loader.jsx';
import { toast } from 'react-toastify';

const COLORS = ['#9ca3af', '#6366f1', '#3b82f6', '#f59e0b', '#a855f7', '#f43f5e', '#10b981'];

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);

  // Habits Tracker local storage states
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem(`habits_${user?.id}`);
    return saved ? JSON.parse(saved) : [
      { id: 'deep-work', name: '4h Deep Work Session', done: false },
      { id: 'standup', name: 'Daily Standup Sync', done: false },
      { id: 'review', name: 'Code Review Done', done: false },
      { id: 'inbox', name: 'Inbox Zero Cleared', done: false },
    ];
  });
  const [streak, setStreak] = useState(() => {
    return parseInt(localStorage.getItem(`streak_${user?.id}`) || '3');
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: userTasks } = await api.get('/tasks');
      setTasks(userTasks);

      const { data: insights } = await api.get('/ai/insights');
      setAiInsights(insights);

      if (user?.role === 'Super Admin') {
        const { data: adminData } = await api.get('/admin/metrics');
        setMetrics(adminData.metrics);
        setLogs(adminData.recentLogs);
      } else {
        const completedCount = userTasks.filter(t => t.status === 'Completed').length;
        const pendingCount = userTasks.filter(t => t.status !== 'Completed').length;
        const overdueCount = userTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;

        setMetrics({
          totalTasks: userTasks.length,
          completedTasks: completedCount,
          pendingTasks: pendingCount,
          overdueTasks: overdueCount,
        });

        setLogs([
          { action: 'Task Sync', details: 'Completed tasks synchronized with sprint target', createdAt: new Date() },
          { action: 'AI Scan', details: 'Calculated baseline bottleneck risk ratings', createdAt: new Date(Date.now() - 3600000) }
        ]);
      }
    } catch (error) {
      toast.error('Failed to load dashboard parameters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const toggleHabit = (id) => {
    const updated = habits.map(h => h.id === id ? { ...h, done: !h.done } : h);
    setHabits(updated);
    localStorage.setItem(`habits_${user?.id}`, JSON.stringify(updated));

    // Simple streak calculation if all are completed
    const allDone = updated.every(h => h.done);
    if (allDone) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      localStorage.setItem(`streak_${user?.id}`, nextStreak.toString());
      toast.success("🔥 Amazing! You completed all daily habits! Streak increased.");
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  // Chart aggregation: Status
  const statusCounts = {};
  tasks.forEach(t => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });

  const barData = Object.keys(statusCounts).map(status => ({
    name: status,
    tasks: statusCounts[status]
  }));

  // Chart aggregation: Priority
  const priorityCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  tasks.forEach(t => {
    if (priorityCounts[t.priority] !== undefined) {
      priorityCounts[t.priority]++;
    }
  });

  const pieData = Object.keys(priorityCounts).map(prio => ({
    name: prio,
    value: priorityCounts[prio]
  }));

  // Velocity Agile Chart Data
  const velocityData = [
    { name: 'Sprint 1', target: 20, completed: 18 },
    { name: 'Sprint 2', target: 24, completed: 25 },
    { name: 'Sprint 3', target: 28, completed: 22 },
    { name: 'Sprint 4', target: 30, completed: 32 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Premium Gradient Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-700 text-white p-6 md:p-8 shadow-xl shadow-brand-500/10 transition-all duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform translate-x-12 -translate-y-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Welcome back, {user?.name}! 👋</h1>
            <p className="text-xs md:text-sm text-indigo-100 max-w-xl leading-relaxed">
              Your sprint velocity is optimal. AI reports a **12% productivity boost** from resolved blockers this week.
            </p>
          </div>
          
          <div className="flex bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl items-center gap-3">
            <Sparkles className="text-yellow-300 animate-pulse flex-shrink-0" size={24} />
            <div>
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">AI Productivity Index</span>
              <span className="text-base font-extrabold block">
                {aiInsights?.productivityScore || 82}% Efficiency Rate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Tasks Assigned', count: metrics.totalTasks || tasks.length, icon: Layers, bg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-brand-400' },
          { title: 'Completed Target', count: metrics.completedTasks || 0, icon: CheckSquare, bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' },
          { title: 'Overdue Warnings', count: metrics.overdueTasks || 0, icon: AlertTriangle, bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400', isOverdue: true },
          { title: 'AI Automation Invocations', count: metrics.aiCallsCount || 18, icon: Zap, bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' }
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center space-x-4 group"
          >
            <div className={`p-3.5 rounded-xl ${item.bg} group-hover:scale-105 transition-transform`}>
              <item.icon size={22} />
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{item.title}</span>
              <span className={`block text-2xl font-black mt-0.5 ${item.isOverdue && item.count > 0 ? 'text-rose-500' : ''}`}>{item.count}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Velocity Velocity Burndown Chart */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="font-extrabold text-sm flex items-center gap-1.5"><TrendingUp size={16} className="text-brand-500" /> Sprint Velocity Report</span>
              <p className="text-[10px] text-gray-400">Target story points completed vs total committed per sprint iteration.</p>
            </div>
            <span className="text-[10px] bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400 px-2 py-0.5 rounded font-extrabold flex items-center gap-1">
              Active Sprint: 4 <ArrowUpRight size={10} />
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={mode === 'dark' ? '#1f2937' : '#f3f4f6'} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip />
                <Legend formatter={(value) => <span className="text-[10px] font-bold text-gray-500">{value}</span>} />
                <Bar dataKey="target" fill="#9ca3af" opacity={0.3} radius={[4, 4, 0, 0]} name="Planned Points" />
                <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completed Points" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Habits Streak Tracker Checklist */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-extrabold text-sm flex items-center gap-1.5"><Flame size={16} className="text-amber-500 fill-amber-500 animate-pulse" /> Focus Habits Hub</span>
              <div className="flex items-center space-x-1 text-amber-500 font-extrabold text-xs">
                <span>{streak} Days</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mb-4">Click and check off daily actions to build cognitive focus habits.</p>

            <div className="space-y-2">
              {habits.map(h => (
                <button
                  key={h.id}
                  onClick={() => toggleHabit(h.id)}
                  className={`w-full flex items-center justify-between p-3 border rounded-xl text-xs font-semibold transition-all ${
                    h.done
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-border/50'
                  }`}
                >
                  <span>{h.name}</span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    h.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-dark-border'
                  }`}>
                    {h.done && <Check size={12} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border/40 text-[10px] text-gray-400 text-center italic">
            Check all habits to maintain your fire streak!
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Distribution Bar Chart */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-5 shadow-sm lg:col-span-2">
          <span className="font-extrabold text-sm mb-4 block">Workspace Task Distribution by Status</span>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke={mode === 'dark' ? '#1f2937' : '#f3f4f6'} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Pie Chart */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <span className="font-extrabold text-sm mb-4 block">Priority Layout Breakdown</span>
          <div className="h-56 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend formatter={(value) => <span className="text-[10px] font-bold text-gray-500">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
