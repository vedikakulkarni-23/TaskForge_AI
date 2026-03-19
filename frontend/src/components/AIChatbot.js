import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const AIChatbot = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your AI assistant. I can analyze your tasks, team workload, deadlines, and performance. Ask me anything about your workspace!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [workspaceData, setWorkspaceData] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch real workspace data on mount
  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const fetchWorkspaceData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = { Authorization: `Bearer ${user.token}` };

      let tasks = [];
      let teamInfo = null;
      let members = [];
      let leaderboard = [];

      // Fetch based on role
      if (user.role === 'admin') {
        try {
          const [dashRes] = await Promise.allSettled([
            axios.get('/api/admin/dashboard', { headers })
          ]);
          if (dashRes.status === 'fulfilled') {
            teamInfo = dashRes.value.data;
          }
        } catch (e) {}

      } else if (user.role === 'teamleader') {
        try {
          const [tasksRes, lbRes] = await Promise.allSettled([
            axios.get('/api/tl/tasks', { headers }),
            axios.get('/api/tl/leaderboard', { headers })
          ]);
          if (tasksRes.status === 'fulfilled') tasks = tasksRes.value.data;
          if (lbRes.status === 'fulfilled') leaderboard = lbRes.value.data;
        } catch (e) {}

      } else if (user.role === 'member') {
        try {
          const [tasksRes, lbRes] = await Promise.allSettled([
            axios.get('/api/member/tasks', { headers }),
            axios.get('/api/member/leaderboard', { headers })
          ]);
          if (tasksRes.status === 'fulfilled') tasks = tasksRes.value.data;
          if (lbRes.status === 'fulfilled') leaderboard = lbRes.value.data;
        } catch (e) {}
      }

      const data = { user, tasks, teamInfo, members, leaderboard };
      setWorkspaceData(data);
      console.log('✅ Workspace data loaded for AI context');
    } catch (error) {
      console.error('Failed to fetch workspace data:', error);
    }
  };

  // Build a rich context string from real data
  const buildContextString = () => {
    if (!workspaceData) return '';

    const { user, tasks, teamInfo, leaderboard } = workspaceData;
    const now = new Date();

    let context = `\n\n=== LIVE WORKSPACE DATA ===\n`;
    context += `Current user: ${user.name} (Role: ${user.role})\n`;
    context += `Current date/time: ${now.toLocaleString()}\n\n`;

    if (tasks && tasks.length > 0) {
      const todo = tasks.filter(t => t.status === 'todo');
      const inProgress = tasks.filter(t => t.status === 'inprogress');
      const done = tasks.filter(t => t.status === 'done');
      const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'done');
      const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'done');

      context += `TASK SUMMARY:\n`;
      context += `- Total tasks: ${tasks.length}\n`;
      context += `- Todo: ${todo.length}\n`;
      context += `- In Progress: ${inProgress.length}\n`;
      context += `- Done: ${done.length}\n`;
      context += `- OVERDUE: ${overdue.length}\n`;
      context += `- High Priority (pending): ${highPriority.length}\n\n`;

      if (overdue.length > 0) {
        context += `OVERDUE TASKS:\n`;
        overdue.forEach(t => {
          const daysOverdue = Math.floor((now - new Date(t.deadline)) / (1000 * 60 * 60 * 24));
          context += `- "${t.title}" — ${daysOverdue} day(s) overdue (Priority: ${t.priority})\n`;
        });
        context += '\n';
      }

      if (highPriority.length > 0) {
        context += `HIGH PRIORITY TASKS:\n`;
        highPriority.forEach(t => {
          const deadline = t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline';
          context += `- "${t.title}" — Status: ${t.status}, Deadline: ${deadline}\n`;
        });
        context += '\n';
      }

      if (inProgress.length > 0) {
        context += `IN PROGRESS TASKS:\n`;
        inProgress.forEach(t => {
          context += `- "${t.title}" (Priority: ${t.priority})\n`;
        });
        context += '\n';
      }
    } else {
      context += `TASKS: No tasks found for this user.\n\n`;
    }

    if (leaderboard && leaderboard.length > 0) {
      context += `LEADERBOARD (Top members by points):\n`;
      leaderboard.slice(0, 5).forEach((m, i) => {
        context += `${i + 1}. ${m.name} — ${m.points} pts (${m.badges?.length || 0} badges)\n`;
      });
      context += '\n';
    }

    if (teamInfo) {
      context += `TEAM/DASHBOARD DATA:\n${JSON.stringify(teamInfo, null, 2).substring(0, 800)}\n\n`;
    }

    context += `=== END OF WORKSPACE DATA ===\n`;
    return context;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Build conversation history (last 6 messages for context)
      const history = messages.slice(-6).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

      // Inject real workspace data into the message
      const contextualMessage = currentInput + buildContextString();

      const response = await axios.post(
        '/api/ai/chat',
        {
          message: contextualMessage,
          history
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = (q) => {
    setInput(q);
  };

  const quickQuestions = [
    'Who should I assign this task to?',
    'Show me team workload',
    'What tasks are urgent?',
    'Show team performance',
    'What are my overdue tasks?',
    'Who is top performer?'
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {workspaceData
                ? `✅ Connected to your workspace data`
                : 'Loading workspace data...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${workspaceData ? 'bg-green-500' : 'bg-yellow-400 animate-pulse'}`}></div>
            <span className="text-xs text-gray-600 font-medium">
              {workspaceData ? 'Online' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" style={{ maxHeight: '500px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="flex items-start gap-3 max-w-2xl">
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              )}
              <div className={`px-4 py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-900 border border-gray-200'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {JSON.parse(localStorage.getItem('user') || '{}').name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">Analyzing your workspace...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 font-medium mb-2">Suggested queries</p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(q)}
              className="text-xs bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md text-gray-700 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your workspace..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm placeholder-gray-400"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Press Enter to send • Shift + Enter for new line</p>
      </div>
    </div>
  );
};

export default AIChatbot;