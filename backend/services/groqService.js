const Groq = require('groq-sdk');

const MODEL = "llama-3.3-70b-versatile";

// ✅ LAZY init - client created only when called, NOT at import time
// This fixes: "GROQ_API_KEY environment variable is missing or empty" server crash
const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in .env file');
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const generateTaskDescription = async (taskTitle) => {
  try {
    const groq = getGroqClient();
    console.log('🤖 Generating task description for:', taskTitle);
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a professional project manager assistant. Generate clear, actionable task descriptions.
          Format your response as JSON:
          {
            "description": "detailed description (2-3 sentences)",
            "subtasks": ["subtask 1", "subtask 2", "subtask 3"],
            "estimatedTime": "time estimate",
            "tips": "helpful tip for completing this task"
          }`
        },
        { role: "user", content: `Create a detailed task breakdown for: "${taskTitle}"` }
      ],
      model: MODEL,
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });
    const result = JSON.parse(completion.choices[0].message.content);
    console.log('✅ Task description generated');
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Groq AI error:', error);
    return {
      success: false,
      error: error.message,
      fallback: {
        description: `Complete the following task: ${taskTitle}`,
        subtasks: ["Research requirements", "Create action plan", "Execute and review"],
        estimatedTime: "TBD",
        tips: "Break down complex tasks into smaller steps"
      }
    };
  }
};

const generateTeamInsights = async (teamStats) => {
  try {
    const groq = getGroqClient();
    console.log('🤖 Generating team insights...');
    const { totalTasks, completedTasks, inProgressTasks, teamMembers, avgPoints } = teamStats;
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a team performance analyst. Provide actionable insights and motivational feedback.
          Format response as JSON:
          {
            "summary": "brief performance summary",
            "strengths": ["strength 1", "strength 2"],
            "improvements": ["suggestion 1", "suggestion 2"],
            "motivation": "motivational message"
          }`
        },
        {
          role: "user",
          content: `Analyze team performance:
          - Total Tasks: ${totalTasks}
          - Completed: ${completedTasks}
          - In Progress: ${inProgressTasks}
          - Team Members: ${teamMembers}
          - Average Points: ${avgPoints}
          Provide insights and suggestions.`
        }
      ],
      model: MODEL,
      temperature: 0.8,
      max_tokens: 600,
      response_format: { type: "json_object" }
    });
    const insights = JSON.parse(completion.choices[0].message.content);
    console.log('✅ Insights generated');
    return { success: true, insights };
  } catch (error) {
    console.error('❌ Error generating insights:', error);
    return { success: false, error: error.message };
  }
};

const prioritizeTasks = async (tasks) => {
  try {
    const groq = getGroqClient();
    console.log('🤖 Prioritizing tasks...');
    const taskList = tasks.map(t => ({ title: t.title, priority: t.priority, deadline: t.deadline, status: t.status }));
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a task prioritization expert.
          Return JSON:
          {
            "prioritizedOrder": ["task title 1", "task title 2"],
            "reasoning": "brief explanation",
            "urgentTasks": ["urgent task 1"],
            "canDelegate": ["delegatable task 1"]
          }`
        },
        { role: "user", content: `Prioritize these tasks: ${JSON.stringify(taskList)}` }
      ],
      model: MODEL,
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    const result = JSON.parse(completion.choices[0].message.content);
    console.log('✅ Tasks prioritized');
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Error prioritizing tasks:', error);
    return { success: false, error: error.message };
  }
};

const generateMeetingAgenda = async (meetingPurpose, attendees = []) => {
  try {
    const groq = getGroqClient();
    console.log('🤖 Generating meeting agenda...');
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a professional meeting facilitator.
          Return JSON:
          {
            "title": "meeting title",
            "duration": "estimated duration",
            "agenda": [{"topic": "topic 1", "time": "5 mins", "description": "what to cover"}],
            "expectedOutcomes": ["outcome 1", "outcome 2"]
          }`
        },
        {
          role: "user",
          content: `Create agenda for: "${meetingPurpose}". Attendees: ${attendees.length} people. Under 60 minutes.`
        }
      ],
      model: MODEL,
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });
    const agenda = JSON.parse(completion.choices[0].message.content);
    console.log('✅ Meeting agenda generated');
    return { success: true, agenda };
  } catch (error) {
    console.error('❌ Error generating agenda:', error);
    return { success: false, error: error.message };
  }
};

const chatWithAI = async (userMessage, conversationHistory = []) => {
  try {
    const groq = getGroqClient();
    console.log('🤖 Processing chat message...');
    const messages = [
      {
        role: "system",
        content: `You are an intelligent workspace analyst for TASKFORGE — a real-time project management platform.

CRITICAL RULES:
1. ALWAYS analyze the LIVE WORKSPACE DATA provided in the user's message — it contains real tasks, deadlines, team info, and leaderboard data.
2. NEVER give generic "go to dashboard" or "navigate to settings" type answers. Always give DIRECT answers based on the actual data.
3. If the user asks about workload, tasks, or performance — read the data and give specific names, numbers, and deadlines from it.
4. If data shows overdue tasks, name them. If someone is top performer, name them. Be specific.
5. Keep answers concise, direct, and actionable — no fluff.
6. If no workspace data is present, say "I don't see any data yet — make sure tasks are created."

You are analyzing a live workspace. Behave like a smart analyst, not a help desk.`
      },
      ...conversationHistory,
      { role: "user", content: userMessage }
    ];
    const completion = await groq.chat.completions.create({
      messages,
      model: MODEL,
      temperature: 0.7,
      max_tokens: 500
    });
    const response = completion.choices[0].message.content;
    console.log('✅ Chat response generated');
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error in chat:', error);
    return { success: false, response: "I'm having trouble processing that right now. Please try again!" };
  }
};

module.exports = {
  generateTaskDescription,
  generateTeamInsights,
  prioritizeTasks,
  generateMeetingAgenda,
  chatWithAI
};