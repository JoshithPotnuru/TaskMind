import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
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
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: [
            'Organization Admin',
            'Project Manager',
            'Team Lead',
            'Developer',
            'Tester',
            'Client',
            'Guest',
          ],
          default: 'Developer',
        },
      },
    ],
    departments: [
      {
        type: String,
        trim: true,
      },
    ],
    logo: {
      type: String,
      default: '',
    },
    settings: {
      allowUserInvites: { type: Boolean, default: true },
      restrictedDomain: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

const Organization = mongoose.model('Organization', OrganizationSchema);
export default Organization;
