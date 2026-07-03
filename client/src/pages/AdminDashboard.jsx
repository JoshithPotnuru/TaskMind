import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, BarChart3, Edit, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import api from '../services/api.js';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // States for editing role
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('Developer');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const { data: metricsData } = await api.get('/admin/metrics');
      setMetrics(metricsData.metrics);
      setLogs(metricsData.recentLogs);

      const { data: usersData } = await api.get(`/admin/users?page=${page}&limit=5`);
      setUsers(usersData.users);
      setTotalPages(usersData.pagination.totalPages);
    } catch (error) {
      toast.error('Failed to load administrative stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [page]);

  const handleRoleUpdate = async (userId) => {
    try {
      await api.put('/admin/users/role', { userId, role: selectedRole });
      toast.success('User role updated successfully');
      setUsers(users.map(u => u._id === userId ? { ...u, role: selectedRole } : u));
      setEditingUserId(null);
    } catch (error) {
      toast.error('Failed to change user role');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="border-b border-gray-250 pb-5">
        <h1 className="text-2xl font-black flex items-center gap-2"><Shield size={24} className="text-brand-500" /> Platform Administration</h1>
        <p className="text-xs text-gray-500">Monitor billing limits, AI token integrations, audit activity records, and edit user privileges.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-5 rounded-2xl">
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Active Platforms Accounts</span>
          <span className="block text-2xl font-black mt-1">{metrics.totalUsers}</span>
        </div>
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-5 rounded-2xl">
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Organizations / Slices</span>
          <span className="block text-2xl font-black mt-1">{metrics.totalOrganizations}</span>
        </div>
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-5 rounded-2xl">
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Open Projects</span>
          <span className="block text-2xl font-black mt-1">{metrics.totalProjects}</span>
        </div>
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-5 rounded-2xl">
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">AI OpenAI API Queries</span>
          <span className="block text-2xl font-black mt-1">{metrics.aiCallsCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Users Roster Table */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <h3 className="font-extrabold text-sm mb-4 flex items-center gap-2"><Users size={16} /> User Account Roles Roster</h3>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs divide-y divide-gray-100 dark:divide-dark-border">
                <thead>
                  <tr className="text-gray-400 font-bold">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Position</th>
                    <th className="py-2.5">Global Role</th>
                    <th className="py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-border/40 font-medium text-gray-700 dark:text-gray-200">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-dark-bg/25">
                      <td className="py-3 pr-2 truncate max-w-[120px] font-bold">{u.name}</td>
                      <td className="py-3 pr-2 truncate max-w-[150px]">{u.email}</td>
                      <td className="py-3 pr-2 truncate max-w-[120px]">{u.position || 'Employee'}</td>
                      <td className="py-3 pr-2">
                        {editingUserId === u._id ? (
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="bg-gray-50 border border-gray-200 dark:bg-dark-bg dark:border-dark-border rounded p-1 text-[10px]"
                          >
                            {['Super Admin', 'Organization Admin', 'Project Manager', 'Developer', 'Tester', 'Client', 'Guest'].map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400 px-2 py-0.5 rounded font-bold">{u.role}</span>
                        )}
                      </td>
                      <td className="py-3">
                        {editingUserId === u._id ? (
                          <button onClick={() => handleRoleUpdate(u._id)} className="text-emerald-500 hover:scale-105 p-1"><Check size={14} /></button>
                        ) : (
                          <button onClick={() => { setEditingUserId(u._id); setSelectedRole(u.role); }} className="text-brand-500 p-1"><Edit size={14} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-dark-border/40">
            <span className="text-[10px] text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg text-gray-500 disabled:opacity-50"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg text-gray-500 disabled:opacity-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Platform System Logs */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col justify-between">
          <span className="font-extrabold text-sm flex items-center gap-1.5 mb-4"><Activity size={16} /> Platform Audit Trails</span>
          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[300px] pr-1">
            {logs.map((log, index) => (
              <div key={index} className="text-xs p-3 rounded-2xl bg-gray-50 dark:bg-dark-bg/30 border border-gray-200/50 dark:border-dark-border/40">
                <div className="flex justify-between font-bold">
                  <span>{log.action}</span>
                  <span className="text-[9px] text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{log.details}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
