'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Calendar,
  MapPin,
  Trophy,
  Users,
  Sparkles,
  BookOpen,
  GraduationCap,
  Send,
  Download,
  ThumbsUp,
  Star
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Event {
  id: string;
  author_id: string | null;
  author_name: string;
  author_avatar: string | null;
  content: string;
  event_type: string;
  attachments: string[] | null;
  location: string | null;
  event_date: string | null;
  tags: string[] | null;
  reactions_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
}

interface EventCardProps {
  event: Event;
  currentUser: any;
  onUpdate: () => void;
}

export default function EventCard({ event, currentUser, onUpdate }: EventCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasReacted, setHasReacted] = useState(false);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'achievement': return Trophy;
      case 'workshop': return BookOpen;
      case 'conference': return GraduationCap;
      case 'announcement': return Sparkles;
      case 'meetup': return Users;
      default: return Calendar;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30';
      case 'workshop': return 'bg-blue-600/20 text-blue-300 border-blue-500/30';
      case 'conference': return 'bg-purple-600/20 text-purple-300 border-purple-500/30';
      case 'announcement': return 'bg-green-600/20 text-green-300 border-green-500/30';
      case 'meetup': return 'bg-orange-600/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-600/20 text-gray-300 border-gray-500/30';
    }
  };

  const handleReaction = async () => {
    if (!currentUser) {
      toast.error('Please sign in to react to events');
      return;
    }

    try {
      const userIdentifier = currentUser.email;
      
      if (hasReacted) {
        // Remove reaction
        await supabase
          .from('event_reactions')
          .delete()
          .eq('event_id', event.id)
          .eq('user_identifier', userIdentifier);
        
        setHasReacted(false);
      } else {
        // Add reaction
        await supabase
          .from('event_reactions')
          .insert({
            event_id: event.id,
            user_identifier: userIdentifier,
            reaction_type: 'like'
          });
        
        setHasReacted(true);
      }

      onUpdate();
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to update reaction');
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('event_comments')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUser) {
      toast.error('Please sign in to comment');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('event_comments')
        .insert({
          event_id: event.id,
          author_name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Anonymous',
          author_avatar: currentUser.user_metadata?.avatar_url || null,
          content: newComment
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();
      onUpdate();
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments) {
      fetchComments();
    }
  };

  const renderAttachments = (attachments: string[] | null) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="space-y-2 mt-4">
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
                       fileData.type?.includes('video') ? '🎥' : '📎'}
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

  const EventIcon = getEventIcon(event.event_type);

  return (
    <Card className="glass-effect hover-lift">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={event.author_avatar || undefined} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                {event.author_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-semibold text-white">{event.author_name}</p>
                <Badge className={`${getEventColor(event.event_type)} border`}>
                  <EventIcon className="h-3 w-3 mr-1" />
                  {event.event_type}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">
                {format(new Date(event.created_at), 'MMM d, yyyy at h:mm a')}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-300 whitespace-pre-wrap">{event.content}</p>

        {/* Event Details */}
        {(event.location || event.event_date) && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            {event.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {event.location}
              </div>
            )}
            {event.event_date && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {format(new Date(event.event_date), 'MMM d, yyyy at h:mm a')}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs border-blue-500/30 text-blue-300">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Attachments */}
        {renderAttachments(event.attachments)}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReaction}
              className={`text-gray-400 hover:text-red-400 ${hasReacted ? 'text-red-400' : ''}`}
            >
              <Heart className={`h-4 w-4 mr-1 ${hasReacted ? 'fill-current' : ''}`} />
              {event.reactions_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleComments}
              className="text-gray-400 hover:text-blue-400"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {event.comments_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-green-400"
            >
              <Share2 className="h-4 w-4 mr-1" />
              {event.shares_count}
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-4 pt-4 border-t border-slate-700">
            {/* Add Comment */}
            {currentUser && (
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {(currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white text-sm"
                    rows={2}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={loading || !newComment.trim()}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author_avatar || undefined} />
                    <AvatarFallback className="bg-purple-600 text-white text-xs">
                      {comment.author_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-white">{comment.author_name}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-300">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}