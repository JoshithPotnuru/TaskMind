import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Settings as SettingsIcon, Building, UserPlus, Check, Trash2, ShieldAlert } from 'lucide-react';
import api from '../services/api.js';
import { toast } from 'react-toastify';
import { updateUserProfile } from '../redux/slices/authSlice.js';

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // States
  const [org, setOrg] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [loading, setLoading] = useState(true);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');
  const [inviting, setInviting] = useState(false);

  // Create Workspace states
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  const fetchOrgDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/orgs/${user.organization}`);
      setOrg(data);
      setOrgName(data.name);
      setOrgDesc(data.description || '');
    } catch (error) {
      toast.error('Failed to load organization settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.organization) {
      fetchOrgDetails();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setCreatingOrg(true);
    try {
      const { data } = await api.post('/orgs', {
        name: newOrgName,
        description: newOrgDesc,
      });
      toast.success('Workspace created successfully!');
      dispatch(updateUserProfile({ organization: data.organization._id }));
    } catch (error) {
      toast.error(error.message || 'Failed to create workspace');
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/orgs/${user.organization}`, {
        name: orgName,
        description: orgDesc,
      });
      toast.success('Workspace updated successfully');
    } catch (error) {
      toast.error('Failed to update workspace details');
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const { data } = await api.post(`/orgs/${user.organization}/invite`, {
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success(data.message || 'Invitation sent successfully!');
      
      // Update UI members list immediately
      setOrg({
        ...org,
        members: [...org.members, data.member]
      });
      setInviteEmail('');
    } catch (error) {
      toast.error(error.message || 'Invitation failed');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (userId === org.owner._id) {
      toast.error('Cannot remove the organization owner');
      return;
    }

    try {
      await api.post(`/orgs/${user.organization}/remove`, { userId });
      toast.success('Member removed from workspace');
      setOrg({
        ...org,
        members: org.members.filter(m => m.user?._id !== userId)
      });
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6 max-w-lg mx-auto space-y-6">
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-8 shadow-xl text-gray-900 dark:text-white">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-brand-500/25">
              <Building size={24} />
            </div>
            <h2 className="text-xl font-black bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
              Create Your Workspace
            </h2>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              You do not belong to any workspace. Create a new organization workspace to start managing projects and collaborating with your team.
            </p>
          </div>

          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Organization Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Tech Labs"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Workspace Description</label>
              <textarea
                placeholder="Describe organization deliverables and team goals..."
                value={newOrgDesc}
                onChange={(e) => setNewOrgDesc(e.target.value)}
                className="w-full h-24 text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none resize-none focus:ring-1 focus:ring-brand-500 text-gray-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={creatingOrg}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-brand-500/10 cursor-pointer transition-colors"
            >
              {creatingOrg ? 'Creating...' : 'Create Workspace'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-gray-250 pb-5">
        <h1 className="text-2xl font-black flex items-center gap-2"><SettingsIcon size={24} className="text-brand-500" /> Workspace Settings</h1>
        <p className="text-xs text-gray-500">Configure company properties, departmental layouts, and invite team members.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column: Organization General Edit form */}
        <div className="md:col-span-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-sm mb-4 flex items-center gap-2"><Building size={16} /> Edit Workspace Details</h3>
          
          <form onSubmit={handleUpdateOrg} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Organization Name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Workspace Description</label>
              <textarea
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                placeholder="Describe organization deliverables..."
                className="w-full h-24 text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/10"
            >
              <Check size={14} /> Update Details
            </button>
          </form>

          {/* Members list table */}
          <div className="mt-8">
            <h4 className="font-extrabold text-sm mb-4">Workspace Members List</h4>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs divide-y divide-gray-100 dark:divide-dark-border">
                <thead>
                  <tr className="text-gray-400 font-bold">
                    <th className="py-2">Member</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Org Role</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-border/40 font-medium text-gray-700 dark:text-gray-200">
                  {org.members?.map((member) => (
                    <tr key={member.user?._id} className="hover:bg-gray-50/50 dark:hover:bg-dark-bg/20">
                      <td className="py-3 font-bold pr-2 truncate max-w-[150px]">{member.user?.name}</td>
                      <td className="py-3 pr-2 truncate max-w-[180px]">{member.user?.email}</td>
                      <td className="py-3 pr-2"><span className="text-[10px] bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-300 px-2 py-0.5 rounded font-bold">{member.role}</span></td>
                      <td className="py-3 text-right">
                        {org.owner?._id !== member.user?._id && (
                          <button
                            onClick={() => handleRemoveMember(member.user?._id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                            title="Remove Member"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Invite Member form */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 shadow-sm h-fit">
          <h3 className="font-extrabold text-sm mb-4 flex items-center gap-2"><UserPlus size={16} /> Invite Colleague</h3>

          <form onSubmit={handleInviteMember} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Email Address</label>
              <input
                type="email"
                required
                placeholder="colleague@domain.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Workspace Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full text-xs bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border px-3 py-2.5 rounded-xl focus:outline-none"
              >
                <option value="Organization Admin">Organization Admin</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Developer">Developer</option>
                <option value="Tester">Tester</option>
                <option value="Client">Client</option>
                <option value="Guest">Guest</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={inviting}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-brand-500/10"
            >
              {inviting ? 'Sending Invite...' : 'Send Invitation Link'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default Settings;
