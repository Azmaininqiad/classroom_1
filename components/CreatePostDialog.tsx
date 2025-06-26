'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import FileUpload from './FileUpload';
import { type UploadedFile } from '@/lib/storage';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string;
  onPostCreated: () => void;
}

export default function CreatePostDialog({
  open,
  onOpenChange,
  classroomId,
  onPostCreated
}: CreatePostDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;
    const type = formData.get('type') as 'announcement' | 'material';
    const authorName = formData.get('authorName') as string;
    const authorRole = formData.get('authorRole') as 'teacher' | 'student';

    if (!content || !authorName || !authorRole || !type) {
      toast.error('Please fill in all required fields');
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
        .from('posts')
        .insert({
          classroom_id: classroomId,
          content,
          type,
          author_name: authorName,
          author_role: authorRole,
          attachments
        });

      if (error) throw error;

      toast.success('Post created successfully!');
      setUploadedFiles([]);
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setUploadedFiles([]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create Post</DialogTitle>
          <DialogDescription>
            Share an announcement or material with your class
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="authorName" className="text-white">Your Name</Label>
              <Input
                id="authorName"
                name="authorName"
                placeholder="Enter your name"
                required
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="authorRole" className="text-white">Your Role</Label>
              <Select name="authorRole" required>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="type" className="text-white">Post Type</Label>
            <Select name="type" required>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="material">Material</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="content" className="text-white">Content</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Write your post content..."
              required
              rows={4}
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label className="text-white mb-3 block">Attachments</Label>
            <FileUpload
              onFilesChange={setUploadedFiles}
              initialFiles={uploadedFiles}
              maxFiles={5}
              folder="posts"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogClose(false)}
              className="flex-1 border-slate-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}