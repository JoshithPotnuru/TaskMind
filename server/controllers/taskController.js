import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';

// 1. Create Task
export const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, status, startDate, dueDate, estimatedTime, storyPoints, labels, tags, assignedUsers, project, dependencies, checklist } = req.body;

    const proj = await Project.findById(project);
    if (!proj) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const task = await Task.create({
      title,
      description,
      priority: priority || 'Medium',
      status: status || 'Todo',
      startDate: startDate || Date.now(),
      dueDate,
      estimatedTime: estimatedTime || 0,
      storyPoints: storyPoints || 1,
      labels: labels || [],
      tags: tags || [],
      assignedUsers: assignedUsers || [],
      project,
      organization: proj.organization,
      dependencies: dependencies || [],
      checklist: checklist || [],
      activityLogs: [
        {
          user: req.user._id,
          action: 'Created Task',
          details: `Task created under project: ${proj.title}`,
        },
      ],
    });

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Tasks with Filters
export const getTasks = async (req, res, next) => {
  try {
    const { projectId, status, priority, assigneeId, search } = req.query;
    const filter = {};

    if (projectId) filter.project = projectId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assigneeId) filter.assignedUsers = assigneeId;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(filter)
      .populate('assignedUsers', 'name username email avatar position')
      .populate('dependencies', 'title status')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// 3. Get Task Details
export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignedUsers', 'name username email avatar position')
      .populate('watchers', 'name email avatar')
      .populate('dependencies', 'title status priority')
      .populate('project', 'title color')
      .populate({
        path: 'activityLogs.user',
        select: 'name email avatar',
      });

    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    // Get Comments separately
    const comments = await Comment.find({ task: task._id })
      .populate('user', 'name username email avatar')
      .sort({ createdAt: -1 });

    res.json({ task, comments });
  } catch (error) {
    next(error);
  }
};

// 4. Update Task (With Audit Logging)
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const updates = req.body;
    const logEntries = [];

    // Detect updates and add audit log entries
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && JSON.stringify(task[key]) !== JSON.stringify(updates[key])) {
        const oldVal = task[key];
        const newVal = updates[key];
        logEntries.push({
          user: req.user._id,
          action: `Updated ${key}`,
          details: `Changed from "${JSON.stringify(oldVal)}" to "${JSON.stringify(newVal)}"`,
        });
        task[key] = updates[key];
      }
    });

    if (logEntries.length > 0) {
      task.activityLogs.push(...logEntries);
      await task.save();
    }

    const updatedTask = await Task.findById(task._id)
      .populate('assignedUsers', 'name username email avatar position')
      .populate('dependencies', 'title status');

    res.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Task
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    await Task.findByIdAndDelete(req.params.taskId);
    await Comment.deleteMany({ task: req.params.taskId });

    res.json({ message: 'Task and comments deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 6. Checklist Operations
export const addChecklistItem = async (req, res, next) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    task.checklist.push({ text, isCompleted: false });
    task.activityLogs.push({
      user: req.user._id,
      action: 'Added Checklist Item',
      details: `Added item: "${text}"`,
    });
    await task.save();

    res.json({ message: 'Checklist item added', task });
  } catch (error) {
    next(error);
  }
};

export const toggleChecklistItem = async (req, res, next) => {
  try {
    const { itemId, isCompleted } = req.body;
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const item = task.checklist.id(itemId);
    if (!item) {
      res.status(404);
      return next(new Error('Checklist item not found'));
    }

    item.isCompleted = isCompleted;
    task.activityLogs.push({
      user: req.user._id,
      action: 'Updated Checklist Item',
      details: `Set "${item.text}" completed: ${isCompleted}`,
    });
    await task.save();

    res.json({ message: 'Checklist item toggled', task });
  } catch (error) {
    next(error);
  }
};

// 7. Comments
export const addComment = async (req, res, next) => {
  try {
    const { text, parentCommentId } = req.body;
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const comment = await Comment.create({
      task: task._id,
      user: req.user._id,
      text,
      parentComment: parentCommentId || null,
    });

    task.activityLogs.push({
      user: req.user._id,
      action: 'Added Comment',
      details: `Added comment ID: ${comment._id}`,
    });
    await task.save();

    const populatedComment = await Comment.findById(comment._id).populate('user', 'name username email avatar');

    res.status(201).json({ message: 'Comment added successfully', comment: populatedComment });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      res.status(404);
      return next(new Error('Comment not found'));
    }

    if (comment.user.toString() !== req.user.id && req.user.role !== 'Super Admin') {
      res.status(403);
      return next(new Error('Not authorized to delete this comment'));
    }

    await Comment.findByIdAndDelete(req.params.commentId);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
