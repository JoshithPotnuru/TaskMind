import React, { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Plus, Kanban, Calendar as CalendarIcon, Layers, BarChart2, Settings as SettingsIcon, Users, Clock, Sparkles } from 'lucide-react';
import api from '../services/api.js';
import Board from '../components/Board.jsx';
import CalendarView from '../components/CalendarView.jsx';
import GanttChart from '../components/GanttChart.jsx';
import TaskDetailsModal from '../components/TaskDetailsModal.jsx';
import { PageSkeleton } from '../components/Loader.jsx';
import { toast } from 'react-toastify';

const Projects = () => {
  const { projectId } = useParams();
  const { user } = useSelector((state) => state.auth);
  
  const context = useOutletContext();
  const activeOrg = context?.activeOrg;
  const projects = context?.projects || [];
  const setProjects = context?.setProjects || (() => {});

  // States
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'calendar' | 'gantt' | 'analytics' | 'settings'

  // Modal controls
  const [showCreateProj, setShowCreateProj] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskCol, setCreateTaskCol] = useState('Todo');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  const [activeTaskId, setActiveTaskId] = useState(null);
  const [aiRiskReport, setAiRiskReport] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      if (projectId) {
        const { data: projectDetails } = await api.get(`/projects/${projectId}`);
        setSelectedProject(projectDetails);

        const { data: projectTasks } = await api.get(`/tasks?projectId=${projectId}`);
        setTasks(projectTasks);
      }
    } catch (error) {
      toast.error('Failed to load project parameters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [projectId]);

  // Project Creation
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;

    const orgId = activeOrg?._id || user.organization;
    if (!orgId) {
      toast.error('Organization ID is required. Please select or create a workspace first.');
      return;
    }

    try {
      const { data } = await api.post('/projects', {
        title: newProjTitle,
        description: newProjDesc,
        organizationId: orgId,
      });
      toast.success('Project created successfully');
      setProjects([data.project, ...projects]);
      setShowCreateProj(false);
      setNewProjTitle('');
      setNewProjDesc('');
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  // Task Creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const { data } = await api.post('/tasks', {
        title: newTaskTitle,
        description: newTaskDesc,
        status: createTaskCol,
        project: projectId,
      });
      toast.success('Task created successfully');
      setTasks([data.task, ...tasks]);
      setShowCreateTask(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  // Trigger AI Risk Analysis
  const handleTriggerAIRisk = async () => {
    if (!projectId) return;
    toast.info('Running AI risk assessments...');
    try {
      const { data } = await api.post('/ai/risks', { projectId });
      setAiRiskReport(data);
      toast.success('Risk analysis complete!');
    } catch (error) {
      toast.error('Failed to run AI risk scan');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedProject?.title || 'project'}-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF report exported successfully!');
    } catch (error) {
      toast.error('Failed to export PDF report');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedProject?.title || 'project'}-report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel spreadsheet exported successfully!');
    } catch (error) {
      toast.error('Failed to export Excel sheet');
    }
  };


  if (loading) {
    return <PageSkeleton />;
  }

  // If no projectId, render Project Dashboard lists
  if (!projectId) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-250 pb-5">
          <div>
            <h1 className="text-2xl font-black">Workspace Projects</h1>
            <p className="text-xs text-gray-500">Create, manage, and monitor timelines across active project teams.</p>
          </div>
          <button
            onClick={() => setShowCreateProj(true)}
            className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/20 text-sm"
          >
            <Plus size={18} />
            <span>New Project</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-dark-card border border-dashed border-gray-200 dark:border-dark-border rounded-3xl text-gray-500">
            <span className="font-bold text-gray-700 dark:text-gray-300">No projects found</span>
            <p className="text-xs text-gray-400 mt-1">Get started by creating your first workspace project above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj._id}
                className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:border-brand-500 dark:hover:border-brand-500 p-5 rounded-3xl shadow-sm transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className="w-5 h-5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: proj.color || '#4f46e5' }}
                    />
                    <span className="text-[10px] bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400 font-bold px-2 py-0.5 rounded">
                      {proj.status}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base mb-1.5 group-hover:text-brand-500 transition-colors">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-border/40 text-[10px] text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users size={12} />
                    <span>{proj.members?.length} members</span>
                  </div>
                  <Link
                    to={`/projects/${proj._id}`}
                    className="font-bold text-brand-500 hover:underline flex items-center space-x-1"
                  >
                    <span>Open Project</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateProj && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
            <form
              onSubmit={handleCreateProject}
              className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border w-full max-w-md rounded-3xl p-6 shadow-2xl text-left space-y-4"
            >
              <h3 className="font-extrabold text-lg">Create New Project</h3>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile App Redesign"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Description</label>
                <textarea
                  placeholder="Describe project deliverables..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full h-24 px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none resize-none"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateProj(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Active Project Details Views (Board, Gantt, Calendar, Milestones)
  return (
    <div className="p-6 flex flex-col h-full space-y-6">
      
      {/* Project Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-250 pb-5 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-brand-100 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 font-bold px-2 py-0.5 rounded">
              {selectedProject?.status}
            </span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs text-gray-400">Priority: {selectedProject?.priority}</span>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl font-black">{selectedProject?.title}</h1>
            <div className="flex space-x-1.5">
              <button
                onClick={handleExportPDF}
                className="px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-md text-[9px] font-extrabold transition-all"
              >
                PDF Report
              </button>
              <button
                onClick={handleExportExcel}
                className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-md text-[9px] font-extrabold transition-all"
              >
                Excel Sheet
              </button>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border p-1 rounded-xl">
          {[
            { id: 'board', name: 'Kanban Board', icon: Kanban },
            { id: 'calendar', name: 'Calendar View', icon: CalendarIcon },
            { id: 'gantt', name: 'Gantt Timeline', icon: Layers },
            { id: 'analytics', name: 'AI Forecasts', icon: Sparkles },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Tab Panels */}
      <div className="flex-1 min-h-[500px]">
        {activeTab === 'board' && (
          <Board
            projectId={projectId}
            tasks={tasks}
            setTasks={setTasks}
            onCardClick={(id) => setActiveTaskId(id)}
            onCreateTask={(col) => { setCreateTaskCol(col); setShowCreateTask(true); }}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView tasks={tasks} onCardClick={(id) => setActiveTaskId(id)} />
        )}

        {activeTab === 'gantt' && (
          <GanttChart tasks={tasks} />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-extrabold text-base">AI Project Health Forecast</h3>
                  <p className="text-xs text-gray-500">Scan project board state using OpenAI for bottleneck alerts, delayed milestone risk levels, and user overload scores.</p>
                </div>
                <button
                  onClick={handleTriggerAIRisk}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/10"
                >
                  <Sparkles size={14} /> Run AI Scan
                </button>
              </div>

              {aiRiskReport ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                      <span className="block text-sm font-bold text-rose-500">Overall Project Danger Score</span>
                      <span className="text-3xl font-black block mt-1">{aiRiskReport.riskScore}%</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Bottlenecks Flagged:</span>
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                        {aiRiskReport.bottlenecks?.length === 0 ? (
                          <li className="list-none text-gray-400">No critical bottlenecks found.</li>
                        ) : (
                          aiRiskReport.bottlenecks?.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Missed Deadlines Risk:</span>
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                        {aiRiskReport.missedDeadlines?.length === 0 ? (
                          <li className="list-none text-gray-400">No overdue milestones predicted.</li>
                        ) : (
                          aiRiskReport.missedDeadlines?.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 text-xs">
                  Run AI scan to extract risk statistics.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Details Modal component view */}
      {activeTaskId && (
        <TaskDetailsModal
          taskId={activeTaskId}
          onClose={() => setActiveTaskId(null)}
          projectMembers={selectedProject?.members || []}
          onUpdate={(updatedTask) => {
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
          }}
        />
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <form
            onSubmit={handleCreateTask}
            className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border w-full max-w-md rounded-3xl p-6 shadow-2xl text-left space-y-4"
          >
            <h3 className="font-extrabold text-lg">Create task card ({createTaskCol})</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Task Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Configure server index.js"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Description</label>
              <textarea
                placeholder="Add card description..."
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                className="w-full h-24 px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none resize-none"
              />
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateTask(false)}
                className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Projects;
