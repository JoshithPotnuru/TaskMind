import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../redux/slices/themeSlice.js';
import { logoutUser } from '../redux/slices/authSlice.js';
import {
  LayoutDashboard,
  Kanban,
  Users,
  MessageSquare,
  Calendar,
  Layers,
  Settings,
  User,
  Shield,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  X
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen, projects = [] }) => {
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: Kanban },
    { name: 'Teams', path: '/teams', icon: Users },
    { name: 'Collab Chat', path: '/chat', icon: MessageSquare },
    { name: 'Calendar Sync', path: '/calendar', icon: Calendar },
    { name: 'Gantt Timeline', path: '/gantt', icon: Layers },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Workspace Settings', path: '/settings', icon: Settings },
  ];

  if (user?.role === 'Super Admin') {
    navItems.push({ name: 'Admin panel', path: '/admin', icon: Shield });
  }

  const activeStyle = "flex items-center space-x-3 px-4 py-3 rounded-xl bg-brand-600 text-white font-medium shadow-md shadow-brand-500/20 transition-all duration-200";
  const inactiveStyle = `flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 transition-all duration-200 ${
    mode === 'dark' ? 'text-gray-400 hover:bg-dark-border hover:text-white' : ''
  }`;

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 h-screen flex flex-col justify-between transition-all duration-300 border-r z-40 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${mode === 'dark' ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-250">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="p-2 rounded-xl bg-brand-600 text-white flex-shrink-0">
                <BrainCircuit size={24} />
              </div>
              {!isCollapsed && (
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">
                  Taskmind
                </span>
              )}
            </div>
            
            {/* Collapse toggle (desktop) or Close drawer (mobile) */}
            <div className="flex items-center">
              <button
                onClick={() => setMobileOpen(false)}
                className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-500"
              >
                <X size={18} />
              </button>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-500"
              >
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-200 dark:border-dark-border space-y-1">
          <button
            onClick={() => dispatch(toggleTheme())}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm ${
              mode === 'dark' ? 'text-gray-300 hover:bg-dark-border' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              {mode === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              {!isCollapsed && <span>{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
