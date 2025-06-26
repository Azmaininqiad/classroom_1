'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, Upload, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import FileUpload from './FileUpload';
import { type UploadedFile } from '@/lib/storage';

interface AnswerKey {
  id: string;
  assignment_id: string;
  teacher_name: string;
  content: string | null;
  attachments: string[] | null;
  created_at: string;
}

interface AnswerKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  assignmentTitle: string;
}

export default function AnswerKeyDialog({
  open,
  onOpenChange,
  assignmentId,
  assignmentTitle
}: AnswerKeyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [answerKey, setAnswerKey] = useState<AnswerKey | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAnswerKey();
    }
  }, [open, assignmentId]);

  const fetchAnswerKey = async () => {
    try {
      const { data, error } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('assignment_id', assignmentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setAnswerKey(data);
        setShowCreateForm(false);
      } else {
        setAnswerKey(null);
        setShowCreateForm(true);
      }
    } catch (error) {
      console.error('Error fetching answer key:', error);
      toast.error('Failed to load answer key');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const teacherName = formData.get('teacherName') as string;
    const content = formData.get('content') as string;

    if (!teacherName) {
      toast.error('Please enter your name');
      setLoading(false);
      return;
    }

    try {
      // Convert uploaded files to attachment format
      const attachments = uploadedFiles.length > 0 
        ? uploadedFiles.map(file => JSON.stringify({
            name: file.name,
            url: file.url,
            size: file.size,
            type: file.type
          }))
        : null;

      const { error } = await supabase
        .from('answer_keys')
        .insert({
          assignment_id: assignmentId,
          teacher_name: teacherName,
          content: content || null,
          attachments
        });

      if (error) throw error;

      toast.success('Answer key uploaded successfully!');
      setUploadedFiles([]);
      fetchAnswerKey();
    } catch (error) {
      console.error('Error creating answer key:', error);
      toast.error('Failed to upload answer key');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!answerKey) return;

    try {
      const { error } = await supabase
        .from('answer_keys')
        .delete()
        .eq('id', answerKey.id);

      if (error) throw error;

      toast.success('Answer key deleted successfully!');
      setAnswerKey(null);
      setShowCreateForm(true);
    } catch (error) {
      console.error('Error deleting answer key:', error);
      toast.error('Failed to delete answer key');
    }
  };

  const renderAttachments = (attachments: string[] | null) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="space-y-2 mt-4">
        <p className="text-sm font-medium text-gray-300">Answer Key Files:</p>
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
            return (
              <div key={index} className="bg-slate-800/50 p-3 rounded-lg border border-slate-600">
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
      setUploadedFiles([]);
      setShowCreateForm(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Answer Key - {assignmentTitle}
          </DialogTitle>
          <DialogDescription>
            Upload and manage the answer key for this assignment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {answerKey && !showCreateForm ? (
            // Display existing answer key
            <Card className="glass-effect">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Current Answer Key</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      variant="outline"
                      size="sm"
                      className="border-blue-500/50 text-blue-400"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Update
                    </Button>
                    <Button
                      onClick={handleDelete}
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-green-500/50 text-green-300">
                    Created by: {answerKey.teacher_name}
                  </Badge>
                  <Badge variant="outline" className="border-gray-500/50 text-gray-300">
                    {new Date(answerKey.created_at).toLocaleDateString()}
                  </Badge>
                </div>
                
                {answerKey.content && (
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">Answer Key Content:</p>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                      <p className="text-gray-300 whitespace-pre-wrap">{answerKey.content}</p>
                    </div>
                  </div>
                )}
                
                {renderAttachments(answerKey.attachments)}
              </CardContent>
            </Card>
          ) : (
            // Create/Update form
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-white">
                  {answerKey ? 'Update Answer Key' : 'Upload Answer Key'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="teacherName" className="text-white">Teacher Name</Label>
                    <Input
                      id="teacherName"
                      name="teacherName"
                      placeholder="Enter your name"
                      required
                      defaultValue={answerKey?.teacher_name || ''}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content" className="text-white">Answer Key Content (Optional)</Label>
                    <Textarea
                      id="content"
                      name="content"
                      placeholder="Enter the answer key content, solutions, or instructions..."
                      rows={6}
                      defaultValue={answerKey?.content || ''}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-3 block">Answer Key Files</Label>
                    <FileUpload
                      onFilesChange={setUploadedFiles}
                      initialFiles={uploadedFiles}
                      maxFiles={10}
                      folder={`answer-keys/${assignmentId}`}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => answerKey ? setShowCreateForm(false) : handleDialogClose(false)}
                      className="flex-1 border-slate-600 text-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {loading ? 'Uploading...' : (answerKey ? 'Update Answer Key' : 'Upload Answer Key')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}