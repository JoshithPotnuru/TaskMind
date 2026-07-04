import openai from '../config/openai.js';

// Helper to safely call OpenAI and parse JSON responses
const callOpenAI = async (prompt, fallbackObj) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const isMockKey = !apiKey || 
      apiKey === 'mock-key-for-now-if-not-set' || 
      apiKey.startsWith('your_') || 
      apiKey.startsWith('mock') || 
      apiKey.includes('placeholder');

    if (isMockKey) {
      console.log('OpenAI Key not set or is placeholder, using simulated fallback');
      return fallbackObj;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error(`OpenAI error: ${error.message}`);
    return fallbackObj;
  }
};

// 1. Task Prioritization
export const prioritizeTask = async (taskData) => {
  const prompt = `
    Analyze the following task and determine its priority.
    Input Task Details:
    - Title: "${taskData.title}"
    - Description: "${taskData.description || 'No description'}"
    - Due Date: ${taskData.dueDate || 'No due date'}
    - Subtasks/Checklist Count: ${taskData.checklistCount || 0}
    - Story Points: ${taskData.storyPoints || 1}

    Return a JSON object with this exact format:
    {
      "priority": "Low" | "Medium" | "High" | "Critical",
      "reasoning": "Brief explanation of why this priority was chosen"
    }
  `;

  const fallback = {
    priority: taskData.dueDate && new Date(taskData.dueDate) - new Date() < 2 * 24 * 60 * 60 * 1000 ? 'Critical' : 'Medium',
    reasoning: 'System calculated base priority based on due date proximity.',
  };

  return await callOpenAI(prompt, fallback);
};

// 2. AI Task Generator
export const generateTaskFromPrompt = async (userInput) => {
  const prompt = `
    Generate a complete project task detail from this user query: "${userInput}"
    Return a JSON object with this exact format:
    {
      "title": "Clear concise task title",
      "description": "Professional markdown-formatted detailed description",
      "checklist": ["Step 1 to accomplish", "Step 2 to accomplish"],
      "subtasks": [
        { "title": "Subtask 1", "estimatedTime": 2 },
        { "title": "Subtask 2", "estimatedTime": 3 }
      ],
      "estimatedTime": 5, // total hours
      "requiredSkills": ["Skill1", "Skill2"],
      "suggestedRole": "Developer" | "Tester" | "Project Manager",
      "dependencies": []
    }
  `;

  const fallback = {
    title: userInput,
    description: `Auto-generated outline for: ${userInput}`,
    checklist: ['Setup environment', 'Implement core requirements', 'Run test checks'],
    subtasks: [
      { title: 'Configuration & setup', estimatedTime: 2 },
      { title: 'Feature development', estimatedTime: 6 },
    ],
    estimatedTime: 8,
    requiredSkills: ['Node.js', 'React'],
    suggestedRole: 'Developer',
    dependencies: [],
  };

  return await callOpenAI(prompt, fallback);
};

// 3. AI Smart Search
export const parseSmartSearchQuery = async (queryText) => {
  const prompt = `
    Analyze this natural language project search query: "${queryText}"
    Extract filters for query parameters.
    The status enum values are: Backlog, Todo, In Progress, Review, Testing, Blocked, Completed, Archived.
    The priority enum values are: Low, Medium, High, Critical.
    
    Return a JSON object with this exact format:
    {
      "query": "search query text or empty string",
      "filters": {
        "status": "In Progress" | "Todo" | etc. (optional),
        "priority": "Low" | "Medium" | "High" | "Critical" (optional),
        "assigneeName": "name of person if mentioned" (optional),
        "isOverdue": true | false (optional),
        "dueWithinDays": number (optional)
      }
    }
  `;

  const fallback = {
    query: queryText,
    filters: {},
  };

  return await callOpenAI(prompt, fallback);
};

// 4. AI Deadline Prediction
export const predictDeadlineRisk = async (taskDetails) => {
  const prompt = `
    Analyze this task and estimate completion risks.
    - Title: "${taskDetails.title}"
    - Story Points: ${taskDetails.storyPoints}
    - Estimated Time: ${taskDetails.estimatedTime} hours
    - Subtasks: ${taskDetails.subtasksCount || 0}
    - Due Date: ${taskDetails.dueDate}
    - Assignee Count: ${taskDetails.assigneeCount || 0}

    Return a JSON object with this exact format:
    {
      "completionDate": "YYYY-MM-DD",
      "delayProbability": 45, // percentage integer 0-100
      "riskPercentage": 30, // overall risk percentage 0-100
      "factors": ["Factor 1 description", "Factor 2 description"],
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    }
  `;

  const fallback = {
    completionDate: taskDetails.dueDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    delayProbability: 25,
    riskPercentage: 20,
    factors: ['Estimated complexity matches timeline.'],
    recommendations: ['Maintain current workload distribution.'],
  };

  return await callOpenAI(prompt, fallback);
};

// 5. AI Sprint Planner
export const planSprintTasks = async (sprintRequirements) => {
  const prompt = `
    Create a sprint workload distribution from these details:
    - Sprint Duration: ${sprintRequirements.weeks || 2} weeks
    - Tasks list: ${JSON.stringify(sprintRequirements.tasks)}
    - Team Capacity: ${JSON.stringify(sprintRequirements.team)}

    Return a JSON object with this exact format:
    {
      "sprintName": "Sprint name suggestion",
      "goal": "Main sprint objective description",
      "allocations": [
        { "taskId": "id", "assignedUserId": "id", "storyPoints": 3, "sprintWeek": 1 }
      ],
      "balanceScore": 85, // 0-100 score of workload balancing
      "sprintSummary": "Sprint outlook overview text"
    }
  `;

  const fallback = {
    sprintName: 'Sprint Auto-Plan Alpha',
    goal: 'Deliver core features on schedule.',
    allocations: (sprintRequirements.tasks || []).map((t, idx) => ({
      taskId: t._id || t.id,
      assignedUserId: sprintRequirements.team?.[idx % sprintRequirements.team.length]?._id || null,
      storyPoints: t.storyPoints || 2,
      sprintWeek: 1,
    })),
    balanceScore: 90,
    sprintSummary: 'Tasks allocated based on resource availability.',
  };

  return await callOpenAI(prompt, fallback);
};

// 6. AI Code Assistant
export const suggestCodeChanges = async (codeDetails) => {
  const prompt = `
    Analyze this code snippet/request and offer assistance:
    - User Request: "${codeDetails.request}"
    - Code Context:
    \`\`\`
    ${codeDetails.code}
    \`\`\`

    Return a JSON object with this exact format:
    {
      "suggestedCode": "clean code implementation string",
      "bugFixes": "any issues found and how to fix them",
      "optimizations": "efficiency, formatting, or speed recommendations",
      "explanation": "concise description of the suggested solution"
    }
  `;

  const fallback = {
    suggestedCode: '// Code review response\nconsole.log("Mock review complete");',
    bugFixes: 'None identified.',
    optimizations: 'Verify standard dependencies are included.',
    explanation: 'Provided baseline code template.',
  };

  return await callOpenAI(prompt, fallback);
};

// 7. AI Meeting Summary
export const summarizeMeetingTranscript = async (transcriptText) => {
  const prompt = `
    Process the following meeting transcript. Generate a summary, key action items, and clear tasks.
    Transcript:
    "${transcriptText}"

    Return a JSON object with this exact format:
    {
      "summary": "Professional executive summary paragraph",
      "actionItems": [
        "Action item 1 detailing owner and objective",
        "Action item 2 detailing owner and objective"
      ],
      "tasks": [
        {
          "title": "Suggested Task Title",
          "description": "Detailed description of the subtask",
          "priority": "Low" | "Medium" | "High" | "Critical",
          "estimatedTime": 4 // hours
        }
      ]
    }
  `;

  const fallback = {
    summary: 'Meeting summary: Discussed general project milestones and alignment.',
    actionItems: ['Align with frontend teams on layouts', 'Finalize database index optimizations'],
    tasks: [
      { title: 'Optimize Database Queries', description: 'Apply indexing to heavy collection operations.', priority: 'High', estimatedTime: 4 },
    ],
  };

  return await callOpenAI(prompt, fallback);
};

// 8. AI Productivity Insights
export const generateProductivityInsights = async (userMetrics) => {
  const prompt = `
    Generate personal productivity insights for a user based on these weekly metrics:
    - Completed Tasks: ${userMetrics.completedCount}
    - Total Tracked Time: ${userMetrics.totalHours} hours
    - Overdue Tasks: ${userMetrics.overdueCount}
    - Efficiency Score: ${userMetrics.efficiencyScore || 80}

    Return a JSON object with this exact format:
    {
      "productivityScore": 82, // 0-100
      "focusTime": "Estimated focus vs distraction details",
      "workloadAnalysis": "Detailed review of their current workload allocation",
      "suggestions": [
        "Actionable tip 1 to optimize focus",
        "Actionable tip 2 to optimize workload"
      ]
    }
  `;

  const fallback = {
    productivityScore: 78,
    focusTime: '60% focus work, 40% collaboration/meetings.',
    workloadAnalysis: 'Workload is moderate. Focus on clearing backlog items.',
    suggestions: ['Consider chunking coding hours into Pomodoro cycles.', 'Set strict daily priority items.'],
  };

  return await callOpenAI(prompt, fallback);
};

// 9. AI Risk Detection
export const detectProjectRisks = async (projectStatus) => {
  const prompt = `
    Analyze this project dashboard status and identify bottleneck risks:
    - Active Tasks: ${projectStatus.activeCount}
    - Overdue Tasks: ${projectStatus.overdueCount}
    - Blocked Tasks: ${projectStatus.blockedCount}
    - Milestone Progress: ${projectStatus.completedMilestones}/${projectStatus.totalMilestones}

    Return a JSON object with this exact format:
    {
      "delayedProjects": ["Project name if delayed"],
      "employeeOverload": ["Usernames/emails of overloaded members"],
      "missedDeadlines": ["List of tasks missing timelines"],
      "bottlenecks": ["System bottlenecks detected and descriptions"],
      "riskScore": 60 // 0-100 overall project danger score
    }
  `;

  const fallback = {
    delayedProjects: projectStatus.overdueCount > 5 ? ['Current Active Project'] : [],
    employeeOverload: [],
    missedDeadlines: [],
    bottlenecks: projectStatus.blockedCount > 2 ? ['High number of blocked tasks holding up sprints'] : [],
    riskScore: 25,
  };

  return await callOpenAI(prompt, fallback);
};

// 10. AI Chat Q&A
export const answerGeneralQuestion = async (question) => {
  const prompt = `
    Answer the following question in a professional, direct, and concise manner.
    Question: "${question}"

    Return a JSON object with this exact format:
    {
      "answer": "Markdown-formatted text answer to the user's question"
    }
  `;

  const fallback = {
    answer: `Here is a simulated answer for your question: "${question}". To unlock real-time completions, configure a valid OPENAI_API_KEY in the backend environment.`,
  };

  return await callOpenAI(prompt, fallback);
};
