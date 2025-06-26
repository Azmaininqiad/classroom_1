'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Home, Clock, Award, Target } from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = 'http://localhost:8001';

interface Quiz {
  id: string;
  title: string;
  total_questions: number;
  created_at: string;
}

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation?: string;
}

interface Results {
  score: number;
  total_questions: number;
  percentage: number;
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [results, setResults] = useState<Results | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchQuiz();
    }
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setQuiz(data.quiz);
        setQuestions(data.questions);
      } else {
        throw new Error('Failed to fetch quiz');
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      alert('Error loading quiz');
      router.push('/mcqgeneration');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answers),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
        setShowResults(true);
      } else {
        throw new Error('Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setResults(null);
    setShowResults(false);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-400';
    if (percentage >= 70) return 'text-blue-400';
    if (percentage >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreIcon = (percentage: number) => {
    if (percentage >= 90) return <Award className="w-8 h-8 text-emerald-400" />;
    if (percentage >= 70) return <Target className="w-8 h-8 text-blue-400" />;
    return <Clock className="w-8 h-8 text-yellow-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/20 rounded-full animate-spin border-t-blue-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500/20 rounded-full animate-ping mx-auto"></div>
          </div>
          <p className="text-slate-300 text-lg font-medium">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Quiz Not Found</h2>
          <p className="text-slate-300 mb-6">The quiz you're looking for doesn't exist or has been removed.</p>
          <Link href="/mcqgeneration">
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105">
              Back to MCQ Generator
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                {quiz.title}
              </h1>
              <div className="flex items-center gap-4 text-slate-300">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>{quiz.total_questions} Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <button className="bg-slate-700/50 hover:bg-slate-600/50 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 border border-slate-600/50">
                  <Home className="w-4 h-4" />
                  Home
                </button>
              </Link>
              <Link href="/mcqgeneration">
                <button className="bg-slate-700/50 hover:bg-slate-600/50 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 border border-slate-600/50">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </Link>
            </div>
          </div>

          {showResults && results && (
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                {getScoreIcon(results.percentage)}
                <h2 className="text-2xl font-bold text-white">Quiz Complete!</h2>
              </div>
              <div className={`text-5xl font-bold mb-2 ${getScoreColor(results.percentage)}`}>
                {results.score}/{results.total_questions}
              </div>
              <p className={`text-2xl font-semibold mb-6 ${getScoreColor(results.percentage)}`}>
                {results.percentage}% Score
              </p>
              <button 
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto"
                onClick={resetQuiz}
              >
                <RotateCcw className="w-4 h-4" />
                Take Again
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!showResults && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300 font-medium">Progress</span>
              <span className="text-slate-300 font-medium">
                {Object.keys(answers).length} / {questions.length}
              </span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {question.question_number}
                </div>
                <span className="text-slate-400 font-medium">Question {question.question_number}</span>
              </div>
              
              <div className="text-white text-lg font-medium mb-6 leading-relaxed">
                {question.question_text}
              </div>

              <div className="space-y-3">
                {Object.entries(question.options).map(([optionKey, optionText]) => {
                  const isSelected = answers[question.id] === optionKey;
                  const isCorrect = showResults && optionKey === question.correct_answer;
                  const isIncorrect = showResults && isSelected && optionKey !== question.correct_answer;
                  
                  let className = 'group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer';
                  
                  if (showResults) {
                    if (isCorrect) {
                      className += ' bg-emerald-500/20 border-emerald-500/50 text-emerald-100';
                    } else if (isIncorrect) {
                      className += ' bg-red-500/20 border-red-500/50 text-red-100';
                    } else {
                      className += ' bg-slate-700/30 border-slate-600/30 text-slate-300';
                    }
                  } else if (isSelected) {
                    className += ' bg-blue-500/20 border-blue-500/50 text-blue-100 transform scale-[1.02]';
                  } else {
                    className += ' bg-slate-700/30 border-slate-600/30 text-slate-300 hover:bg-slate-600/30 hover:border-slate-500/50 hover:text-white';
                  }

                  return (
                    <label key={optionKey} className={className}>
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={optionKey}
                        checked={isSelected}
                        onChange={() => handleAnswerChange(question.id, optionKey)}
                        disabled={showResults}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-slate-500 group-hover:border-slate-400'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-400">{optionKey}:</span>
                          <span>{optionText}</span>
                        </div>
                        {showResults && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                        {showResults && isIncorrect && <XCircle className="w-5 h-5 text-red-400" />}
                      </div>
                    </label>
                  );
                })}
              </div>

              {showResults && question.explanation && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-400">Explanation:</span>
                      <p className="text-slate-300 mt-1">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {!showResults && (
          <div className="mt-8 text-center">
            <button
              className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 mx-auto text-lg ${
                submitting || Object.keys(answers).length < questions.length
                  ? 'opacity-50 cursor-not-allowed'
                  : 'shadow-lg hover:shadow-xl'
              }`}
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
            >
              {submitting ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 rounded-full animate-spin border-t-white"></div>
                  Submitting Quiz...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Submit Quiz
                </>
              )}
            </button>
            
            <p className="mt-4 text-slate-400">
              {Object.keys(answers).length < questions.length 
                ? `Please answer ${questions.length - Object.keys(answers).length} more question${questions.length - Object.keys(answers).length === 1 ? '' : 's'}`
                : 'All questions answered! Ready to submit.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}