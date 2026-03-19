import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const VideoMeeting = ({ onClose, teamId, userName }) => {
  const [meetingUrl, setMeetingUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const iframeRef = useRef(null);

  const createMeeting = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/conference/create', {
        teamId,
        purpose: 'team-meeting'
      });

      if (response.data.success) {
        setMeetingUrl(response.data.meeting.url);
        console.log('✅ Meeting created:', response.data.meeting.url);
      }
    } catch (err) {
      console.error('❌ Error creating meeting:', err);
      setError(err.response?.data?.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const createInstantMeeting = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/conference/instant');

      if (response.data.success) {
        setMeetingUrl(response.data.meeting.url);
        console.log('✅ Instant meeting created:', response.data.meeting.url);
      }
    } catch (err) {
      console.error('❌ Error creating instant meeting:', err);
      setError(err.response?.data?.message || 'Failed to create instant meeting');
    } finally {
      setLoading(false);
    }
  };

  const endMeeting = () => {
    setMeetingUrl('');
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Team Video Meeting</h2>
            <p className="text-sm text-gray-600">Powered by Daily.co</p>
          </div>
          <button
            onClick={endMeeting}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          {!meetingUrl && !loading && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Start a Video Meeting</h3>
                <p className="text-gray-600 mb-6">
                  Connect with your team face-to-face with HD video and audio
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <button
                  onClick={createMeeting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Create Team Meeting
                </button>

                <button
                  onClick={createInstantMeeting}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Start
                </button>
              </div>

              <div className="pt-6 border-t space-y-2">
                <p className="text-sm text-gray-500">Features:</p>
                <div className="flex gap-6 justify-center text-sm text-gray-600">
                  <span>✅ HD Video & Audio</span>
                  <span>✅ Screen Sharing</span>
                  <span>✅ Chat</span>
                  <span>✅ Recording</span>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Creating meeting room...</p>
            </div>
          )}

          {meetingUrl && (
            <iframe
              ref={iframeRef}
              src={meetingUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full rounded-lg border-0"
              title="Video Meeting"
            />
          )}
        </div>

        {/* Footer with meeting controls */}
        {meetingUrl && (
          <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              🎥 Meeting in progress
            </div>
            <button
              onClick={endMeeting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
            >
              Leave Meeting
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoMeeting;