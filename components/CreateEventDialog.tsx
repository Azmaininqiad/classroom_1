'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Tag, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import FileUpload from './FileUpload';
import { type UploadedFile } from '@/lib/storage';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated: () => void;
  currentUser: any;
}

export default function CreateEventDialog({
  open,
  onOpenChange,
  onEventCreated,
  currentUser
}: CreateEventDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;
    const eventType = formData.get('eventType') as string;
    const location = formData.get('location') as string;
    const eventDate = formData.get('eventDate') as string;

    if (!content) {
      toast.error('Please enter event content');
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

      const authorName = currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'Anonymous User';
      const authorAvatar = currentUser?.user_metadata?.avatar_url || null;

      const { error } = await supabase
        .from('events')
        .insert({
          author_id: currentUser?.id || null,
          author_name: authorName,
          author_avatar: authorAvatar,
          content,
          event_type: eventType,
          location: location || null,
          event_date: eventDate ? new Date(eventDate).toISOString() : null,
          tags: tags.length > 0 ? tags : null,
          attachments
        });

      if (error) throw error;

      toast.success('Event created successfully!');
      setUploadedFiles([]);
      setTags([]);
      setTagInput('');
      onEventCreated();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setUploadedFiles([]);
      setTags([]);
      setTagInput('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create Educational Event</DialogTitle>
          <DialogDescription>
            Share an educational event, achievement, or announcement with the community
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="eventType" className="text-white">Event Type</Label>
            <Select name="eventType" required>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="achievement">Achievement</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="meetup">Meetup</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="content" className="text-white">Event Description</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Share details about your educational event, achievement, or announcement..."
              required
              rows={4}
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location" className="text-white flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Location (Optional)
              </Label>
              <Input
                id="location"
                name="location"
                placeholder="Event location"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="eventDate" className="text-white flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Event Date (Optional)
              </Label>
              <Input
                id="eventDate"
                name="eventDate"
                type="datetime-local"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-white flex items-center mb-2">
              <Tag className="h-4 w-4 mr-1" />
              Tags (Optional)
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                className="bg-slate-800 border-slate-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 5}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-blue-600/20 text-blue-300">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-white mb-3 block">Event Media</Label>
            <FileUpload
              onFilesChange={setUploadedFiles}
              initialFiles={uploadedFiles}
              maxFiles={5}
              folder="events"
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
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}