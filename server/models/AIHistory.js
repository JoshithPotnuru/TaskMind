import mongoose from 'mongoose';

const AIHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    feature: {
      type: String,
      required: true,
      enum: [
        'PRIORITIZATION',
        'TASK_GENERATION',
        'SMART_SEARCH',
        'DEADLINE_PREDICTION',
        'SPRINT_PLANNING',
        'CODE_ASSISTANT',
        'MEETING_SUMMARY',
        'PRODUCTIVITY_INSIGHTS',
        'RISK_DETECTION',
        'CHAT_COMPLETION',
      ],
    },
    prompt: {
      type: String,
      required: true,
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const AIHistory = mongoose.model('AIHistory', AIHistorySchema);
export default AIHistory;
