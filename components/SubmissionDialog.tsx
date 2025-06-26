/*
  # Updated Submission Dialog with AI Evaluation Features

  1. New Features
    - Answer Key button for teachers
    - AI Single Evaluation button for individual submissions
    - AI Multiple Evaluation button for batch processing
    - Results button to view all evaluations
    - AI Results button to view AI evaluation results

  2. Enhanced UI
    - Better organization of submission management
    - AI evaluation action buttons in submission cards
    - Integration with new AI evaluation dialog
    - AI Results dialog for detailed evaluation results
*/

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, User, FileText, CheckCircle, Download, Key, GraduationCap, BarChart3, Users, Brain, Sparkles, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import FileUpload from './FileUpload';
import AnswerKeyDialog from './AnswerKeyDialog';
import EvaluationDialog from './EvaluationDialog';
import ResultsDialog from './ResultsDialog';
import AIEvaluationDialog from './AIEvaluationDialog';
import AIResultsDialog from './AIResultsDialog';
import { type UploadedFile } from '@/lib/storage';

interface Assignment {
  id: string;
  classroom_id: string;
  title: string;
  description: string;
  due_date: string;
  points: number;
  created_by: string;
  attachments: string[] | null;
  created_at: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_name: string;
  content: string;
  attachments: string[] | null;
  status: 'submitted' | 'late' | 'missing';
  submitted_at: string;
}

interface SubmissionDialogProps {
  assignment: Assignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SubmissionDialog({
  assignment,
  open,
  onOpenChange
}: SubmissionDialogProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // Dialog states
  const [answerKeyOpen, setAnswerKeyOpen] = useState(false);
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [aiEvaluationOpen, setAiEvaluationOpen] = useState(false);
  const [aiResultsOpen, setAiResultsOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [evaluationType, setEvaluationType] = useState<'single' | 'multiple'>('single');

  useEffect(() => {
    if (open && assignment) {
      fetchSubmissions();
    }
  }, [open, assignment]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignment.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const studentName = formData.get('studentName') as string;
    const content = formData.get('content') as string;

    if (!studentName || !content) {
      toast.error('Please fill in all required fields');
      setSubmitting(false);
      return;
    }

    try {
      const dueDate = new Date(assignment.due_date);
      const now = new Date();
      const status = now > dueDate ? 'late' : 'submitted';

      // First create the submission to get the ID
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignment.id,
          student_name: studentName,
          content,
          status,
          attachments: null // Will be updated after file processing
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Process uploaded files if any
      let attachments = null;
      if (uploadedFiles.length > 0) {
        attachments = uploadedFiles.map(file => JSON.stringify({
          name: file.name,
          url: file.url,
          size: file.size,
          type: file.type
        }));

        // Update submission with attachments
        const { error: updateError } = await supabase
          .from('submissions')
          .update({ attachments })
          .eq('id', submission.id);

        if (updateError) throw updateError;
      }

      toast.success('Assignment submitted successfully!');
      setShowSubmitForm(false);
      setUploadedFiles([]);
      fetchSubmissions();
    } catch (error) {
      console.error('Error creating submission:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSingleEvaluation = (submission: Submission) => {
    setSelectedSubmission(submission);
    setEvaluationType('single');
    setEvaluationOpen(true);
  };

  const handleMultipleEvaluation = () => {
    setSelectedSubmission(null);
    setEvaluationType('multiple');
    setEvaluationOpen(true);
  };

  const handleAISingleEvaluation = () => {
    setEvaluationType('single');
    setAiEvaluationOpen(true);
  };

  const handleAIMultipleEvaluation = () => {
    setEvaluationType('multiple');
    setAiEvaluationOpen(true);
  };

  const handleEvaluationCreated = () => {
    setEvaluationOpen(false);
    setSelectedSubmission(null);
    fetchSubmissions();
  };

  const handleAIEvaluationComplete = () => {
    setAiEvaluationOpen(false);
    fetchSubmissions();
  };
  

  const renderAttachments = (attachments: string[] | null) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="space-y-2 mt-4">
        <p className="text-sm font-medium text-gray-300">Submitted Files:</p>
        {attachments.map((attachment, index) => {
          try {
            const fileData = JSON.parse(attachment);
            return (
              <div key={index} className="bg-slate-800/50 p-3 rounded-lg border border-slate-600 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">
                      {fileData.type?.startsWith('image/') ? '🖼️' : 
                       fileData.type?.includes('pdf') ? '📄' : 
                       fileData.type?.includes('presentation') ? '📊' : 
                       fileData.type?.includes('document') ? '📝' : '📎'}
                    </span>
                    <div>
                      <p className="text-sm text-blue-300 font-medium">{fileData.name}</p>
                      <p className="text-xs text-gray-400">
                        {fileData.size ? `${Math.round(fileData.size / 1024)} KB` : 'Unknown size'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(fileData.url, '_blank')}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          } catch (e) {
            // Fallback for old format
            return (
              <div key={index} className="bg-slate-800/50 p-3 rounded-lg border border-slate-600 hover:bg-slate-700/50 transition-colors">
                <p className="text-sm text-blue-300">{attachment}</p>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const renderAssignmentAttachments = (attachments: string[] | null) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="space-y-2 mt-4">
        <p className="text-sm font-medium text-gray-300">Assignment Files:</p>
        {attachments.map((attachment, index) => {
          try {
            const fileData = JSON.parse(attachment);
            return (
              <div key={index} className="bg-slate-800/50 p-3 rounded-lg border border-slate-600 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">
                      {fileData.type?.startsWith('image/') ? '🖼️' : 
                       fileData.type?.includes('pdf') ? '📄' : 
                       fileData.type?.includes('presentation') ? '📊' : 
                       fileData.type?.includes('document') ? '📝' : '📎'}
                    </span>
                    <div>
                      <p className="text-sm text-blue-300 font-medium">{fileData.name}</p>
                      <p className="text-xs text-gray-400">
                        {fileData.size ? `${Math.round(fileData.size / 1024)} KB` : 'Unknown size'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(fileData.url, '_blank')}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          } catch (e) {
            // Fallback for old format
            return (
              <div key={index} className="bg-slate-800/50 p-3 rounded-lg border border-slate-600 hover:bg-slate-700/50 transition-colors">
                <p className="text-sm text-blue-300">{attachment}</p>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setShowSubmitForm(false);
      setUploadedFiles([]);
    }
    onOpenChange(open);
  };

  const isOverdue = new Date() > new Date(assignment.due_date);

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="bg-slate-900/95 border-slate-700 max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{assignment.title}</DialogTitle>
            <DialogDescription className="text-gray-300">
              Assignment details and submissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Assignment Details */}
            <Card className="glass-effect">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Assignment Details
                  </CardTitle>
                  {/* Teacher Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => setAnswerKeyOpen(true)}
                      variant="outline"
                      size="sm"
                      className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Key className="h-4 w-4 mr-1" />
                      Answer Key
                    </Button>
                    <Button
                      onClick={handleAISingleEvaluation}
                      variant="outline"
                      size="sm"
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    >
                      <Brain className="h-4 w-4 mr-1" />
                      AI Single
                    </Button>
                    <Button
                      onClick={handleAIMultipleEvaluation}
                      variant="outline"
                      size="sm"
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      AI Batch
                    </Button>
                    <Button
                      onClick={() => setResultsOpen(true)}
                      variant="outline"
                      size="sm"
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Results
                    </Button>
                    <Button
                      onClick={() => setAiResultsOpen(true)}
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      AI Results
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">{assignment.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center text-gray-400">
                    <User className="h-4 w-4 mr-2" />
                    Created by: {assignment.created_by}
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    Due: {format(new Date(assignment.due_date), 'MMM d, yyyy at h:mm a')}
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    Points: {assignment.points}
                  </div>
                </div>
                {isOverdue && (
                  <Badge variant="destructive" className="bg-red-600">
                    Overdue
                  </Badge>
                )}
                {renderAssignmentAttachments(assignment.attachments)}
              </CardContent>
            </Card>

            {/* Submit Assignment */}
            {!showSubmitForm ? (
              <div className="text-center">
                <Button
                  onClick={() => setShowSubmitForm(true)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isOverdue}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isOverdue ? 'Assignment Overdue' : 'Submit Assignment'}
                </Button>
              </div>
            ) : (
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="text-white">Submit Your Work</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="studentName" className="text-white">Your Name</Label>
                      <Input
                        id="studentName"
                        name="studentName"
                        placeholder="Enter your full name"
                        required
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="content" className="text-white">Submission Content</Label>
                      <Textarea
                        id="content"
                        name="content"
                        placeholder="Enter your submission or answer..."
                        required
                        rows={4}
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    
                    {/* File Upload Section */}
                    <div>
                      <Label className="text-white mb-3 block">Submission Files</Label>
                      <FileUpload
                        onFilesChange={setUploadedFiles}
                        initialFiles={uploadedFiles}
                        maxFiles={10}
                        folder={`submissions/${assignment.id}`}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowSubmitForm(false)}
                        className="flex-1 border-slate-600 text-gray-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {submitting ? 'Submitting...' : 'Submit Assignment'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Submissions */}
            <Card className="glass-effect">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <span>Submissions ({submissions.length})</span>
                  </CardTitle>
                  <div className="flex gap-2">
                    {submissions.length > 0 && (
                      <Button
                        onClick={handleMultipleEvaluation}
                        variant="outline"
                        size="sm"
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Manual Batch
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchSubmissions}
                      disabled={loading}
                      className="border-slate-600 text-gray-300"
                    >
                      {loading ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No submissions yet</p>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback className="bg-green-600 text-white">
                                {submission.student_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-white">{submission.student_name}</p>
                              <p className="text-sm text-gray-400">
                                {format(new Date(submission.submitted_at), 'MMM d, yyyy at h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={submission.status === 'submitted' ? 'default' : 'destructive'}
                              className={submission.status === 'submitted' ? 'bg-green-600' : 'bg-orange-600'}
                            >
                              {submission.status}
                            </Badge>
                            <Button
                              onClick={() => handleSingleEvaluation(submission)}
                              variant="outline"
                              size="sm"
                              className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                            >
                              <GraduationCap className="h-4 w-4 mr-1" />
                              Manual
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-300 mb-3">{submission.content}</p>
                        {renderAttachments(submission.attachments)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Answer Key Dialog */}
      <AnswerKeyDialog
        open={answerKeyOpen}
        onOpenChange={setAnswerKeyOpen}
        assignmentId={assignment.id}
        assignmentTitle={assignment.title}
      />

      {/* Manual Evaluation Dialog */}
      <EvaluationDialog
        open={evaluationOpen}
        onOpenChange={setEvaluationOpen}
        submission={selectedSubmission}
        evaluationType={evaluationType}
        onEvaluationCreated={handleEvaluationCreated}
      />

      {/* AI Evaluation Dialog */}
      <AIEvaluationDialog
        open={aiEvaluationOpen}
        onOpenChange={setAiEvaluationOpen}
        assignmentId={assignment.id}
        assignmentTitle={assignment.title}
        evaluationType={evaluationType}
        onEvaluationComplete={handleAIEvaluationComplete}
      />

      {/* Results Dialog */}
      <ResultsDialog
        open={resultsOpen}
        onOpenChange={setResultsOpen}
        assignmentId={assignment.id}
        assignmentTitle={assignment.title}
      />

      {/* AI Results Dialog */}
      <AIResultsDialog
        open={aiResultsOpen}
        onOpenChange={setAiResultsOpen}
        assignmentId={assignment.id}
        assignmentTitle={assignment.title}
      />
    </>
  );
}