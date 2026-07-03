import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Styling
import './index.css';

// Services
import api from './services/api.js';
import { connectSocket, disconnectSocket } from './services/socket.js';

// Layout & Components
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import AICopilot from './components/AICopilot.jsx';
import CalendarView from './components/CalendarView.jsx';
import GanttChart from './components/GanttChart.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import Teams from './pages/Teams.jsx';
import Chat from './pages/Chat.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

// Protected Route Wrapper
const ProtectedLayout = ({ activeOrg, setActiveOrg, organizations, projects, setProjects }) => {
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${mode === 'dark' ? 'dark text-white' : 'text-gray-900'}`}>
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        projects={projects}
      />
      
      {/* Main content frame */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-dark-bg transition-colors duration-300">
        <Navbar
          activeOrg={activeOrg}
          setActiveOrg={setActiveOrg}
          organizations={organizations}
          setMobileOpen={setMobileOpen}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ activeOrg, setActiveOrg, organizations, projects, setProjects }} />
        </main>
      </div>

      {/* Floating AI Copilot */}
      <AICopilot projectId={projects?.[0]?._id} />
      <ToastContainer theme={mode} position="bottom-right" autoClose={3000} />
    </div>
  );
};

function App() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Shared platform states
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Setup sockets and fetch layouts on login
  useEffect(() => {
    if (user) {
      // Connect WebSocket
      connectSocket(user.id);

      // Load organization info
      const loadWorkspaceInfo = async () => {
        try {
          const { data: orgs } = await api.get('/orgs');
          setOrganizations(orgs);
          
          const currentOrg = orgs.find(o => o._id === user.organization) || orgs[0];
          setActiveOrg(currentOrg);

          if (currentOrg) {
            const { data: projs } = await api.get(`/projects?orgId=${currentOrg._id}`);
            setProjects(projs);

            const { data: userTasks } = await api.get('/tasks');
            setTasks(userTasks);
          }
        } catch (error) {
          console.error('Failed to load workspace info', error);
        }
      };

      loadWorkspaceInfo();
    } else {
      disconnectSocket();
    }
  }, [user]);

  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Layout */}
        <Route
          element={
            <ProtectedLayout
              activeOrg={activeOrg}
              setActiveOrg={setActiveOrg}
              organizations={organizations}
              projects={projects}
              setProjects={setProjects}
            />
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<Projects />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/chat" element={<Chat />} />
          
          {/* Top Level Calendar displaying all project tasks */}
          <Route
            path="/calendar"
            element={
              <div className="p-6 h-[calc(100vh-64px)]">
                <CalendarView tasks={tasks} onCardClick={(id) => window.location.href = `/projects`} />
              </div>
            }
          />

          {/* Top Level Timeline Gantt Chart */}
          <Route
            path="/gantt"
            element={
              <div className="p-6">
                <GanttChart tasks={tasks} />
              </div>
            }
          />

          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Lock Admin path to Super Admin */}
          <Route
            path="/admin"
            element={
              user?.role === 'Super Admin' ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
