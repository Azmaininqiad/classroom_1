'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Loader2, Home, Clock, Sparkles, Zap, ChevronRight, FileUp, Target } from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = 'http://localhost:8001';

interface Quiz {
  id: string;
  title: string;
  total_questions: number;
  created_at: string;
}

export default function MCQGeneration() {
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchRecentQuizzes(); }, []);

  const fetchRecentQuizzes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/quizzes`);
      const data = await res.json();
      setRecentQuizzes(data.quizzes);
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sel = e.target.files?.[0];
    setFile(sel || null);
    setMessage('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setMessageType('error'), setMessage('Select a file first.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('num_questions', numQuestions.toString());

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessageType('success');
        setMessage(`Generated! Redirecting to quiz ${data.quiz_id}...`);
        fetchRecentQuizzes();
        setTimeout(() => router.push(`/mcqgeneration/quiz/${data.quiz_id}`), 2000);
      } else {
        throw new Error(data.detail || 'Upload failed.');
      }
    } catch (err) {
      setMessageType('error');
      setMessage(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizClick = (id: string) => router.push(`/mcqgeneration/quiz/${id}`);

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Animated Header */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text tracking-tight">
              MCQ Generator
            </h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Transform your documents into interactive quizzes with AI-powered question generation
          </p>
          <Link href="/">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-xl backdrop-blur-sm border border-slate-600/30 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </Link>
        </div>

        {/* Main Upload Section */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Upload Form */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileUp className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Upload Document</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Drag & Drop Area */}
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                    dragActive
                      ? 'border-blue-400 bg-blue-500/10 scale-105'
                      : file
                      ? 'border-green-400 bg-green-500/10'
                      : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/20'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".pdf,.txt,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="space-y-4">
                    {file ? (
                      <div className="flex items-center justify-center gap-3 text-green-400">
                        <FileText className="w-8 h-8" />
                        <div>
                          <p className="font-semibold text-lg">{file.name}</p>
                          <p className="text-sm text-slate-400">File selected successfully</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-white mb-2">
                            Drop your file here or click to browse
                          </p>
                          <p className="text-sm text-slate-400">
                            Supports PDF, TXT, JPG, JPEG, PNG files
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Questions Count */}
                <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-5 h-5 text-purple-400" />
                    <label className="text-lg font-semibold text-white">
                      Number of Questions
                    </label>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(+e.target.value)}
                      disabled={loading}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-bold text-lg min-w-[3rem] text-center">
                      {numQuestions}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>1 question</span>
                    <span>20 questions</span>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-3 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Generating MCQs...
                    </>
                  ) : (
                    <>
                      <Zap className="w-6 h-6" />
                      Generate MCQs
                    </>
                  )}
                </button>

                {/* Message Display */}
                {message && (
                  <div className={`p-4 rounded-xl border-l-4 ${
                    messageType === 'success' 
                      ? 'bg-green-500/10 border-green-400 text-green-300' 
                      : 'bg-red-500/10 border-red-400 text-red-300'
                  }`}>
                    {message}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-800/20 to-pink-800/20 backdrop-blur-xl border border-purple-700/30 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-purple-400" />
                AI-Powered Features
              </h3>
              <div className="space-y-4">
                {[
                  { icon: '🤖', title: 'Smart Analysis', desc: 'AI extracts key concepts from your documents' },
                  { icon: '⚡', title: 'Instant Generation', desc: 'Create comprehensive MCQs in seconds' },
                  { icon: '🎯', title: 'Adaptive Difficulty', desc: 'Questions tailored to content complexity' },
                  { icon: '📊', title: 'Detailed Analytics', desc: 'Track performance and identify weak areas' }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:bg-slate-700/30 transition-colors">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                      <p className="text-sm text-slate-300">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Quizzes */}
        {recentQuizzes.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Recent Quizzes</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {recentQuizzes.map((quiz, index) => (
                <div
                  key={quiz.id}
                  onClick={() => handleQuizClick(quiz.id)}
                  className="group bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:border-blue-400/50"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                        {quiz.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {quiz.total_questions} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors transform group-hover:translate-x-1" />
                  </div>
                  
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(quiz.total_questions * 5, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}