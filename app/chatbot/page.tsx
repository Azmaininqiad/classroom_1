"use client";
import React, { useEffect, useState } from "react";

export default function TavusVideoPage() {
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startConversation = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:8000/api/start-tavus-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to start Tavus conversation");
        }
        const data = await res.json();
        setConversationUrl(data.conversation_url);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    startConversation();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <h1 className="text-2xl font-bold mb-4 text-indigo-700">EduBot AI Video Conversation</h1>
      {loading && (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-4"></div>
          <span className="text-indigo-600">Starting video conversation...</span>
        </div>
      )}
      {error && (
        <div className="text-red-600 font-semibold">{error}</div>
      )}
      {conversationUrl && !loading && !error && (
        <iframe
          src={conversationUrl}
          allow="camera; microphone; fullscreen; display-capture"
          className="w-full max-w-3xl h-[600px] rounded-lg border shadow-lg"
          style={{ minHeight: 400 }}
          title="Tavus Video Conversation"
        />
      )}
    </div>
  );
} 