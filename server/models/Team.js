import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
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
          enum: ['Team Lead', 'Developer', 'Tester', 'Client', 'Guest'],
          default: 'Developer',
        },
      },
    ],
    inviteLinkCode: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Team = mongoose.model('Team', TeamSchema);
export default Team;
