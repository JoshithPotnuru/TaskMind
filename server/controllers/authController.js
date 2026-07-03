import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { sendVerificationOTP, sendResetPasswordOTP } from '../services/emailService.js';

// Helper to generate JWT tokens
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_jwt_secret', {
    expiresIn: '1h',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_SECRET || 'fallback_refresh_secret', {
    expiresIn: '7d',
  });
};

// 1. Register User
export const register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    // Check if user already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      return next(new Error('Email already registered'));
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      res.status(400);
      return next(new Error('Username already taken'));
    }

    // Generate Verification OTP (6 digit number)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({
      name,
      username,
      email,
      password, // Pre-save hook hashes password
      verificationOTP: otp,
      verificationOTPExpires: otpExpires,
    });

    // Send Verification Email
    await sendVerificationOTP(user.email, user.name, otp);

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      message: 'Registration successful. Verification email sent.',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        organization: user.organization,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Login User
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        themePreference: user.themePreference,
        organization: user.organization,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Verify Email
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      verificationOTP: otp,
      verificationOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      return next(new Error('Invalid or expired OTP'));
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

// 4. Request Password Reset OTP
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      return next(new Error('User not found with this email'));
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendResetPasswordOTP(user.email, user.name, otp);

    res.json({ message: 'Password reset OTP sent to your email' });
  } catch (error) {
    next(error);
  }
};

// 5. Reset Password
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      return next(new Error('Invalid or expired reset OTP'));
    }

    user.password = newPassword; // Pre-save hooks hashes this
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

// 6. Refresh Access Token
export const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(401);
      return next(new Error('Refresh Token is required'));
    }

    const user = await User.findOne({ refreshToken: token });
    if (!user) {
      res.status(403);
      return next(new Error('Invalid Refresh Token'));
    }

    jwt.verify(token, process.env.REFRESH_SECRET || 'fallback_refresh_secret', (err, decoded) => {
      if (err) {
        res.status(403);
        return next(new Error('Refresh Token expired or invalid'));
      }

      const accessToken = generateAccessToken(user._id);
      res.json({ accessToken });
    });
  } catch (error) {
    next(error);
  }
};

// 7. Simulated OAuth logins (Google / GitHub)
export const oauthLogin = async (req, res, next) => {
  try {
    const { email, name, providerId, provider, avatar } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      // Create a new OAuth user
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const randomUsername = `${email.split('@')[0]}_${Math.floor(100 + Math.random() * 900)}`;

      user = await User.create({
        name,
        email,
        username: randomUsername,
        password: randomPassword,
        avatar: avatar || '',
        isVerified: true, // Google/GitHub already verified
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: `Login via ${provider} successful`,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        organization: user.organization,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// 8. Logout User
export const logout = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (token) {
      const user = await User.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// 9. Change Password (Authenticated)
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      return next(new Error('Incorrect current password'));
    }

    user.password = newPassword; // Pre-save hooks hashes
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// 10. Update User Profile Settings
export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, skills, position, department, themePreference, notificationSettings } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (skills) user.skills = skills;
    if (position) user.position = position;
    if (department) user.department = department;
    if (themePreference) user.themePreference = themePreference;
    if (notificationSettings) user.notificationSettings = notificationSettings;

    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        skills: user.skills,
        position: user.position,
        department: user.department,
        themePreference: user.themePreference,
        notificationSettings: user.notificationSettings,
        isVerified: user.isVerified,
        organization: user.organization,
      }
    });
  } catch (error) {
    next(error);
  }
};

