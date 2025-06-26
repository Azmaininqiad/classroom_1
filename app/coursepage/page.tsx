'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  BookOpen, 
  ArrowLeft, 
  Sparkles,
  Bot,
  BookMarked,
  Clock,
  Target,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Play,
  FileText,
  Bookmark,
  Hash
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';

interface TOCItem {
  id: string;
  title: string;
  number: string;
}

interface HeadlineItem {
  id: string;
  title: string;
}

interface CourseData {
  toc: TOCItem[];
  content: { [key: string]: string };
  headlines: { [key: string]: HeadlineItem[] };
}

export default function CoursePage() {
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const generateCourse = async () => {
    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject: subject.trim() }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: CourseData = await response.json();
      setCourseData(data);
      
      // Select first topic by default
      if (data.toc.length > 0) {
        setCurrentTopic(data.toc[0].id);
      }
    } catch (error: any) {
      console.error('Error details:', error);
      let errorMessage = error.message;
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to backend server. Make sure the FastAPI server is running on http://127.0.0.1:8000';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectTopic = (topicId: string) => {
    setCurrentTopic(topicId);
  };

  const scrollToHeadline = (headlineId: string) => {
    const element = document.getElementById(headlineId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderMarkdownContent = (content: string) => {
    // Enhanced markdown-to-HTML conversion
    return content
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-white mb-4 border-b-2 border-blue-500 pb-2">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-white mb-3 mt-6">$1</h3>')
      .replace(/^#### ([\d.]+)\s*(.*$)/gim, '<h4 class="text-lg font-medium text-blue-300 mb-2 mt-4" id="subtopic-$1">$1 $2</h4>')
      .replace(/^\* (.*$)/gim, '<li class="text-gray-300 mb-1 ml-4">• $1</li>')
      .replace(/^\- (.*$)/gim, '<li class="text-gray-300 mb-1 ml-4">• $1</li>')
      .replace(/```([^`]*?)```/g, '<pre class="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto my-4"><code class="text-green-400 text-sm">$1</code></pre>')
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-800 text-green-400 px-2 py-1 rounded text-sm">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-200 italic">$1</em>')
      .replace(/\n\n/g, '</p><p class="text-gray-300 mb-4 leading-relaxed">')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 p-2 rounded-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">AI Course Generator</h1>
                  <p className="text-sm text-gray-300">Create comprehensive courses on any subject</p>
                </div>
              </div>
            </div>
            {courseData && (
              <Badge variant="secondary" className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30">
                {courseData.toc.length} Topics Generated
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Input Section */}
        <Card className="glass-effect mb-8">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-emerald-400" />
              Generate Your Course
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Course Subject
                </label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="e.g., Python Programming, Machine Learning, Web Development"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && generateCourse()}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={generateCourse}
                disabled={loading || !subject.trim()}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="mr-2 h-4 w-4" />
                    Generate Course
                  </>
                )}
              </Button>
            </div>
            
            {/* Course Features */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: BookOpen, label: "Structured Content", color: "text-blue-400" },
                { icon: Target, label: "Learning Objectives", color: "text-emerald-400" },
                { icon: FileText, label: "Code Examples", color: "text-purple-400" },
                { icon: CheckCircle, label: "Practice Exercises", color: "text-green-400" }
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <feature.icon className={`h-4 w-4 ${feature.color}`} />
                  <span className="text-gray-300">{feature.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="glass-effect mb-8 border-red-500/50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <h3 className="text-red-400 font-medium mb-2">Error generating course</h3>
                  <p className="text-gray-300 text-sm mb-3">{error}</p>
                  <div className="text-sm text-gray-400">
                    <p className="font-medium mb-1">Troubleshooting:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Make sure FastAPI server is running: <code className="bg-gray-800 px-2 py-1 rounded">uvicorn main:app --reload --host 0.0.0.0 --port 8000</code></li>
                      <li>Check if you can access <a href="http://127.0.0.1:8000/docs" target="_blank" className="text-blue-400 hover:underline">http://127.0.0.1:8000/docs</a></li>
                      <li>Check browser console for detailed errors</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Content */}
        {courseData ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Table of Contents */}
            <div className="lg:col-span-1">
              <Card className="glass-effect sticky top-8">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center">
                    <BookMarked className="mr-2 h-5 w-5 text-blue-400" />
                    Table of Contents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {courseData.toc.map((topic) => (
                    <div
                      key={topic.id}
                      onClick={() => selectTopic(topic.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        currentTopic === topic.id
                          ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/50'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-blue-400 mr-2">{topic.number}.</span>
                        <span className="text-sm text-white leading-tight">{topic.title}</span>
                        <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card className="glass-effect">
                <CardContent className="pt-6">
                  {currentTopic && courseData.content[currentTopic] ? (
                    <div className="prose prose-invert max-w-none">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: `<div class="text-gray-300 leading-relaxed">${renderMarkdownContent(courseData.content[currentTopic])}</div>` 
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Select a topic from the table of contents to view content</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Headlines/Subtopics */}
            <div className="lg:col-span-1">
              <Card className="glass-effect sticky top-8">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center">
                    <Hash className="mr-2 h-5 w-5 text-purple-400" />
                    On This Page
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {currentTopic && courseData.headlines[currentTopic] ? (
                    <>
                      {courseData.headlines[currentTopic].length > 0 ? (
                        <>
                          {courseData.headlines[currentTopic].map((headline, index) => (
                            <div
                              key={headline.id}
                              onClick={() => scrollToHeadline(headline.id)}
                              className="p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/10 group"
                            >
                              <div className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 group-hover:bg-purple-300 transition-colors" />
                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors leading-tight">
                                  {headline.title}
                                </span>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <FileText className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No subtopics found</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Bookmark className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Select a topic to see subtopics</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          !loading && !error && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                <GraduationCap className="h-16 w-16 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Ready to Learn Something New?</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Enter any subject above and I'll generate a comprehensive course with structured content, 
                code examples, and practice exercises.
              </p>
              <div className="flex justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Generated in seconds</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Beginner to advanced</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Practical examples</span>
                </div>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}