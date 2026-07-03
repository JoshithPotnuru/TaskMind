import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Users, UserPlus, Link as LinkIcon, Check, Copy, UserCheck, Shield } from 'lucide-react';
import api from '../services/api.js';
import { toast } from 'react-toastify';

const Teams = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [members, setMembers] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      // Retrieve organization members as the team list
      const { data } = await api.get(`/orgs/${user.organization}`);
      setMembers(data.members || []);
    } catch (error) {
      toast.error('Failed to load team rosters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.organization) {
      fetchTeamMembers();
    }
  }, [user]);

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/register?inviteCode=join-core-team-abcde`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast.success('Invite link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-250 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black">Core Team Management</h1>
          <p className="text-xs text-gray-500">Manage member roles, departmental allocations, and invite new members.</p>
        </div>

        <button
          onClick={handleCopyInviteLink}
          className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-500/10 text-xs"
        >
          {copiedLink ? <Check size={14} /> : <LinkIcon size={14} />}
          <span>Copy Team Invite Link</span>
        </button>
      </div>

      {/* Grid Roster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {members.map((member) => (
          <div
            key={member.user?._id}
            className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="flex items-start space-x-4">
              {/* Avatar circle */}
              <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950/40 text-brand-600 font-extrabold flex items-center justify-center flex-shrink-0 overflow-hidden">
                {member.user?.avatar ? (
                  <img src={member.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  member.user?.name?.[0]
                )}
              </div>

              {/* Text metadata */}
              <div className="flex-1 min-w-0">
                <span className="block font-extrabold text-sm truncate">{member.user?.name}</span>
                <span className="block text-[10px] text-gray-400 mt-0.5">{member.user?.position || 'Associate Developer'}</span>
                
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-[9px] bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400 px-2 py-0.5 rounded font-bold">
                    {member.user?.department || 'Engineering'}
                  </span>
                  <span className="text-[9px] bg-gray-100 text-gray-500 dark:bg-dark-border dark:text-gray-400 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    <Shield size={10} /> {member.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Workload Indicator (Visual mockup) */}
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-dark-border/40">
              <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1.5">
                <span>Active Workload Capacity</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">Moderate (4 tasks)</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                <div className="h-full bg-brand-600 rounded-full w-2/3" />
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

export default Teams;
