"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Video, VideoOff, BookOpen } from 'lucide-react';

const EducationChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [tavusSessionId, setTavusSessionId] = useState(null);
  const videoRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeTavusSession = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/initialize-tavus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTavusSessionId(data.session_id);
        return data.session_id;
      }
    } catch (error) {
      console.error('Error initializing Tavus session:', error);
    }
    return null;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = { role: 'user', content: inputText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get text response from OpenRouter
      const textResponse = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          conversation_history: messages
        }),
      });

      if (textResponse.ok) {
        const textData = await textResponse.json();
        const assistantMessage = {
          role: 'assistant',
          content: textData.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);

        // If video is enabled, send to Tavus
        if (isVideoEnabled) {
          let sessionId = tavusSessionId;
          if (!sessionId) {
            sessionId = await initializeTavusSession();
          }

          if (sessionId) {
            await fetch('http://localhost:8000/api/tavus-speak', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                session_id: sessionId,
                message: textData.response
              }),
            });
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setInputText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVideo = async () => {
    if (!isVideoEnabled && !tavusSessionId) {
      await initializeTavusSession();
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">EduBot Assistant</h1>
                <p className="text-sm text-gray-500">Your AI-powered learning companion</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleVideo}
                className={`p-2 rounded-lg transition-colors ${
                  isVideoEnabled 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsMicEnabled(!isMicEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  isMicEnabled 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Welcome to EduBot!</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                I'm here to help you learn and explore new topics. Ask me anything about education, 
                science, history, literature, or any subject you're curious about!
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-800 shadow-sm border'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-75 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white shadow-sm border max-w-xs px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span className="text-gray-600">EduBot is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about learning..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows="1"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Interface */}
      {isVideoEnabled && (
        <div className="w-96 bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">Video Assistant</h2>
            <p className="text-sm text-gray-500">AI-powered visual learning companion</p>
          </div>
          
          <div className="flex-1 p-4">
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
              {tavusSessionId ? (
                <div className="text-white text-center">
                  <Video className="w-12 h-12 mx-auto mb-2" />
                  <p>Video Assistant Active</p>
                  <p className="text-sm opacity-75">Session: {tavusSessionId.slice(0, 8)}...</p>
                </div>
              ) : (
                <div className="text-gray-400 text-center">
                  <VideoOff className="w-12 h-12 mx-auto mb-2" />
                  <p>Initializing Video...</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={tavusSessionId ? 'text-green-600' : 'text-yellow-600'}>
                  {tavusSessionId ? 'Connected' : 'Connecting...'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Video:</span>
                <span className="text-green-600">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationChatbot;