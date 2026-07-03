import * as aiService from '../services/aiService.js';
import AIHistory from '../models/AIHistory.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

// 1. Task Prioritize
export const prioritizeTask = async (req, res, next) => {
  try {
    const { taskId } = req.body;
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const result = await aiService.prioritizeTask({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      checklistCount: task.checklist.length,
      storyPoints: task.storyPoints,
    });

    // Sanitize and update Task Priority in DB
    let validatedPriority = result.priority || 'Medium';
    validatedPriority = validatedPriority.charAt(0).toUpperCase() + validatedPriority.slice(1).toLowerCase();
    if (!['Low', 'Medium', 'High', 'Critical'].includes(validatedPriority)) {
      validatedPriority = 'Medium';
    }

    task.priority = validatedPriority;
    task.activityLogs.push({
      user: req.user._id,
      action: 'AI Prioritized Task',
      details: `AI set priority to: ${validatedPriority}. Reason: ${result.reasoning}`,
    });
    await task.save();

    // Log in History
    await AIHistory.create({
      user: req.user._id,
      feature: 'PRIORITIZATION',
      prompt: `Prioritize task: ${task.title}`,
      response: result,
    });

    res.json({ message: 'Task prioritized by AI successfully', priority: result.priority, reasoning: result.reasoning });
  } catch (error) {
    next(error);
  }
};

