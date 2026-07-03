import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Project from '../models/Project.js';
import AIHistory from '../models/AIHistory.js';
import ActivityLog from '../models/ActivityLog.js';

// 1. Get Platform Metrics
export const getSystemMetrics = async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    const orgCount = await Organization.countDocuments();
    const projectCount = await Project.countDocuments();

    // AI Token Usage
    const aiActions = await AIHistory.aggregate([
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$tokensUsed' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalTokensUsed = aiActions[0]?.totalTokens || 0;
    const aiCallsCount = aiActions[0]?.count || 0;

    // Recent activity logs
    const recentLogs = await ActivityLog.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      metrics: {
        totalUsers: userCount,
        totalOrganizations: orgCount,
        totalProjects: projectCount,
        totalTokensUsed,
        aiCallsCount,
      },
      recentLogs,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Fetch All Users (with pagination)
export const getAllUsers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Update Global User Role
export const updateUserRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    user.role = role;
    await user.save();

    res.json({ message: `User role updated to ${role} successfully`, user });
  } catch (error) {
    next(error);
  }
};
