import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Team from '../models/Team.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import TimeTracking from '../models/TimeTracking.js';
import ActivityLog from '../models/ActivityLog.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Team.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Comment.deleteMany({});
    await TimeTracking.deleteMany({});
    await ActivityLog.deleteMany({});

    console.log('Creating user accounts...');
    
    // Create Users (Mongoose pre-save hook will hash passwords)
    const superAdmin = await User.create({
      name: 'Super Admin User',
      email: 'admin@taskmind.com',
      username: 'admin',
      password: 'password123',
      role: 'Super Admin',
      isVerified: true,
      position: 'Global Administrator',
      department: 'IT Infrastructure',
      skills: ['DevOps', 'Security', 'Management'],
    });

    const orgAdmin = await User.create({
      name: 'Sarah Jenkins',
      email: 'orgadmin@taskmind.com',
      username: 'sarah',
      password: 'password123',
      role: 'Organization Admin',
      isVerified: true,
      position: 'VP of Product',
      department: 'Management',
      skills: ['Operations', 'Scrum', 'Leadership'],
    });

    const pm = await User.create({
      name: 'Marcus Brody',
      email: 'pm@taskmind.com',
      username: 'marcus',
      password: 'password123',
      role: 'Project Manager',
      isVerified: true,
      position: 'Senior Project Manager',
      department: 'Delivery',
      skills: ['Agile', 'Jira', 'Planning'],
    });

    const dev1 = await User.create({
      name: 'Alex Rivera',
      email: 'dev1@taskmind.com',
      username: 'alex',
      password: 'password123',
      role: 'Developer',
      isVerified: true,
      position: 'Full Stack Engineer',
      department: 'Engineering',
      skills: ['Node.js', 'React', 'MongoDB', 'GraphQL'],
    });

    const dev2 = await User.create({
      name: 'Priya Patel',
      email: 'dev2@taskmind.com',
      username: 'priya',
      password: 'password123',
      role: 'Developer',
      isVerified: true,
      position: 'Frontend Specialist',
      department: 'Engineering',
      skills: ['React', 'CSS', 'Tailwind', 'Framer Motion'],
    });

    const tester = await User.create({
      name: 'Tom Miller',
      email: 'tester@taskmind.com',
      username: 'tom',
      password: 'password123',
      role: 'Tester',
      isVerified: true,
      position: 'QA Engineer',
      department: 'Quality Assurance',
      skills: ['Jest', 'Selenium', 'Cypress'],
    });

    const client = await User.create({
      name: 'John Doe',
      email: 'client@taskmind.com',
      username: 'john',
      password: 'password123',
      role: 'Client',
      isVerified: true,
      position: 'Product Owner',
      department: 'Client Relations',
    });

    console.log('Seeding organization...');
    
    // Create Organization
    const org = await Organization.create({
      name: 'TechMind Solutions',
      slug: 'techmind',
      description: 'Enterprise consulting and software product factory',
      owner: orgAdmin._id,
      departments: ['Engineering', 'Product', 'QA', 'HR', 'Sales'],
      members: [
        { user: orgAdmin._id, role: 'Organization Admin' },
        { user: pm._id, role: 'Project Manager' },
        { user: dev1._id, role: 'Developer' },
        { user: dev2._id, role: 'Developer' },
        { user: tester._id, role: 'Tester' },
        { user: client._id, role: 'Client' },
      ],
    });

    // Update users' org reference
    await User.updateMany(
      { _id: { $in: [orgAdmin._id, pm._id, dev1._id, dev2._id, tester._id, client._id] } },
      { organization: org._id }
    );

    console.log('Seeding teams...');
    
    // Create Team
    const coreTeam = await Team.create({
      name: 'Core Product Team',
      description: 'Engineers building the taskmind platform',
      organization: org._id,
      members: [
        { user: pm._id, role: 'Team Lead' },
        { user: dev1._id, role: 'Developer' },
        { user: dev2._id, role: 'Developer' },
        { user: tester._id, role: 'Tester' },
      ],
      inviteLinkCode: 'join-core-team-abcde',
    });

    console.log('Seeding projects...');
    
    // Create Project
    const project = await Project.create({
      title: 'Smart Task Management Platform',
      description: 'Building an enterprise-level SaaS project manager with integrated AI workflows.',
      owner: pm._id,
      organization: org._id,
      teams: [coreTeam._id],
      members: [
        { user: pm._id, role: 'Project Manager' },
        { user: dev1._id, role: 'Developer' },
        { user: dev2._id, role: 'Developer' },
        { user: tester._id, role: 'Tester' },
        { user: client._id, role: 'Client' },
      ],
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      budget: 150000,
      priority: 'High',
      status: 'Active',
      color: '#4F46E5',
      labels: ['v1.0', 'SaaS', 'AI-Integrations'],
      milestones: [
        { title: 'Alpha API Setup', description: 'Setup all models, routing, controller flows.', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), status: 'Pending' },
        { title: 'Sleek UI Beta', description: 'Implement layouts, forms, and drag & drop kanban.', dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), status: 'Pending' },
      ],
    });

    console.log('Seeding tasks...');
    
    // Task 1: Complete Backend Models
    const t1 = await Task.create({
      title: 'Define MongoDB Mongoose Schemas',
      description: 'Design and implement optimized schemas for User, Org, Team, Project, Task, Comment, etc.',
      priority: 'High',
      status: 'Completed',
      startDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      estimatedTime: 8,
      actualTime: 7.5,
      storyPoints: 3,
      labels: ['Backend', 'Database'],
      tags: ['MongoDB', 'Mongoose'],
      assignedUsers: [dev1._id],
      project: project._id,
      organization: org._id,
      checklist: [
        { text: 'Create User schema with password hooks', isCompleted: true },
        { text: 'Create Project schema with attachment support', isCompleted: true },
        { text: 'Verify indices and model relations', isCompleted: true },
      ],
    });

    // Task 2: Build Real-time Socket Service
    const t2 = await Task.create({
      title: 'Integrate Socket.IO Channels',
      description: 'Implement real-time updates for chat rooms, active board states, and alerts.',
      priority: 'High',
      status: 'In Progress',
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      estimatedTime: 12,
      actualTime: 9.0,
      storyPoints: 5,
      labels: ['Backend', 'Sockets'],
      tags: ['Socket.IO'],
      assignedUsers: [dev1._id, dev2._id],
      project: project._id,
      organization: org._id,
      checklist: [
        { text: 'Register user online statuses', isCompleted: true },
        { text: 'Broadcast drag and drop board placements', isCompleted: false },
        { text: 'Build voice-chat indicators', isCompleted: false },
      ],
    });

    // Task 3: Build Gantt Chart Layout
    const t3 = await Task.create({
      title: 'Create Timeline Gantt Chart UI',
      description: 'Build a custom svg/css visualizer for project progress, milestones, and task dependencies.',
      priority: 'Medium',
      status: 'Todo',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      estimatedTime: 16,
      actualTime: 0,
      storyPoints: 8,
      labels: ['Frontend', 'UI/UX'],
      tags: ['CSS', 'SVG'],
      assignedUsers: [dev2._id],
      project: project._id,
      organization: org._id,
      dependencies: [t1._id],
      checklist: [
        { text: 'Layout svg bars matching start and end dates', isCompleted: false },
        { text: 'Add tooltip for hover state details', isCompleted: false },
      ],
    });

    // Task 4: Write API Integration Tests
    const t4 = await Task.create({
      title: 'Write Jest API Tests',
      description: 'Verify security route locks, authentications, project memberships, and task creation rules.',
      priority: 'Low',
      status: 'Backlog',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      estimatedTime: 10,
      actualTime: 0,
      storyPoints: 3,
      labels: ['QA', 'Testing'],
      tags: ['Jest', 'Supertest'],
      assignedUsers: [tester._id],
      project: project._id,
      organization: org._id,
      checklist: [
        { text: 'Write Auth registration validations', isCompleted: false },
        { text: 'Mock Cloudinary endpoints', isCompleted: false },
      ],
    });

    console.log('Seeding comments & audit tracking...');
    
    // Add comment to In Progress Task
    await Comment.create({
      task: t2._id,
      user: pm._id,
      text: 'Great progress on Sockets. Can we ensure the connection falls back cleanly to polling in slow networks?',
    });

    await Comment.create({
      task: t2._id,
      user: dev1._id,
      text: 'Yes! Socket.IO handles polling fallback automatically. I will double-check the connection configs.',
    });

    // Add time tracking log
    await TimeTracking.create({
      task: t1._id,
      user: dev1._id,
      startTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 + 4 * 3600 * 1000), // 4 hours
      duration: 4 * 3600,
      description: 'Designed schemas and indexes',
    });

    await ActivityLog.create({
      user: superAdmin._id,
      action: 'SYSTEM_SEED',
      details: 'System database successfully seeded with demo assets.',
    });

    console.log('Database successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error(`Database seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
