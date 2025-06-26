'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Users, BookOpen, FileText, Plus, Calendar, User, Clock, Video, MessageSquare, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import CreatePostDialog from '@/components/CreatePostDialog';
import CreateAssignmentDialog from '@/components/CreateAssignmentDialog';
import SubmissionDialog from '@/components/SubmissionDialog';

interface Classroom {
  id: string;
  name: string;
  subject: string;
  class_code: string;
  description: string | null;
  created_by: string;
  color: string;
  created_at: string;
}

interface Post {
  id: string;
  classroom_id: string;
  author_name: string;
  author_role: 'teacher' | 'student';
  content: string;
  type: 'announcement' | 'material';
  attachments: string[] | null;
  created_at: string;
}

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

interface Member {
  id: string;
  classroom_id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  joined_at: string;
}

export default function ClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params.id as string;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stream');
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    if (classroomId) {
      fetchClassroomData();
    }
  }, [classroomId]);

  const fetchClassroomData = async () => {
    try {
      // Fetch classroom details
      const { data: classroomData, error: classroomError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', classroomId)
        .single();

      if (classroomError) throw classroomError;
      setClassroom(classroomData);

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('classroom_members')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('role', { ascending: true });

      if (membersError) throw membersError;
      setMembers(membersData || []);

    } catch (error) {
      console.error('Error fetching classroom data:', error);
      toast.error('Failed to load classroom data');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    fetchClassroomData();
    setCreatePostOpen(false);
  };

  const handleAssignmentCreated = () => {
    fetchClassroomData();
    setCreateAssignmentOpen(false);
  };

  const renderAttachments = (attachments: string[] | null) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="space-y-2 mt-4">
        <p className="text-sm font-medium text-gray-300">Attachments:</p>
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

  const teachers = members.filter(member => member.role === 'teacher');
  const students = members.filter(member => member.role === 'student');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Classroom not found</h2>
          <Button onClick={() => router.push('/')}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header with Classroom Banner */}
      <div className="relative">
        {/* Classroom Banner */}
        <div className="h-64 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-4 left-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-8 right-8 opacity-20">
            <div className="w-32 h-32 bg-white/10 rounded-full"></div>
          </div>
          <div className="absolute bottom-4 right-16 opacity-15">
            <div className="w-24 h-24 bg-white/10 rounded-lg rotate-12"></div>
          </div>
          
          {/* Classroom Info */}
          <div className="absolute bottom-6 left-6">
            <h1 className="text-4xl font-bold text-white mb-2">{classroom.name}</h1>
            <p className="text-xl text-blue-100 mb-1">{classroom.subject}</p>
            <div className="flex items-center space-x-4 text-blue-100">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                {classroom.class_code}
              </span>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {members.length} members
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/5 backdrop-blur-md border-b border-white/10">
          <div className="container mx-auto px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-transparent h-12 p-0 space-x-8">
                <TabsTrigger 
                  value="stream" 
                  className="bg-transparent text-gray-300 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none h-12 px-0"
                >
                  Stream
                </TabsTrigger>
                <TabsTrigger 
                  value="classwork" 
                  className="bg-transparent text-gray-300 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none h-12 px-0"
                >
                  Classwork
                </TabsTrigger>
                <TabsTrigger 
                  value="people" 
                  className="bg-transparent text-gray-300 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none h-12 px-0"
                >
                  People
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="stream" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Quick Actions */}
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => setCreatePostOpen(true)} 
                      className="w-full bg-blue-600 hover:bg-blue-700 justify-start"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                    <Button 
                      onClick={() => setCreateAssignmentOpen(true)} 
                      className="w-full bg-purple-600 hover:bg-purple-700 justify-start"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
                    </Button>
                  </CardContent>
                </Card>

                {/* Upcoming */}
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Upcoming</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assignments.length === 0 ? (
                      <p className="text-gray-400 text-sm">No upcoming assignments</p>
                    ) : (
                      <div className="space-y-3">
                        {assignments.slice(0, 3).map((assignment) => (
                          <div key={assignment.id} className="text-sm">
                            <p className="text-white font-medium">{assignment.title}</p>
                            <p className="text-gray-400">
                              Due {format(new Date(assignment.due_date), 'MMM d')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Main Feed */}
              <div className="lg:col-span-3 space-y-6">
                {/* Class Comment Box */}
                <Card className="glass-effect">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-600 text-white">
                          U
                        </AvatarFallback>
                      </Avatar>
                      <button 
                        onClick={() => setCreatePostOpen(true)}
                        className="flex-1 text-left bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 rounded-full px-4 py-3 text-gray-300 transition-colors"
                      >
                        Share something with your class...
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Posts Feed */}
                <div className="space-y-6">
                  {posts.length === 0 ? (
                    <Card className="glass-effect">
                      <CardContent className="text-center py-12">
                        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                        <p className="text-gray-300 mb-6">Be the first to share something with your class!</p>
                        <Button onClick={() => setCreatePostOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Post
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    posts.map((post) => (
                      <Card key={post.id} className="glass-effect">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback className="bg-blue-600 text-white">
                                  {post.author_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-semibold text-white">{post.author_name}</p>
                                  <Badge
                                    variant={post.author_role === 'teacher' ? 'default' : 'secondary'}
                                    className={post.author_role === 'teacher' ? 'bg-blue-600' : 'bg-gray-600'}
                                  >
                                    {post.author_role}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-400">
                                  {format(new Date(post.created_at), 'MMM d, yyyy at h:mm a')}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="border-purple-500/50 text-purple-300">
                              {post.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-300 whitespace-pre-wrap mb-4">{post.content}</p>
                          {renderAttachments(post.attachments)}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="classwork" className="mt-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Classwork</h2>
                <Button onClick={() => setCreateAssignmentOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </div>

              <div className="grid gap-6">
                {assignments.length === 0 ? (
                  <Card className="glass-effect">
                    <CardContent className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No assignments yet</h3>
                      <p className="text-gray-300 mb-6">Create your first assignment to get started!</p>
                      <Button onClick={() => setCreateAssignmentOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Assignment
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  assignments.map((assignment) => (
                    <Card key={assignment.id} className="glass-effect hover-lift cursor-pointer"
                          onClick={() => setSelectedAssignment(assignment)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white text-xl mb-2">{assignment.title}</CardTitle>
                            <div className="flex items-center space-x-6 text-sm text-gray-400">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {assignment.created_by}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Due: {format(new Date(assignment.due_date), 'MMM d, yyyy at h:mm a')}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {assignment.points} points
                              </div>
                            </div>
                          </div>
                          <div className="bg-purple-600/20 p-3 rounded-lg">
                            <FileText className="h-6 w-6 text-purple-400" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 line-clamp-3 mb-4">{assignment.description}</p>
                        {renderAttachments(assignment.attachments)}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="people" className="mt-0">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">People</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Teachers ({teachers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {teachers.map((teacher) => (
                      <div key={teacher.id} className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                        <Avatar>
                          <AvatarFallback className="bg-blue-600 text-white">
                            {teacher.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{teacher.name}</p>
                          <p className="text-sm text-gray-400">{teacher.email}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Students ({students.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                        <Avatar>
                          <AvatarFallback className="bg-purple-600 text-white">
                            {student.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{student.name}</p>
                          <p className="text-sm text-gray-400">{student.email}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        classroomId={classroomId}
        onPostCreated={handlePostCreated}
      />

      <CreateAssignmentDialog
        open={createAssignmentOpen}
        onOpenChange={setCreateAssignmentOpen}
        classroomId={classroomId}
        onAssignmentCreated={handleAssignmentCreated}
      />

      {selectedAssignment && (
        <SubmissionDialog
          assignment={selectedAssignment}
          open={!!selectedAssignment}
          onOpenChange={() => setSelectedAssignment(null)}
        />
      )}
    </div>
  );
}