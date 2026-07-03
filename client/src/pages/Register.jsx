import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Mail, KeyRound, User, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api.js';
import { toast } from 'react-toastify';

const schema = yup.object().shape({
  name: yup.string().required('Full name is required'),
  username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Passwords must match').required('Confirm password is required'),
});

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Verification states
  const [verifyMode, setVerifyMode] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState('');

  const { register: formRegister, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');
    try {
      await api.post('/auth/register', {
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
      });
      toast.success('Registration successful. OTP sent to your email.');
      setRegisteredEmail(data.email);
      setVerifyMode(true);
    } catch (error) {
      setErrorMessage(error.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify', { email: registeredEmail, otp });
      toast.success('Email verified successfully! Please log in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Verification failed. Incorrect OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-4 font-sans relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-brand-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md border border-white/10 glass-dark rounded-3xl p-8 shadow-2xl relative z-10 text-white">
        
        {!verifyMode ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-brand-500/25">
                <Sparkles size={24} />
              </div>
              <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
                Join Taskmind
              </h2>
              <p className="text-xs text-gray-400 mt-1">Create your profile and start managing projects.</p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errorMessage && (
                <div className="flex items-center space-x-2.5 p-3 bg-rose-500/15 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-gray-500" size={16} />
                  <input
                    type="text"
                    placeholder="Sarah Jenkins"
                    {...formRegister('name')}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-brand-500 rounded-xl text-sm focus:outline-none placeholder-gray-500 transition-colors"
                  />
                </div>
                {errors.name && <span className="text-[10px] text-rose-400 block font-semibold">{errors.name.message}</span>}
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-gray-500" size={16} />
                  <input
                    type="text"
                    placeholder="sarah"
                    {...formRegister('username')}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-brand-500 rounded-xl text-sm focus:outline-none placeholder-gray-500 transition-colors"
                  />
                </div>
                {errors.username && <span className="text-[10px] text-rose-400 block font-semibold">{errors.username.message}</span>}
              </div>

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
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
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

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 text-gray-500" size={16} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...formRegister('confirmPassword')}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-brand-500 rounded-xl text-sm focus:outline-none placeholder-gray-500 transition-colors"
                  />
                </div>
                {errors.confirmPassword && <span className="text-[10px] text-rose-400 block font-semibold">{errors.confirmPassword.message}</span>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-500/10 text-sm mt-2"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-400 hover:underline font-bold">
                Log in
              </Link>
            </p>
          </>
        ) : (
          /* OTP Verification Form */
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={26} />
              </div>
              <h3 className="font-extrabold text-xl">Verify Email</h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                We sent a 6-digit verification code to <br />
                <strong className="text-gray-200">{registeredEmail}</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
                Verification Code
              </label>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-widest text-2xl font-black py-3 bg-white/5 border border-white/10 focus:border-brand-500 rounded-xl focus:outline-none placeholder-gray-600 transition-all text-brand-400"
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 py-3 rounded-xl font-bold transition-all text-sm"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="text-center text-xs text-gray-400">
              Incorrect email?{' '}
              <button onClick={() => setVerifyMode(false)} className="text-brand-400 font-bold hover:underline">
                Start over
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Register;
