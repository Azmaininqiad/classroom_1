'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  Calendar, 
  Award, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Star,
  Brain,
  FileText,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EvaluationResult {
  id: string;
  student_name: string;
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  grade: string;
  correct_answers: string[];
  incorrect_answers: string[];
  partial_credit_areas: string[];
  strengths: string[];
  areas_for_improvement: string[];
  detailed_feedback: string;
  timestamp: string;
  evaluation_type: string;
}

interface AIResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  assignmentTitle: string;
}

export default function AIResultsDialog({
  open,
  onOpenChange,
  assignmentId,
  assignmentTitle
}: AIResultsDialogProps) {
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<EvaluationResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [evaluationTypeFilter, setEvaluationTypeFilter] = useState('all');

  useEffect(() => {
    if (open && assignmentId) {
      fetchResults();
    }
  }, [open, assignmentId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('evaluation_results')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching AI results:', error);
      toast.error('Failed to load AI evaluation results');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'A': case 'A+': return 'bg-green-600';
      case 'B': case 'B+': return 'bg-blue-600';
      case 'C': case 'C+': return 'bg-yellow-600';
      case 'D': case 'D+': return 'bg-orange-600';
      case 'F': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 80) return 'text-blue-400';
    if (percentage >= 70) return 'text-yellow-400';
    if (percentage >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const filteredResults = results.filter(result => {
    const matchesSearch = result.student_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || result.grade === gradeFilter;
    const matchesType = evaluationTypeFilter === 'all' || result.evaluation_type === evaluationTypeFilter;
    return matchesSearch && matchesGrade && matchesType;
  });

  const calculateStats = () => {
    if (results.length === 0) return { average: 0, highest: 0, lowest: 0, totalStudents: 0 };
    
    const percentages = results.map(r => r.percentage);
    return {
      average: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
      highest: Math.max(...percentages),
      lowest: Math.min(...percentages),
      totalStudents: results.length
    };
  };

  const stats = calculateStats();

  const exportResults = () => {
    const csvContent = [
      ['Student Name', 'Grade', 'Percentage', 'Total Marks', 'Obtained Marks', 'Evaluation Type', 'Timestamp'],
      ...filteredResults.map(result => [
        result.student_name,
        result.grade,
        result.percentage,
        result.total_marks,
        result.obtained_marks,
        result.evaluation_type,
        format(new Date(result.timestamp), 'yyyy-MM-dd HH:mm:ss')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `ai-results-${assignmentTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center">
            <Brain className="h-6 w-6 mr-2 text-cyan-400" />
            AI Evaluation Results - {assignmentTitle}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Detailed AI-powered evaluation results for all student submissions
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Results List */}
          <div className="w-1/2 pr-4 border-r border-slate-700">
            {/* Stats Overview */}
            <Card className="glass-effect mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Overview Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">{stats.totalStudents}</div>
                    <div className="text-gray-400">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{stats.average}%</div>
                    <div className="text-gray-400">Average Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{stats.highest}%</div>
                    <div className="text-gray-400">Highest Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{stats.lowest}%</div>
                    <div className="text-gray-400">Lowest Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters and Search */}
            <Card className="glass-effect mb-4">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Select value={gradeFilter} onValueChange={setGradeFilter}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white text-sm">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Grade" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="all">All Grades</SelectItem>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C+">C+</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D+">D+</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={evaluationTypeFilter} onValueChange={setEvaluationTypeFilter}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white text-sm">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="batch">Batch</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={exportResults}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-gray-300 hover:bg-slate-700"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results List */}
            <ScrollArea className="h-[calc(100%-240px)]">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-gray-400">Loading AI results...</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">No AI evaluation results found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredResults.map((result) => (
                    <Card
                      key={result.id}
                      className={`glass-effect cursor-pointer transition-all hover:bg-slate-800/70 ${
                        selectedResult?.id === result.id ? 'ring-2 ring-cyan-500' : ''
                      }`}
                      onClick={() => setSelectedResult(result)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-cyan-600 text-white text-sm">
                                {result.student_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-white text-sm">{result.student_name}</p>
                              <p className="text-xs text-gray-400">
                                {format(new Date(result.timestamp), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getGradeColor(result.grade)} text-white`}>
                              {result.grade}
                            </Badge>
                            <span className={`text-sm font-bold ${getPercentageColor(result.percentage)}`}>
                              {result.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{result.obtained_marks}/{result.total_marks} marks</span>
                          <span className="capitalize">{result.evaluation_type}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel - Detailed View */}
          <div className="w-1/2 pl-4">
            {selectedResult ? (
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {/* Student Header */}
                  <Card className="glass-effect">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-cyan-600 text-white">
                              {selectedResult.student_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-xl font-bold text-white">{selectedResult.student_name}</h3>
                            <p className="text-gray-400">
                              Evaluated on {format(new Date(selectedResult.timestamp), 'MMM d, yyyy at h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getGradeColor(selectedResult.grade)} text-white text-lg px-3 py-1`}>
                            {selectedResult.grade}
                          </Badge>
                          <div className={`text-2xl font-bold ${getPercentageColor(selectedResult.percentage)}`}>
                            {selectedResult.percentage}%
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Score Breakdown */}
                  <Card className="glass-effect">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Target className="h-5 w-5 mr-2" />
                        Score Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                          <div className="text-2xl font-bold text-green-400">{selectedResult.obtained_marks}</div>
                          <div className="text-sm text-gray-400">Obtained Marks</div>
                        </div>
                        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-400">{selectedResult.total_marks}</div>
                          <div className="text-sm text-gray-400">Total Marks</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Answer Analysis */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Correct Answers */}
                    {selectedResult.correct_answers.length > 0 && (
                      <Card className="glass-effect">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                            Correct Answers ({selectedResult.correct_answers.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedResult.correct_answers.map((answer, index) => (
                              <div key={index} className="bg-green-900/20 p-2 rounded border-l-4 border-green-400">
                                <p className="text-sm text-gray-300">{answer}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Incorrect Answers */}
                    {selectedResult.incorrect_answers.length > 0 && (
                      <Card className="glass-effect">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center text-sm">
                            <XCircle className="h-4 w-4 mr-2 text-red-400" />
                            Incorrect Answers ({selectedResult.incorrect_answers.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedResult.incorrect_answers.map((answer, index) => (
                              <div key={index} className="bg-red-900/20 p-2 rounded border-l-4 border-red-400">
                                <p className="text-sm text-gray-300">{answer}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Partial Credit */}
                    {selectedResult.partial_credit_areas.length > 0 && (
                      <Card className="glass-effect">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center text-sm">
                            <AlertCircle className="h-4 w-4 mr-2 text-yellow-400" />
                            Partial Credit Areas ({selectedResult.partial_credit_areas.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedResult.partial_credit_areas.map((area, index) => (
                              <div key={index} className="bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-400">
                                <p className="text-sm text-gray-300">{area}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Strengths and Improvements */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Strengths */}
                    {selectedResult.strengths.length > 0 && (
                      <Card className="glass-effect">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center text-sm">
                            <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
                            Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedResult.strengths.map((strength, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <Star className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-300">{strength}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Areas for Improvement */}
                    {selectedResult.areas_for_improvement.length > 0 && (
                      <Card className="glass-effect">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center text-sm">
                            <TrendingDown className="h-4 w-4 mr-2 text-red-400" />
                            Areas for Improvement
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedResult.areas_for_improvement.map((area, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-300">{area}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Detailed Feedback */}
                  {selectedResult.detailed_feedback && (
                    <Card className="glass-effect">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center text-sm">
                          <FileText className="h-4 w-4 mr-2 text-blue-400" />
                          Detailed AI Feedback
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {selectedResult.detailed_feedback}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Brain className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Select a Student Result</h3>
                  <p className="text-gray-400">Choose a student from the list to view detailed AI evaluation results</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}