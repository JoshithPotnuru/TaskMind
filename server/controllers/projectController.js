import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Team from '../models/Team.js';
import User from '../models/User.js';

// 1. Create Project
export const createProject = async (req, res, next) => {
  try {
    const { title, description, organizationId, teams, startDate, deadline, budget, priority, status, color, labels } = req.body;

    if (!organizationId) {
      res.status(400);
      return next(new Error('Organization ID is required'));
    }

    const project = await Project.create({
      title,
      description,
      owner: req.user._id,
      organization: organizationId,
      members: [{ user: req.user._id, role: 'Project Manager' }],
      teams: teams || [],
      startDate: startDate || Date.now(),
      deadline,
      budget: budget || 0,
      priority: priority || 'Medium',
      status: status || 'Active',
      color: color || '#4F46E5',
      labels: labels || [],
    });

    res.status(201).json({
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get User's Projects
export const getProjects = async (req, res, next) => {
  try {
    const { orgId } = req.query;
    const query = { 'members.user': req.user._id };
    if (orgId) {
      query.organization = orgId;
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('teams', 'name')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// 3. Get Project Detail
export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'name email avatar')
      .populate('teams', 'name members.user')
      .populate('members.user', 'name username email avatar position department role');

    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

// 4. Update Project
export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // Only owner or PM can update
    const isOwner = project.owner.toString() === req.user.id;
    const pmMember = project.members.find(m => m.user.toString() === req.user.id && m.role === 'Project Manager');
    if (!isOwner && !pmMember && req.user.role !== 'Super Admin') {
      res.status(403);
      return next(new Error('Not authorized to update this project'));
    }

    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        project[key] = updates[key];
      }
    });

    await project.save();
    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Project
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    if (project.owner.toString() !== req.user.id && req.user.role !== 'Super Admin') {
      res.status(403);
      return next(new Error('Only the owner can delete the project'));
    }

    await Project.findByIdAndDelete(req.params.projectId);
    // Cleanup tasks related to project
    await Task.deleteMany({ project: req.params.projectId });

    res.json({ message: 'Project and associated tasks deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 6. Project Members Operations
export const addProjectMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const alreadyMember = project.members.some(m => m.user.toString() === userId.toString());
    if (alreadyMember) {
      res.status(400);
      return next(new Error('User already in project'));
    }

    project.members.push({ user: userId, role: role || 'Developer' });
    await project.save();

    res.json({ message: 'Member added to project', project });
  } catch (error) {
    next(error);
  }
};

export const removeProjectMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    if (project.owner.toString() === userId.toString()) {
      res.status(400);
      return next(new Error('Cannot remove the project owner'));
    }

    project.members = project.members.filter(m => m.user.toString() !== userId.toString());
    await project.save();

    res.json({ message: 'Member removed from project', project });
  } catch (error) {
    next(error);
  }
};

// 7. Milestones
export const addMilestone = async (req, res, next) => {
  try {
    const { title, description, dueDate } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    project.milestones.push({ title, description, dueDate });
    await project.save();

    res.json({ message: 'Milestone added successfully', project });
  } catch (error) {
    next(error);
  }
};

export const updateMilestoneStatus = async (req, res, next) => {
  try {
    const { milestoneId, status } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      res.status(404);
      return next(new Error('Milestone not found'));
    }

    milestone.status = status;
    await project.save();

    res.json({ message: 'Milestone status updated', project });
  } catch (error) {
    next(error);
  }
};

// 8. File Upload / Attachment
export const uploadAttachment = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    if (!req.file) {
      res.status(400);
      return next(new Error('Please upload a file'));
    }

    // Attachments will get saved using Cloudinary path
    const fileAttachment = {
      name: req.file.originalname,
      url: req.file.path, // Cloudinary secure_url passed by multer storage
      uploadedBy: req.user._id,
    };

    project.attachments.push(fileAttachment);
    await project.save();

    res.json({ message: 'File uploaded successfully', attachments: project.attachments });
  } catch (error) {
    next(error);
  }
};
