import TimeTracking from '../models/TimeTracking.js';
import Task from '../models/Task.js';

// 1. Start Timer
export const startTimer = async (req, res, next) => {
  try {
    const { taskId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    // Check if there is already an active timer running for this user
    const activeTimer = await TimeTracking.findOne({
      user: req.user._id,
      endTime: { $exists: false },
    });

    if (activeTimer) {
      res.status(400);
      return next(new Error('An active timer is already running. Stop it first.'));
    }

    const timer = await TimeTracking.create({
      task: taskId,
      user: req.user._id,
      startTime: new Date(),
    });

    res.status(201).json({ message: 'Timer started successfully', timer });
  } catch (error) {
    next(error);
  }
};

// 2. Stop Timer
export const stopTimer = async (req, res, next) => {
  try {
    const { timerId, description } = req.body;

    const timer = await TimeTracking.findById(timerId);
    if (!timer) {
      res.status(404);
      return next(new Error('Timer log not found'));
    }

    if (timer.user.toString() !== req.user.id) {
      res.status(403);
      return next(new Error('Not authorized to stop this timer'));
    }

    if (timer.endTime) {
      res.status(400);
      return next(new Error('Timer has already been stopped'));
    }

    timer.endTime = new Date();
    // Calculate duration in seconds
    timer.duration = Math.floor((timer.endTime - timer.startTime) / 1000);
    if (description) timer.description = description;
    await timer.save();

    // Increment actualTime in Task (convert seconds to hours)
    const hours = parseFloat((timer.duration / 3600).toFixed(2));
    await Task.findByIdAndUpdate(timer.task, {
      $inc: { actualTime: hours },
    });

    res.json({ message: 'Timer stopped successfully', timer, hoursTracked: hours });
  } catch (error) {
    next(error);
  }
};

// 3. Add Manual Time Entry
export const addManualEntry = async (req, res, next) => {
  try {
    const { taskId, startTime, endTime, durationHours, description } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const durationSec = durationHours ? durationHours * 3600 : Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    const calculatedHours = durationHours || parseFloat((durationSec / 3600).toFixed(2));

    const log = await TimeTracking.create({
      task: taskId,
      user: req.user._id,
      startTime: startTime || new Date(Date.now() - durationSec * 1000),
      endTime: endTime || new Date(),
      duration: durationSec,
      description: description || 'Manual entry',
      isManual: true,
    });

    // Update Task's cumulative tracked time
    task.actualTime = (task.actualTime || 0) + calculatedHours;
    task.activityLogs.push({
      user: req.user._id,
      action: 'Log Time',
      details: `Manually logged ${calculatedHours} hours.`,
    });
    await task.save();

    res.status(201).json({ message: 'Time logged successfully', log });
  } catch (error) {
    next(error);
  }
};

// 4. Get Time Logs with aggregations
export const getTimeLogs = async (req, res, next) => {
  try {
    const { taskId, projectId } = req.query;
    const filter = {};

    if (taskId) {
      filter.task = taskId;
    } else if (projectId) {
      const tasks = await Task.find({ project: projectId }).select('_id');
      filter.task = { $in: tasks.map(t => t._id) };
    } else {
      filter.user = req.user._id;
    }

    const logs = await TimeTracking.find(filter)
      .populate('task', 'title storyPoints')
      .populate('user', 'name email avatar')
      .sort({ startTime: -1 });

    res.json(logs);
  } catch (error) {
    next(error);
  }
};
