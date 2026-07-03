import Notification from '../models/Notification.js';

// 1. Get User Notifications
export const getNotifications = async (req, res, next) => {
  try {
    const { isRead, isArchived } = req.query;
    const filter = { recipient: req.user._id };

    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (isArchived !== undefined) filter.isArchived = isArchived === 'true';
    else filter.isArchived = false; // default don't show archived

    const notifications = await Notification.find(filter)
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// 2. Mark Notification as Read
export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);
    if (!notification) {
      res.status(404);
      return next(new Error('Notification not found'));
    }

    if (notification.recipient.toString() !== req.user.id) {
      res.status(403);
      return next(new Error('Not authorized to read this notification'));
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    next(error);
  }
};

// 3. Mark All as Read
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// 4. Archive Notification
export const archiveNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);
    if (!notification) {
      res.status(404);
      return next(new Error('Notification not found'));
    }

    if (notification.recipient.toString() !== req.user.id) {
      res.status(403);
      return next(new Error('Not authorized'));
    }

    notification.isArchived = true;
    await notification.save();

    res.json({ message: 'Notification archived successfully', notification });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Notification
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);
    if (!notification) {
      res.status(404);
      return next(new Error('Notification not found'));
    }

    if (notification.recipient.toString() !== req.user.id) {
      res.status(403);
      return next(new Error('Not authorized'));
    }

    await Notification.findByIdAndDelete(req.params.notificationId);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};