// 2. Task Generator
export const generateTask = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400);
      return next(new Error('Prompt is required'));
    }

    const result = await aiService.generateTaskFromPrompt(prompt);

    await AIHistory.create({
      user: req.user._id,
      feature: 'TASK_GENERATION',
      prompt,
      response: result,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 3. Smart Search
export const smartSearch = async (req, res, next) => {
  try {
    const { query, projectId } = req.body;
    if (!query) {
      res.status(400);
      return next(new Error('Query is required'));
    }

    const result = await aiService.parseSmartSearchQuery(query);

    // Build Mongoose Query based on AI response filters
    const searchFilter = { project: projectId };
    if (result.filters.status) {
      searchFilter.status = result.filters.status;
    }
    if (result.filters.priority) {
      searchFilter.priority = result.filters.priority;
    }
    if (result.filters.isOverdue) {
      searchFilter.dueDate = { $lt: new Date() };
      searchFilter.status = { $ne: 'Completed' };
    }
    if (result.filters.dueWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + result.filters.dueWithinDays);
      searchFilter.dueDate = { $gte: new Date(), $lte: futureDate };
    }

    let tasks = [];
    if (result.filters.assigneeName) {
      const users = await User.find({ name: { $regex: result.filters.assigneeName, $options: 'i' } });
      const userIds = users.map(u => u._id);
      searchFilter.assignedUsers = { $in: userIds };
    }

    tasks = await Task.find(searchFilter).populate('assignedUsers', 'name username email avatar');

    await AIHistory.create({
      user: req.user._id,
      feature: 'SMART_SEARCH',
      prompt: query,
      response: { result, tasksCount: tasks.length },
    });

    res.json({ parsedFilters: result.filters, tasks });
  } catch (error) {
    next(error);
  }
};

// 4. Deadline Prediction
export const predictDeadline = async (req, res, next) => {
  try {
    const { taskId } = req.body;
    const task = await Task.findById(taskId).populate('assignedUsers');
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    const result = await aiService.predictDeadlineRisk({
      title: task.title,
      storyPoints: task.storyPoints,
      estimatedTime: task.estimatedTime,
      subtasksCount: task.checklist.length,
      dueDate: task.dueDate || new Date(),
      assigneeCount: task.assignedUsers.length,
    });

    await AIHistory.create({
      user: req.user._id,
      feature: 'DEADLINE_PREDICTION',
      prompt: `Predict risk for task: ${task.title}`,
      response: result,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 5. Sprint Planner
export const planSprint = async (req, res, next) => {
  try {
    const { projectId, weeks } = req.body;
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    const tasks = await Task.find({ project: projectId, status: { $ne: 'Completed' } });
    const members = await User.find({ _id: { $in: project.members.map(m => m.user) } });

    const result = await aiService.planSprintTasks({
      weeks: weeks || 2,
      tasks: tasks.map(t => ({ id: t._id, title: t.title, storyPoints: t.storyPoints })),
      team: members.map(m => ({ id: m._id, name: m.name })),
    });

    await AIHistory.create({
      user: req.user._id,
      feature: 'SPRINT_PLANNING',
      prompt: `Plan sprint for project: ${project.title}`,
      response: result,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 6. Code Assistant
export const codeAssistant = async (req, res, next) => {
  try {
    const { code, request } = req.body;
    if (!request) {
      res.status(400);
      return next(new Error('Request/Prompt is required'));
    }

    const result = await aiService.suggestCodeChanges({ code, request });

    await AIHistory.create({
      user: req.user._id,
      feature: 'CODE_ASSISTANT',
      prompt: request,
      response: result,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 7. Meeting Summary
export const summarizeMeeting = async (req, res, next) => {
  try {
    const { transcript, projectId, title } = req.body;
    if (!transcript) {
      res.status(400);
      return next(new Error('Transcript is required'));
    }

    const result = await aiService.summarizeMeetingTranscript(transcript);

    // Create Tasks recommended by AI in the project
    const createdTasks = [];
    if (projectId && result.tasks && result.tasks.length > 0) {
      const projectDoc = await Project.findById(projectId);
      if (projectDoc) {
        for (const t of result.tasks) {
          let tPriority = t.priority || 'Medium';
          tPriority = tPriority.charAt(0).toUpperCase() + tPriority.slice(1).toLowerCase();
          if (!['Low', 'Medium', 'High', 'Critical'].includes(tPriority)) {
            tPriority = 'Medium';
          }

          const newTask = await Task.create({
            title: t.title,
            description: t.description,
            priority: tPriority,
            estimatedTime: t.estimatedTime || 2,
            project: projectId,
            organization: projectDoc.organization,
          });
          createdTasks.push(newTask._id);
        }
      }
    }

    await AIHistory.create({
      user: req.user._id,
      feature: 'MEETING_SUMMARY',
      prompt: `Summarize transcript for: ${title || 'Meeting'}`,
      response: result,
    });

    res.json({
      summary: result.summary,
      actionItems: result.actionItems,
      createdTasksCount: createdTasks.length,
    });
  } catch (error) {
    next(error);
  }
};

// 8. Productivity Insights
export const getProductivityInsights = async (req, res, next) => {
  try {
    const completedTasks = await Task.countDocuments({
      assignedUsers: req.user._id,
      status: 'Completed',
    });

    const overdueTasks = await Task.countDocuments({
      assignedUsers: req.user._id,
      dueDate: { $lt: new Date() },
      status: { $ne: 'Completed' },
    });

    const result = await aiService.generateProductivityInsights({
      completedCount: completedTasks,
      totalHours: 15, // Mock total hours tracked
      overdueCount: overdueTasks,
      efficiencyScore: completedTasks > 0 ? Math.min(100, Math.floor((completedTasks / (completedTasks + overdueTasks || 1)) * 100)) : 75,
    });

    await AIHistory.create({
      user: req.user._id,
      feature: 'PRODUCTIVITY_INSIGHTS',
      prompt: `Generate insights for ${req.user.name}`,
      response: result,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 9. Risk Detection
export const detectRisks = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    const activeTasks = await Task.countDocuments({ project: projectId, status: { $ne: 'Completed' } });
    const overdueTasks = await Task.countDocuments({ project: projectId, dueDate: { $lt: new Date() }, status: { $ne: 'Completed' } });
    const blockedTasks = await Task.countDocuments({ project: projectId, status: 'Blocked' });
    const project = await Project.findById(projectId);

    const result = await aiService.detectProjectRisks({
      activeCount: activeTasks,
      overdueCount: overdueTasks,
      blockedCount: blockedTasks,
      completedMilestones: project ? project.milestones.filter(m => m.status === 'Completed').length : 0,
      totalMilestones: project ? project.milestones.length : 0,
    });

    await AIHistory.create({
      user: req.user._id,
      feature: 'RISK_DETECTION',
      prompt: `Detect risk for project: ${projectId}`,
      response: result,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 10. Chat Q&A Completion
export const chatCompletion = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) {
      res.status(400);
      return next(new Error('Question is required'));
    }

    const result = await aiService.answerGeneralQuestion(question);

    await AIHistory.create({
      user: req.user._id,
      feature: 'CHAT_COMPLETION',
      prompt: question,
      response: result,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
