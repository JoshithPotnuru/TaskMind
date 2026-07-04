import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Team from '../models/Team.js';
import { sendOrgInvite } from '../services/emailService.js';

// 1. Create Organization
export const createOrg = async (req, res, next) => {
  try {
    const { name, slug, description, logo, departments } = req.body;

    const derivedSlug = (slug || name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const slugExists = await Organization.findOne({ slug: derivedSlug });
    if (slugExists) {
      res.status(400);
      return next(new Error('Slug/Domain is already taken by another organization'));
    }

    const org = await Organization.create({
      name,
      slug: derivedSlug,
      description,
      logo,
      departments: departments || [],
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Organization Admin' }],
    });

    // Update user's organization field
    await User.findByIdAndUpdate(req.user._id, { organization: org._id });

    res.status(201).json({
      message: 'Organization created successfully',
      organization: org,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get User's Organizations
export const getOrgs = async (req, res, next) => {
  try {
    const orgs = await Organization.find({
      'members.user': req.user._id,
    }).populate('owner', 'name email avatar');

    res.json(orgs);
  } catch (error) {
    next(error);
  }
};

// 3. Get Organization Detail
export const getOrgById = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.orgId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name username email avatar position department role');

    if (!org) {
      res.status(404);
      return next(new Error('Organization not found'));
    }

    res.json(org);
  } catch (error) {
    next(error);
  }
};

// 4. Update Organization
export const updateOrg = async (req, res, next) => {
  try {
    const { name, description, logo, departments } = req.body;
    const org = await Organization.findById(req.params.orgId);

    if (!org) {
      res.status(404);
      return next(new Error('Organization not found'));
    }

    // Only Owner and Org Admin can update details
    const userMember = org.members.find(m => m.user.toString() === req.user.id);
    if (org.owner.toString() !== req.user.id && (!userMember || userMember.role !== 'Organization Admin')) {
      res.status(403);
      return next(new Error('Not authorized to update this organization'));
    }

    if (name) org.name = name;
    if (description !== undefined) org.description = description;
    if (logo !== undefined) org.logo = logo;
    if (departments) org.departments = departments;

    await org.save();
    res.json({ message: 'Organization updated successfully', organization: org });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Organization
export const deleteOrg = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.orgId);
    if (!org) {
      res.status(404);
      return next(new Error('Organization not found'));
    }

    if (org.owner.toString() !== req.user.id && req.user.role !== 'Super Admin') {
      res.status(403);
      return next(new Error('Only the owner can delete this organization'));
    }

    await Organization.findByIdAndDelete(req.params.orgId);
    // Cleanup users' org links
    await User.updateMany({ organization: req.params.orgId }, { $unset: { organization: '' } });

    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 6. Invite Member by Email
export const inviteMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const org = await Organization.findById(req.params.orgId);
    if (!org) {
      res.status(404);
      return next(new Error('Organization not found'));
    }

    // Check if user is already a member
    let invitedUser = await User.findOne({ email: email.toLowerCase() });
    
    if (invitedUser) {
      const alreadyMember = org.members.some(m => m.user.toString() === invitedUser._id.toString());
      if (alreadyMember) {
        res.status(400);
        return next(new Error('User is already a member of this organization'));
      }
    } else {
      // Mock account if user doesn't exist
      const mockPassword = crypto?.randomBytes?.(16).toString('hex') || 'InvitedUserTempPass123!';
      const mockUsername = `${email.split('@')[0]}_${Math.floor(1000 + Math.random() * 9000)}`;
      invitedUser = await User.create({
        name: email.split('@')[0],
        email: email.toLowerCase(),
        username: mockUsername,
        password: mockPassword,
        role: role || 'Developer',
        isVerified: false,
      });
    }

    org.members.push({ user: invitedUser._id, role: role || 'Developer' });
    await org.save();

    // Send Invite Email
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const inviteLink = `${clientUrl}/login?orgInvite=${org._id}`;
    await sendOrgInvite(invitedUser.email, req.user.name, org.name, inviteLink);

    res.json({
      message: `Invitation email sent to ${email}`,
      member: {
        user: {
          _id: invitedUser._id,
          name: invitedUser.name,
          email: invitedUser.email,
          role: invitedUser.role,
        },
        role: role || 'Developer',
      }
    });
  } catch (error) {
    next(error);
  }
};

// 7. Remove Member
export const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const org = await Organization.findById(req.params.orgId);
    if (!org) {
      res.status(404);
      return next(new Error('Organization not found'));
    }

    if (org.owner.toString() === userId.toString()) {
      res.status(400);
      return next(new Error('Cannot remove the owner of the organization'));
    }

    // Only owner/admins can remove
    const userMember = org.members.find(m => m.user.toString() === req.user.id);
    if (org.owner.toString() !== req.user.id && (!userMember || userMember.role !== 'Organization Admin')) {
      res.status(403);
      return next(new Error('Not authorized to manage members'));
    }

    org.members = org.members.filter(m => m.user.toString() !== userId.toString());
    await org.save();

    // Clean user reference
    await User.findByIdAndUpdate(userId, { $unset: { organization: '' } });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
};

// 8. Update Member Org Role
export const updateMemberRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const org = await Organization.findById(req.params.orgId);
    if (!org) {
      res.status(404);
      return next(new Error('Organization not found'));
    }

    const userMember = org.members.find(m => m.user.toString() === req.user.id);
    if (org.owner.toString() !== req.user.id && (!userMember || userMember.role !== 'Organization Admin')) {
      res.status(403);
      return next(new Error('Not authorized to change member roles'));
    }

    const memberToChange = org.members.find(m => m.user.toString() === userId.toString());
    if (!memberToChange) {
      res.status(404);
      return next(new Error('Member not found in this organization'));
    }

    memberToChange.role = role;
    await org.save();

    res.json({ message: 'Member role updated successfully', member: memberToChange });
  } catch (error) {
    next(error);
  }
};

// 9. Fetch Organization Dashboard Metrics
export const getOrgAnalytics = async (req, res, next) => {
  try {
    const orgId = req.params.orgId;
    const projectCount = await Project.countDocuments({ organization: orgId });
    const teamCount = await Team.countDocuments({ organization: orgId });
    const org = await Organization.findById(orgId);
    const memberCount = org ? org.members.length : 0;

    res.json({
      projects: projectCount,
      teams: teamCount,
      members: memberCount,
    });
  } catch (error) {
    next(error);
  }
};
