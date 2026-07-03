import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // For 1-to-1 Chat
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // For Project Group Chat
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    // For Team Group Chat
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    text: {
      type: String,
      default: '',
    },
    attachment: {
      name: { type: String },
      url: { type: String },
      fileType: { type: String }, // e.g., image, pdf, doc
    },
    voiceMessageUrl: {
      type: String,
      default: '',
    },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', MessageSchema);
export default Message;
