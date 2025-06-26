'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Users,
  Sparkles,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

interface AIEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  assignmentTitle: string;
  evaluationType: 'single' | 'multiple';
  onEvaluationComplete: () => void;
}

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

interface AIEvaluationResponse {
  success: boolean;
  result?: EvaluationResult;
  results?: EvaluationResult[];
  summary?: {
    average_percentage: number;
    grade_distribution: Record<string, number>;
    highest_score: number;
    lowest_score: number;
  };
  message: string;
  total_students?: number;
}

export default function AIEvaluationDialog({
  open,
  onOpenChange,
  assignmentId,
  assignmentTitle,
  evaluationType,
  onEvaluationComplete
}: AIEvaluationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [studentFiles, setStudentFiles] = useState<File[]>([]);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnswerKeyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnswerKeyFile(file);
      setError(null);
    }
  };

  const handleStudentFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setStudentFiles(files);
    setError(null);
  };

  const startEvaluation = async () => {
    if (!answerKeyFile) {
      setError('Please upload an answer key file');
      return;
    }

    if (evaluationType === 'single' && studentFiles.length !== 1) {
      setError('Please upload exactly one student response for single evaluation');
      return;
    }

    if (evaluationType === 'multiple' && studentFiles.length === 0) {
      setError('Please upload at least one student response for multiple evaluation');
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);
    setResults([]);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append('answer_key', answerKeyFile);
      formData.append('assignment_id', assignmentId);

      if (evaluationType === 'single') {
        setCurrentStep('Uploading files to AI service...');
        setProgress(20);

        formData.append('student_response', studentFiles[0]);
        const studentName = studentFiles[0].name.replace(/\.[^/.]+$/, ''); // Remove extension
        formData.append('student_name', studentName);

        setCurrentStep('AI is analyzing the submission...');
        setProgress(50);

        const response = await fetch('http://localhost:8000/api/evaluate/single', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: AIEvaluationResponse = await response.json();

        setCurrentStep('Processing results...');
        setProgress(80);

        if (data.success && data.result) {
          setResults([data.result]);
          toast.success('Single evaluation completed successfully!');
        } else {
          throw new Error(data.message || 'Evaluation failed');
        }

      } else {
        // Multiple evaluation
        setCurrentStep('Uploading answer key and student responses...');
        setProgress(10);

        studentFiles.forEach((file) => {
          formData.append('student_responses', file);
        });

        setCurrentStep('AI is analyzing all submissions...');
        setProgress(30);

        const response = await fetch('http://localhost:8000/api/evaluate/multiple', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: AIEvaluationResponse = await response.json();

        setCurrentStep('Processing results...');
        setProgress(80);

        if (data.results) {
          setResults(data.results);
          setSummary(data.summary);
          toast.success(`Multiple evaluation completed! Processed ${data.total_students} students.`);
        } else {
          throw new Error('No results received from evaluation');
        }
      }

      setProgress(100);
      setCurrentStep('Evaluation complete!');
      onEvaluationComplete();

    } catch (error) {
      console.error('Evaluation error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      toast.error('Evaluation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'A': return 'bg-green-600/20 text-green-300 border-green-500/30';
      case 'B': return 'bg-blue-600/20 text-blue-300 border-blue-500/30';
      case 'C': return 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30';
      case 'D': return 'bg-orange-600/20 text-orange-300 border-orange-500/30';
      case 'F': return 'bg-red-600/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-600/20 text-gray-300 border-gray-500/30';
    }
  };

  const resetDialog = () => {
    setAnswerKeyFile(null);
    setStudentFiles([]);
    setResults([]);
    setSummary(null);
    setError(null);
    setProgress(0);
    setCurrentStep('');
    setLoading(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !loading) {
      resetDialog();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-400" />
            AI-Powered Evaluation - {assignmentTitle}
          </DialogTitle>
          <DialogDescription>
            {evaluationType === 'single' 
              ? 'Evaluate a single student submission using AI'
              : 'Evaluate multiple student submissions in batch using AI'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          {!loading && results.length === 0 && (
            <div className="space-y-4">
              {/* Answer Key Upload */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Upload Answer Key
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      onChange={handleAnswerKeyUpload}
                      className="hidden"
                      id="answer-key-upload"
                    />
                    <label
                      htmlFor="answer-key-upload"
                      className="cursor-pointer text-blue-400 hover:text-blue-300"
                    >
                      Click to upload answer key
                    </label>
                    <p className="text-sm text-gray-400 mt-2">
                      Supports PDF, DOC, DOCX, TXT, JPG, PNG
                    </p>
                    {answerKeyFile && (
                      <div className="mt-4 p-3 bg-green-600/20 rounded-lg">
                        <p className="text-green-300 text-sm">✓ {answerKeyFile.name}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Student Responses Upload */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Upload Student Response{evaluationType === 'multiple' ? 's' : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      multiple={evaluationType === 'multiple'}
                      onChange={handleStudentFilesUpload}
                      className="hidden"
                      id="student-files-upload"
                    />
                    <label
                      htmlFor="student-files-upload"
                      className="cursor-pointer text-blue-400 hover:text-blue-300"
                    >
                      Click to upload student123 response{evaluationType === 'multiple' ? 's' : ''}
                    </label>
                    <p className="text-sm text-gray-400 mt-2">
                      {evaluationType === 'single' 
                        ? 'Upload one student response file'
                        : 'Upload multiple student response files (filename will be used as student name)'
                      }
                    </p>
                    {studentFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {studentFiles.map((file, index) => (
                          <div key={index} className="p-2 bg-blue-600/20 rounded text-blue-300 text-sm">
                            ✓ {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => handleDialogClose(false)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-gray-300"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={startEvaluation}
                  disabled={loading || !answerKeyFile || studentFiles.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start AI Evaluation
                </Button>
              </div>
            </div>
          )}

          {/* Loading Section */}
          {loading && (
            <Card className="glass-effect">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto" />
                  <h3 className="text-xl font-semibold text-white">AI is evaluating submissions...</h3>
                  <p className="text-gray-300">{currentStep}</p>
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-400">{progress}% complete</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Section */}
          {results.length > 0 && (
            <div className="space-y-6">
              {/* Summary for Multiple Evaluation */}
              {evaluationType === 'multiple' && summary && (
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Evaluation Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{results.length}</div>
                        <div className="text-sm text-gray-400">Students Evaluated</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{summary.average_percentage.toFixed(1)}%</div>
                        <div className="text-sm text-gray-400">Average Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{summary.highest_score.toFixed(1)}%</div>
                        <div className="text-sm text-gray-400">Highest Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">{summary.lowest_score.toFixed(1)}%</div>
                        <div className="text-sm text-gray-400">Lowest Score</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-3">Grade Distribution</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(summary.grade_distribution).map(([grade, count]) => (
                          <div key={grade} className="text-center">
                            <Badge className={`${getGradeColor(grade)} border mb-1`}>
                              {grade}
                            </Badge>
                            <div className="text-sm text-white">{count}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Individual Results */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Individual Results</h3>
                {results.map((result) => (
                  <Card key={result.id} className="glass-effect">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-semibold">{result.student_name}</h4>
                          <p className="text-sm text-gray-400">
                            Evaluated on {new Date(result.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={`${getGradeColor(result.grade)} border`}>
                            {result.grade}
                          </Badge>
                          <div className="text-right">
                            <div className="text-xl font-bold text-white">{result.percentage.toFixed(1)}%</div>
                            <div className="text-sm text-gray-400">
                              {result.obtained_marks}/{result.total_marks}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.correct_answers.length > 0 && (
                          <div>
                            <h5 className="text-green-400 font-medium flex items-center mb-2">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Correct Answers ({result.correct_answers.length})
                            </h5>
                            <div className="space-y-1">
                              {result.correct_answers.slice(0, 3).map((answer, index) => (
                                <div key={index} className="text-sm text-gray-300 bg-green-600/10 p-2 rounded">
                                  {answer}
                                </div>
                              ))}
                              {result.correct_answers.length > 3 && (
                                <div className="text-xs text-gray-400">
                                  +{result.correct_answers.length - 3} more...
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {result.incorrect_answers.length > 0 && (
                          <div>
                            <h5 className="text-red-400 font-medium flex items-center mb-2">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Incorrect Answers ({result.incorrect_answers.length})
                            </h5>
                            <div className="space-y-1">
                              {result.incorrect_answers.slice(0, 3).map((answer, index) => (
                                <div key={index} className="text-sm text-gray-300 bg-red-600/10 p-2 rounded">
                                  {answer}
                                </div>
                              ))}
                              {result.incorrect_answers.length > 3 && (
                                <div className="text-xs text-gray-400">
                                  +{result.incorrect_answers.length - 3} more...
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.strengths.length > 0 && (
                          <div>
                            <h5 className="text-blue-400 font-medium flex items-center mb-2">
                              <Award className="h-4 w-4 mr-1" />
                              Strengths
                            </h5>
                            <ul className="text-sm text-gray-300 space-y-1">
                              {result.strengths.map((strength, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-blue-400 mr-2">•</span>
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.areas_for_improvement.length > 0 && (
                          <div>
                            <h5 className="text-orange-400 font-medium flex items-center mb-2">
                              <Target className="h-4 w-4 mr-1" />
                              Areas for Improvement
                            </h5>
                            <ul className="text-sm text-gray-300 space-y-1">
                              {result.areas_for_improvement.map((area, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-orange-400 mr-2">•</span>
                                  {area}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {result.detailed_feedback && (
                        <div>
                          <h5 className="text-white font-medium mb-2">Detailed Feedback</h5>
                          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                            <p className="text-gray-300 whitespace-pre-wrap text-sm">
                              {result.detailed_feedback}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={resetDialog}
                  variant="outline"
                  className="flex-1 border-slate-600 text-gray-300"
                >
                  Evaluate More
                </Button>
                <Button
                  onClick={() => handleDialogClose(false)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}