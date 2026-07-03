import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['Project Manager', 'Team Lead', 'Developer', 'Tester', 'Client', 'Guest'],
          default: 'Developer',
        },
      },
    ],
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
      },
    ],
    startDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
    },
    budget: {
      type: Number,
      default: 0,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Backlog', 'Planning', 'Active', 'Completed', 'On Hold', 'Cancelled'],
      default: 'Active',
    },
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
    color: {
      type: String,
      default: '#4F46E5', // Indigo
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    milestones: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        dueDate: { type: Date },
        status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', ProjectSchema);
export default Project;
