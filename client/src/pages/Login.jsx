import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { KeyRound, Mail, Sparkles, AlertCircle, Building } from 'lucide-react';
import api from '../services/api.js';
import { setCredentials } from '../redux/slices/authSlice.js';
import { toast } from 'react-toastify';

const schema = yup.object().shape({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register: formRegister, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await api.post('/auth/login', data);
      dispatch(setCredentials({
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      }));
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error) {
      setErrorMessage(error.message || 'Login failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Simulated Google/GitHub Login
  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/oauth-login', {
        email: `${provider.toLowerCase()}user@taskmind.com`,
        name: `${provider} Demo User`,
        provider,
        avatar: '',
      });
      dispatch(setCredentials({
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      }));
      toast.success(`Logged in with ${provider}!`);
      navigate('/');
    } catch (error) {
      toast.error(`OAuth connection to ${provider} failed.`);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password flow states
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = send code, 2 = reset password
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      if (response.data.otp) {
        toast.info(`Demo Mode: Use code ${response.data.otp} to verify.`, { autoClose: false });
        setOtpCode(response.data.otp);
      } else {
        toast.success('Verification code sent to your email!');
      }
      setForgotStep(2);
    } catch (error) {
      toast.error(error.message || 'Failed to dispatch reset code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otpCode || !newPassword) return;

    setForgotLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: otpCode,
        newPassword,
      });
      toast.success('Password reset successfully! You can now log in.');
      setForgotPasswordMode(false);
      setForgotStep(1);
      setForgotEmail('');
      setOtpCode('');
      setNewPassword('');
    } catch (error) {
      toast.error(error.message || 'Password reset failed. Verify OTP code.');
    } finally {
      setForgotLoading(false);
    }
  };

  if (forgotPasswordMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-4 font-sans relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-brand-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md border border-white/10 glass-dark rounded-3xl p-8 shadow-2xl relative z-10 text-white">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-brand-500/25">
              <KeyRound size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
              Forgot Password
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {forgotStep === 1 ? 'Enter your email to receive a recovery code.' : 'Enter recovery code and your new password.'}
            </p>
          </div>

          {forgotStep === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-gray-500" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-brand-500 rounded-xl text-sm focus:outline-none placeholder-gray-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-brand-600 hover:bg-brand-700 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-500/10 text-sm"
              >
                {forgotLoading ? 'Sending...' : 'Send Recovery Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">OTP Reset Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 focus:border-brand-500 rounded-xl text-sm focus:outline-none placeholder-gray-500 transition-colors text-center font-bold tracking-widest text-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 text-gray-500" size={16} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-brand-500 rounded-xl text-sm focus:outline-none placeholder-gray-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-brand-600 hover:bg-brand-700 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-500/10 text-sm"
              >
                {forgotLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <button
            onClick={() => { setForgotPasswordMode(false); setForgotStep(1); }}
            className="w-full mt-4 text-xs text-gray-400 hover:text-white transition-colors text-center block font-semibold hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-4 font-sans relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-brand-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md border border-white/10 glass-dark rounded-3xl p-8 shadow-2xl relative z-10 text-white">
        
        {/* Head */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-brand-500/25">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-xs text-gray-400 mt-1">Access your enterprise workspaces and tasks.</p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center space-x-2.5 p-3.5 bg-rose-500/15 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-gray-500" size={16} />
              <input
                type="email"
                placeholder="you@domain.com"
                {...formRegister('email')}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-brand-500 rounded-xl text-sm focus:outline-none placeholder-gray-500 transition-colors"
              />
            </div>
            {errors.email && <span className="text-[10px] text-rose-400 block font-semibold">{errors.email.message}</span>}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
              <button
                type="button"
                onClick={() => setForgotPasswordMode(true)}
                className="text-[10px] text-brand-400 hover:underline cursor-pointer focus:outline-none font-semibold"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 text-gray-500" size={16} />
              <input
                type="password"
                placeholder="••••••••"
                {...formRegister('password')}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-brand-500 rounded-xl text-sm focus:outline-none placeholder-gray-500 transition-colors"
              />
            </div>
            {errors.password && <span className="text-[10px] text-rose-400 block font-semibold">{errors.password.message}</span>}
          </div>

          {/* Primary Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-500/10 text-sm"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Separator */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] font-bold text-gray-500 uppercase px-3">or continue with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOAuthLogin('Google')}
            className="flex items-center justify-center space-x-2 py-2.5 border border-white/10 hover:bg-white/5 transition-colors rounded-xl text-xs font-semibold"
          >
            <span>Google</span>
          </button>
          <button
            onClick={() => handleOAuthLogin('GitHub')}
            className="flex items-center justify-center space-x-2 py-2.5 border border-white/10 hover:bg-white/5 transition-colors rounded-xl text-xs font-semibold"
          >
            <span>GitHub</span>
          </button>
        </div>

        {/* Bottom Signup Link */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:underline font-bold">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
