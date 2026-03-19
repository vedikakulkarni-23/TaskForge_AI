import React, { useState } from 'react';
import api from '../services/api';

const AITaskGenerator = ({ onTaskGenerated, onClose }) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedTask, setGeneratedTask] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!taskTitle.trim()) {
      setError('Please enter a task title');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedTask(null);

    try {
      console.log('🤖 Generating AI task for:', taskTitle);
      
      const response = await api.post('/ai/generate-task', {
        title: taskTitle
      });

      if (response.data.success) {
        setGeneratedTask(response.data.task);
        console.log('✅ Task generated:', response.data.task);
      }
    } catch (err) {
      console.error('❌ AI generation error:', err);
      setError(err.response?.data?.message || 'AI generation failed');
      
      // Show fallback if available
      if (err.response?.data?.fallback) {
        setGeneratedTask(err.response.data.fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseTask = () => {
    if (generatedTask && onTaskGenerated) {
      onTaskGenerated({
        title: taskTitle,
        description: generatedTask.description,
        subtasks: generatedTask.subtasks,
        estimatedTime: generatedTask.estimatedTime,
        tips: generatedTask.tips
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-3xl">🤖</span>
              AI Task Generator
            </h2>
            <p className="text-sm text-gray-600 mt-1">Powered by Groq AI - Lightning fast!</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input Form */}
        {!generatedTask && (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What task do you want to create?
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g., Design landing page, Implement authentication, Create marketing campaign"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !taskTitle.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating with AI...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Task Details
                </>
              )}
            </button>
          </form>
        )}

        {/* Generated Task Result */}
        {generatedTask && (
          <div className="space-y-6">
            {/* Title */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-1">Task Title</h3>
              <p className="text-lg text-gray-800">{taskTitle}</p>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📝 Description</h3>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200">
                {generatedTask.description}
              </p>
            </div>

            {/* Subtasks */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">✅ Suggested Subtasks</h3>
              <ul className="space-y-2">
                {generatedTask.subtasks?.map((subtask, index) => (
                  <li key={index} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <span className="text-blue-600 font-semibold">{index + 1}.</span>
                    <span className="text-gray-700">{subtask}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Estimated Time */}
            <div className="flex gap-4">
              <div className="flex-1 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-1">⏱️ Estimated Time</h3>
                <p className="text-blue-700 font-medium">{generatedTask.estimatedTime}</p>
              </div>

              {generatedTask.tips && (
                <div className="flex-1 bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-1">💡 Pro Tip</h3>
                  <p className="text-green-700 text-sm">{generatedTask.tips}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleUseTask}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium transition"
              >
                Use This Task
              </button>
              <button
                onClick={() => {
                  setGeneratedTask(null);
                  setTaskTitle('');
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
              >
                Generate Another
              </button>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-gray-500 text-center">
            ⚡ Powered by Groq AI • Ultra-fast inference • Context-aware suggestions
          </p>
        </div>
      </div>
    </div>
  );
};

export default AITaskGenerator;