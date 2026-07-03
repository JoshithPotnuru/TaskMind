import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Shield, Briefcase, Mail, Check, KeyRound } from 'lucide-react';
import api from '../services/api.js';
import { setCredentials } from '../redux/slices/authSlice.js';
import { toast } from 'react-toastify';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, accessToken, refreshToken } = useSelector((state) => state.auth);

  // States
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [position, setPosition] = useState(user?.position || '');
  const [department, setDepartment] = useState(user?.department || '');
  
  // Passwords change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', {
        name,
        bio,
        position,
        department,
      });

      // Update Redux state
      dispatch(setCredentials({
        user: data.user,
        accessToken,
        refreshToken
      }));

      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.message || 'Password update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Cover Header Card */}
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-brand-600 to-indigo-600 relative" />
        <div className="p-6 relative flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-10 gap-4">
          <div className="w-24 h-24 rounded-2xl bg-brand-100 border-4 border-white dark:border-dark-card text-brand-600 font-black text-3xl flex items-center justify-center overflow-hidden shadow">
            {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.[0]}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-extrabold">{user?.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">@{user?.username} | {user?.role}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: General Profile Form */}
        <div className="md:col-span-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-sm mb-4 flex items-center gap-2"><User size={16} /> Edit Profile</h3>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Position</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Lead Designer"
                  className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Product Design"
                  className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Email Address (Primary)</label>
                <div className="flex items-center space-x-2 px-3.5 py-2.5 bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-xs text-gray-400">
                  <Mail size={14} />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Biography</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full h-24 text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/10"
            >
              <Check size={14} /> Update Profile
            </button>
          </form>
        </div>

        {/* Right Side: Security Password Form */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-sm mb-4 flex items-center gap-2"><KeyRound size={16} /> Password & Security</h3>

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-brand-500/10"
            >
              Reset Password
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default Profile;
