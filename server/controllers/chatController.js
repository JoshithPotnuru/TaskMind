import Message from '../models/Message.js';
import User from '../models/User.js';

// 1. Send Message (HTTP fallback/attachment handler)
export const sendMessage = async (req, res, next) => {
  try {
    const { text, recipientId, projectId, teamId, voiceMessageUrl } = req.body;
    let attachmentObj = undefined;

    if (req.file) {
      attachmentObj = {
        name: req.file.originalname,
        url: req.file.path, // Cloudinary secure_url
        fileType: req.file.mimetype.split('/')[0], // image, application (pdf/doc), etc.
      };
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId || null,
      project: projectId || null,
      team: teamId || null,
      text: text || '',
      attachment: attachmentObj,
      voiceMessageUrl: voiceMessageUrl || '',
      readBy: [{ user: req.user._id }],
    });

    const populatedMsg = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('recipient', 'name email avatar');

    res.status(201).json(populatedMsg);
  } catch (error) {
    next(error);
  }
};

// 2. Get Messages (1-to-1, Project, Team)
export const getMessages = async (req, res, next) => {
  try {
    const { recipientId, projectId, teamId } = req.query;
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = {};
    if (projectId) {
      filter.project = projectId;
    } else if (teamId) {
      filter.team = teamId;
    } else if (recipientId) {
      filter.$or = [
        { sender: req.user._id, recipient: recipientId },
        { sender: recipientId, recipient: req.user._id },
      ];
    } else {
      res.status(400);
      return next(new Error('Recipient, Project, or Team ID must be provided'));
    }

    const messages = await Message.find(filter)
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Return in chronological order
    res.json(messages.reverse());
  } catch (error) {
    next(error);
  }
};

// 3. Mark Conversation Messages as Read
export const markAsRead = async (req, res, next) => {
  try {
    const { roomId, roomType } = req.body; // roomType: 'direct' | 'project' | 'team'

    const filter = { 'readBy.user': { $ne: req.user._id } };

    if (roomType === 'project') {
      filter.project = roomId;
    } else if (roomType === 'team') {
      filter.team = roomId;
    } else {
      filter.recipient = req.user._id;
      filter.sender = roomId;
    }

    await Message.updateMany(filter, {
      $push: { readBy: { user: req.user._id } },
    });

    res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    next(error);
  }
};
