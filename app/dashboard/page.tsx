'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, BookOpen, GraduationCap, Code, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import UserProfile from '@/components/UserProfile';

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

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/');
        return;
      }
      setUser(currentUser);
      fetchClassrooms();
    };

    checkAuth();
  }, [router]);

  const fetchClassrooms = async () => {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClassrooms(data || []);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      toast.error('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;

    if (!name || !subject) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Generate unique class code
      const classCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .insert({
          name,
          subject,
          description,
          class_code: classCode,
          created_by: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          color: 'from-blue-500 to-purple-600'
        })
        .select()
        .single();

      if (classroomError) throw classroomError;

      // Add teacher as member
      const { error: memberError } = await supabase
        .from('classroom_members')
        .insert({
          classroom_id: classroom.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email,
          role: 'teacher'
        });

      if (memberError) throw memberError;

      toast.success('Classroom created successfully!');
      setCreateOpen(false);
      fetchClassrooms();
      router.push(`/classroom/${classroom.id}`);
    } catch (error) {
      console.error('Error creating classroom:', error);
      toast.error('Failed to create classroom');
    }
  };

  const handleJoinClassroom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const classCode = (formData.get('classCode') as string).toUpperCase();

    if (!classCode) {
      toast.error('Please enter a class code');
      return;
    }

    try {
      // Find classroom by class code
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('id')
        .eq('class_code', classCode)
        .single();

      if (classroomError || !classroom) {
        toast.error('Invalid class code');
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('classroom_members')
        .select('id')
        .eq('classroom_id', classroom.id)
        .eq('email', user.email)
        .single();

      if (existingMember) {
        toast.error('You are already a member of this classroom');
        router.push(`/classroom/${classroom.id}`);
        return;
      }

      // Add student as member
      const { error: memberError } = await supabase
        .from('classroom_members')
        .insert({
          classroom_id: classroom.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email,
          role: 'student'
        });

      if (memberError) throw memberError;

      toast.success('Successfully joined classroom!');
      setJoinOpen(false);
      fetchClassrooms();
      router.push(`/classroom/${classroom.id}`);
    } catch (error) {
      console.error('Error joining classroom:', error);
      toast.error('Failed to join classroom');
    }
  };

  const handleSignOut = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-sm text-gray-300">Manage your classrooms</p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                    <Code className="mr-2 h-4 w-4" />
                    Join Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Join Classroom</DialogTitle>
                    <DialogDescription>
                      Enter the class code to join a classroom
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleJoinClassroom} className="space-y-4">
                    <div>
                      <Label htmlFor="classCode" className="text-white">Class Code</Label>
                      <Input
                        id="classCode"
                        name="classCode"
                        placeholder="Enter class code"
                        required
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      Join Classroom
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Classroom</DialogTitle>
                    <DialogDescription>
                      Set up a new classroom for your students
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateClassroom} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-white">Class Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., Mathematics 101"
                        required
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject" className="text-white">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="e.g., Mathematics"
                        required
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Brief description of the class"
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      Create Classroom
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <UserProfile onSignOut={handleSignOut} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {classrooms.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">No Classrooms Yet</h2>
            <p className="text-gray-300 mb-8 max-w-md mx-auto">
              Get started by creating your first classroom or joining an existing one with a class code.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Class
              </Button>
              <Button
                onClick={() => setJoinOpen(true)}
                variant="outline"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              >
                <Code className="mr-2 h-4 w-4" />
                Join a Class
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white">Your Classrooms</h2>
                <p className="text-gray-300">Manage and access your classes</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((classroom) => (
                <Card
                  key={classroom.id}
                  className="gradient-card hover-lift cursor-pointer group"
                  onClick={() => router.push(`/classroom/${classroom.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-xs text-gray-400 bg-slate-800/50 px-2 py-1 rounded">
                        {classroom.class_code}
                      </div>
                    </div>
                    <CardTitle className="text-white group-hover:text-blue-300 transition-colors">
                      {classroom.name}
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      {classroom.subject}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-gray-400 mb-3">
                      <Users className="h-4 w-4 mr-2" />
                      Created by {classroom.created_by}
                    </div>
                    {classroom.description && (
                      <p className="text-sm text-gray-300 line-clamp-2">{classroom.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}