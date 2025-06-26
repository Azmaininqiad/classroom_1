'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, User, Target, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Submission {
  id: string;
  assignment_id: string;
  student_name: string;
  content: string;
  attachments: string[] | null;
  status: 'submitted' | 'late' | 'missing';
  submitted_at: string;
}

interface EvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission | null;
  evaluationType: 'single' | 'multiple';
  onEvaluationCreated: () => void;
}

export default function EvaluationDialog({
  open,
  onOpenChange,
  submission,
  evaluationType,
  onEvaluationCreated
}: EvaluationDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!submission) return;

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const totalMarks = parseInt(formData.get('totalMarks') as string) || 100;
    const obtainedMarks = parseInt(formData.get('obtainedMarks') as string) || 0;
    const grade = formData.get('grade') as string || 'F';
    const correctAnswers = (formData.get('correctAnswers') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const incorrectAnswers = (formData.get('incorrectAnswers') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const partialCreditAreas = (formData.get('partialCreditAreas') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const strengths = (formData.get('strengths') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const areasForImprovement = (formData.get('areasForImprovement') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const detailedFeedback = formData.get('detailedFeedback') as string;

    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

    try {
      const { error } = await supabase
        .from('evaluations')
        .insert({
          assignment_id: submission.assignment_id,
          submission_id: submission.id,
          student_name: submission.student_name,
          total_marks: totalMarks,
          obtained_marks: obtainedMarks,
          percentage: percentage,
          grade,
          correct_answers: correctAnswers.length > 0 ? correctAnswers : null,
          incorrect_answers: incorrectAnswers.length > 0 ? incorrectAnswers : null,
          partial_credit_areas: partialCreditAreas.length > 0 ? partialCreditAreas : null,
          strengths: strengths.length > 0 ? strengths : null,
          areas_for_improvement: areasForImprovement.length > 0 ? areasForImprovement : null,
          detailed_feedback: detailedFeedback || null,
          evaluation_type: evaluationType
        });

      if (error) throw error;

      toast.success('Evaluation created successfully!');
      onEvaluationCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating evaluation:', error);
      toast.error('Failed to create evaluation');
    } finally {
      setLoading(false);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            {evaluationType === 'single' ? 'Single Evaluation' : 'Multiple Evaluation'}
          </DialogTitle>
          <DialogDescription>
            {submission ? `Evaluate submission by ${submission.student_name}` : 'Create evaluation'}
          </DialogDescription>
        </DialogHeader>

        {submission && (
          <div className="space-y-6">
            {/* Submission Details */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Submission Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="border-blue-500/50 text-blue-300">
                    Student: {submission.student_name}
                  </Badge>
                  <Badge variant="outline" className={`border ${
                    submission.status === 'submitted' ? 'border-green-500/50 text-green-300' :
                    submission.status === 'late' ? 'border-orange-500/50 text-orange-300' :
                    'border-red-500/50 text-red-300'
                  }`}>
                    {submission.status}
                  </Badge>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                  <p className="text-gray-300 whitespace-pre-wrap">{submission.content}</p>
                </div>
              </CardContent>
            </Card>

            {/* Evaluation Form */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Evaluation Form
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Scoring */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="totalMarks" className="text-white">Total Marks</Label>
                      <Input
                        id="totalMarks"
                        name="totalMarks"
                        type="number"
                        placeholder="100"
                        min="1"
                        defaultValue="100"
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="obtainedMarks" className="text-white">Obtained Marks</Label>
                      <Input
                        id="obtainedMarks"
                        name="obtainedMarks"
                        type="number"
                        placeholder="0"
                        min="0"
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="grade" className="text-white">Grade</Label>
                      <Select name="grade">
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="C+">C+</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="C-">C-</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="F">F</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Detailed Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="correctAnswers" className="text-white flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-400" />
                        Correct Answers (comma-separated)
                      </Label>
                      <Textarea
                        id="correctAnswers"
                        name="correctAnswers"
                        placeholder="Question 1, Question 3, Question 5..."
                        rows={3}
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="incorrectAnswers" className="text-white flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1 text-red-400" />
                        Incorrect Answers (comma-separated)
                      </Label>
                      <Textarea
                        id="incorrectAnswers"
                        name="incorrectAnswers"
                        placeholder="Question 2, Question 4..."
                        rows={3}
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="partialCreditAreas" className="text-white">
                      Partial Credit Areas (comma-separated)
                    </Label>
                    <Textarea
                      id="partialCreditAreas"
                      name="partialCreditAreas"
                      placeholder="Areas where student showed partial understanding..."
                      rows={2}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>

                  {/* Feedback */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="strengths" className="text-white flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-400" />
                        Strengths (comma-separated)
                      </Label>
                      <Textarea
                        id="strengths"
                        name="strengths"
                        placeholder="Good problem-solving approach, Clear explanations..."
                        rows={3}
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="areasForImprovement" className="text-white flex items-center">
                        <Target className="h-4 w-4 mr-1 text-orange-400" />
                        Areas for Improvement (comma-separated)
                      </Label>
                      <Textarea
                        id="areasForImprovement"
                        name="areasForImprovement"
                        placeholder="Mathematical calculations, Time management..."
                        rows={3}
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="detailedFeedback" className="text-white">
                      Detailed Feedback
                    </Label>
                    <Textarea
                      id="detailedFeedback"
                      name="detailedFeedback"
                      placeholder="Provide comprehensive feedback on the student's performance..."
                      rows={4}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="flex-1 border-slate-600 text-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {loading ? 'Creating Evaluation...' : 'Create Evaluation'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}