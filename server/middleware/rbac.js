import Project from '../models/Project.js';
import Organization from '../models/Organization.js';

// Restrict access by global roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Role (${req.user?.role || 'Guest'}) is not allowed to access this resource`));
    }
    next();
  };
};

// Verify user belongs to organization
export const checkOrgMember = async (req, res, next) => {
  try {
    const orgId = req.params.orgId || req.body.orgId || req.query.orgId;
    if (!orgId) {
      res.status(400);
      return next(new Error('Organization ID is required'));
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      res.status(404);
      return next(new Error('Organization not found'));
    }

    const isMember = org.members.some(
      (m) => m.user.toString() === req.user.id.toString()
    );

    if (!isMember && req.user.role !== 'Super Admin') {
      res.status(403);
      return next(new Error('You are not a member of this organization'));
    }

    req.organization = org;
    next();
  } catch (error) {
    next(error);
  }
};

// Verify user belongs to project
export const checkProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
    if (!projectId) {
      res.status(400);
      return next(new Error('Project ID is required'));
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id.toString()
    ) || project.owner.toString() === req.user.id.toString();

    if (!isMember && req.user.role !== 'Super Admin') {
      res.status(403);
      return next(new Error('You are not a member of this project'));
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};
