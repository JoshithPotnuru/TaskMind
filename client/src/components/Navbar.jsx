import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, Search, Plus, Sparkles, Building2, Check, Clock, User2, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { updateUserProfile } from '../redux/slices/authSlice.js';
import { toast } from 'react-toastify';
import Pomodoro from './Pomodoro.jsx';

const Navbar = ({ activeOrg, setActiveOrg, organizations = [], onSearch, setMobileOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const dispatch = useDispatch();

  const [searchVal, setSearchVal] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const handleRealtimeNotif = (e) => {
        setNotifications((prev) => [e.detail, ...prev]);
        toast.info(e.detail.message, { position: 'top-right' });
      };
      window.addEventListener('app_notification', handleRealtimeNotif);
      return () => window.removeEventListener('app_notification', handleRealtimeNotif);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to update notifications');
    }
  };

  const handleOrgSwitch = (org) => {
    setActiveOrg(org);
    dispatch(updateUserProfile({ organization: org._id }));
    setShowOrgDropdown(false);
    toast.success(`Switched to workspace: ${org.name}`);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header
      className={`h-16 px-6 border-b flex items-center justify-between transition-all duration-300 relative z-20 ${
        mode === 'dark' ? 'bg-dark-card border-dark-border text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      {/* Left: Mobile hamburger menu & Org dropdown */}
      <div className="flex items-center space-x-3">
        {/* Hamburger (Mobile only) */}
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg hover:bg-gray-150 dark:hover:bg-dark-border text-gray-500 md:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-105 dark:hover:bg-dark-border transition-colors text-sm font-medium"
          >
            <Building2 size={16} className="text-brand-500" />
            <span className="max-w-[120px] truncate">{activeOrg ? activeOrg.name : 'Select Workspace'}</span>
          </button>
          
          {showOrgDropdown && (
            <div className="absolute left-0 mt-2 w-56 rounded-xl border shadow-xl glass-light dark:glass-dark p-1.5 overflow-hidden">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block px-3 py-1">
                Your Workspaces
              </span>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {organizations.map((org) => (
                  <button
                    key={org._id}
                    onClick={() => handleOrgSwitch(org)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                  >
                    <span className="truncate">{org.name}</span>
                    {activeOrg?._id === org._id && <Check size={14} className="text-brand-500" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-dark-border mt-1.5 pt-1.5">
                <Link
                  to="/settings"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/20 font-semibold"
                  onClick={() => setShowOrgDropdown(false)}
                >
                  <Plus size={14} />
                  <span>Create Workspace</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Live Search Bar & Timer */}
      <div className="flex-1 max-w-lg mx-6 flex items-center space-x-4">
        <form
          onSubmit={(e) => { e.preventDefault(); onSearch && onSearch(searchVal); }}
          className="w-full relative hidden sm:block"
        >
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="AI Semantic Search..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              mode === 'dark'
                ? 'bg-dark-bg border-dark-border text-white placeholder-gray-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
          />
        </form>

        <Pomodoro />
      </div>

      {/* Right: Notifications & Profile avatar */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-500 hover:text-gray-900 dark:hover:text-white relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 border shadow-2xl glass-light dark:glass-dark rounded-2xl p-2 max-h-[350px] overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-border pb-2 px-2">
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-brand-500 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 my-2 divide-y divide-gray-100 dark:divide-dark-border">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No new alerts.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-2 hover:bg-gray-50 dark:hover:bg-dark-border rounded-lg transition-colors ${
                        !n.isRead ? 'bg-brand-50/30 dark:bg-brand-950/10' : ''
                      }`}
                    >
                      <span className="block text-xs font-semibold">{n.title}</span>
                      <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Link to="/profile" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 font-semibold border-2 border-brand-500 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User2 size={18} />
            )}
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-xs font-bold truncate max-w-[100px]">{user?.name}</span>
            <span className="block text-[10px] text-gray-400 truncate max-w-[100px]">{user?.role}</span>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
