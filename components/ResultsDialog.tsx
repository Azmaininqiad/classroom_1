'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  User, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Award,
  FileText,
  Calendar,
  Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Evaluation {
  id: string;
  assignment_id: string;
  submission_id: string;
  student_name: string;
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  grade: string;
  correct_answers: string[] | null;
  incorrect_answers: string[] | null;
  partial_credit_areas: string[] | null;
  strengths: string[] | null;
  areas_for_improvement: string[] | null;
  detailed_feedback: string | null;
  evaluation_type: string;
  batch_id: string | null;
  created_at: string;
}

interface ResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  assignmentTitle: string;
}

export default function ResultsDialog({
  open,
  onOpenChange,
  assignmentId,
  assignmentTitle
}: ResultsDialogProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalEvaluations: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    gradeDistribution: {} as Record<string, number>
  });

  useEffect(() => {
    if (open) {
      fetchEvaluations();
    }
  }, [open, assignmentId]);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEvaluations(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast.error('Failed to load evaluation results');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (evaluations: Evaluation[]) => {
    if (evaluations.length === 0) {
      setStats({
        totalEvaluations: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        gradeDistribution: {}
      });
      return;
    }

    const scores = evaluations.map(e => e.percentage);
    const grades = evaluations.map(e => e.grade);

    const gradeDistribution = grades.reduce((acc, grade) => {
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      totalEvaluations: evaluations.length,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      gradeDistribution
    });
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'A+':
      case 'A': return 'bg-green-600/20 text-green-300 border-green-500/30';
      case 'A-':
      case 'B+':
      case 'B': return 'bg-blue-600/20 text-blue-300 border-blue-500/30';
      case 'B-':
      case 'C+':
      case 'C': return 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30';
      case 'C-':
      case 'D': return 'bg-orange-600/20 text-orange-300 border-orange-500/30';
      case 'F': return 'bg-red-600/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-600/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 80) return 'text-blue-400';
    if (percentage >= 70) return 'text-yellow-400';
    if (percentage >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const exportResults = () => {
  const csvContent = [
    ['Student Name', 'Total Marks', 'Obtained Marks', 'Percentage', 'Grade', 'Evaluation Date'],
    ...evaluations.map(evaluation => [
      evaluation.student_name,
      evaluation.total_marks.toString(),
      evaluation.obtained_marks.toString(),
      evaluation.percentage.toFixed(2),
      evaluation.grade,
      format(new Date(evaluation.created_at), 'yyyy-MM-dd HH:mm:ss'),
    ])
  ]
    .map(row => row.join(','))
    .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assignmentTitle}_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Evaluation Results - {assignmentTitle}
              </DialogTitle>
              <DialogDescription>
                View and analyze student evaluation results
              </DialogDescription>
            </div>
            {evaluations.length > 0 && (
              <Button
                onClick={exportResults}
                variant="outline"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-300 mt-4">Loading evaluation results...</p>
            </div>
          ) : evaluations.length === 0 ? (
            <Card className="glass-effect">
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Evaluations Yet</h3>
                <p className="text-gray-300">No evaluations have been created for this assignment.</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="individual" className="data-[state=active]:bg-blue-600">
                  Individual Results
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600">
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <Card className="glass-effect">
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-blue-400">{stats.totalEvaluations}</div>
                      <div className="text-sm text-gray-400">Total Evaluations</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-effect">
                    <CardContent className="p-6 text-center">
                      <div className={`text-2xl font-bold ${getPerformanceColor(stats.averageScore)}`}>
                        {stats.averageScore.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-400">Average Score</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-effect">
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-green-400">{stats.highestScore.toFixed(1)}%</div>
                      <div className="text-sm text-gray-400">Highest Score</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-effect">
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-red-400">{stats.lowestScore.toFixed(1)}%</div>
                      <div className="text-sm text-gray-400">Lowest Score</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Grade Distribution */}
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="text-white">Grade Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
                        <div key={grade} className="text-center">
                          <Badge className={`${getGradeColor(grade)} border mb-2`}>
                            {grade}
                          </Badge>
                          <div className="text-xl font-bold text-white">{count}</div>
                          <div className="text-xs text-gray-400">
                            {((count / stats.totalEvaluations) * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="individual" className="mt-6">
                <div className="space-y-4">
                  {evaluations.map((evaluation) => (
                    <Card key={evaluation.id} className="glass-effect">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback className="bg-blue-600 text-white">
                                {evaluation.student_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-white font-semibold">{evaluation.student_name}</h3>
                              <p className="text-sm text-gray-400">
                                {format(new Date(evaluation.created_at), 'MMM d, yyyy at h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={`${getGradeColor(evaluation.grade)} border`}>
                              {evaluation.grade}
                            </Badge>
                            <div className="text-right">
                              <div className={`text-xl font-bold ${getPerformanceColor(evaluation.percentage)}`}>
                                {evaluation.percentage.toFixed(1)}%
                              </div>
                              <div className="text-sm text-gray-400">
                                {evaluation.obtained_marks}/{evaluation.total_marks}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {evaluation.correct_answers && evaluation.correct_answers.length > 0 && (
                            <div>
                              <h4 className="text-green-400 font-medium flex items-center mb-2">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Correct Answers
                              </h4>
                              <div className="space-y-1">
                                {evaluation.correct_answers.map((answer, index) => (
                                  <Badge key={index} variant="outline" className="border-green-500/30 text-green-300 mr-1 mb-1">
                                    {answer}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {evaluation.incorrect_answers && evaluation.incorrect_answers.length > 0 && (
                            <div>
                              <h4 className="text-red-400 font-medium flex items-center mb-2">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Incorrect Answers
                              </h4>
                              <div className="space-y-1">
                                {evaluation.incorrect_answers.map((answer, index) => (
                                  <Badge key={index} variant="outline" className="border-red-500/30 text-red-300 mr-1 mb-1">
                                    {answer}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {evaluation.strengths && evaluation.strengths.length > 0 && (
                            <div>
                              <h4 className="text-blue-400 font-medium flex items-center mb-2">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Strengths
                              </h4>
                              <ul className="text-sm text-gray-300 space-y-1">
                                {evaluation.strengths.map((strength, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-blue-400 mr-2">•</span>
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {evaluation.areas_for_improvement && evaluation.areas_for_improvement.length > 0 && (
                            <div>
                              <h4 className="text-orange-400 font-medium flex items-center mb-2">
                                <Target className="h-4 w-4 mr-1" />
                                Areas for Improvement
                              </h4>
                              <ul className="text-sm text-gray-300 space-y-1">
                                {evaluation.areas_for_improvement.map((area, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-orange-400 mr-2">•</span>
                                    {area}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {evaluation.detailed_feedback && (
                          <div>
                            <h4 className="text-white font-medium mb-2">Detailed Feedback</h4>
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                              <p className="text-gray-300 whitespace-pre-wrap">{evaluation.detailed_feedback}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glass-effect">
                    <CardHeader>
                      <CardTitle className="text-white">Performance Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {['90-100%', '80-89%', '70-79%', '60-69%', 'Below 60%'].map((range, index) => {
                          const [min, max] = range.includes('Below') 
                            ? [0, 59] 
                            : range.split('-').map(s => parseInt(s.replace('%', '')));
                          
                          const count = evaluations.filter(e => 
                            range.includes('Below') 
                              ? e.percentage < 60 
                              : e.percentage >= min && e.percentage <= max
                          ).length;
                          
                          const percentage = stats.totalEvaluations > 0 ? (count / stats.totalEvaluations) * 100 : 0;
                          
                          return (
                            <div key={range} className="flex items-center justify-between">
                              <span className="text-gray-300">{range}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-slate-700 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-white font-medium w-12 text-right">{count}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-effect">
                    <CardHeader>
                      <CardTitle className="text-white">Common Feedback Themes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-green-400 font-medium mb-2">Most Common Strengths</h4>
                          <div className="space-y-1">
                            {/* This would require more complex analysis in a real implementation */}
                            <div className="text-sm text-gray-300">• Problem-solving approach</div>
                            <div className="text-sm text-gray-300">• Clear explanations</div>
                            <div className="text-sm text-gray-300">• Mathematical accuracy</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-orange-400 font-medium mb-2">Areas Needing Attention</h4>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-300">• Time management</div>
                            <div className="text-sm text-gray-300">• Detailed explanations</div>
                            <div className="text-sm text-gray-300">• Calculation errors</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}