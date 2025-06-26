'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Calendar,
  MapPin,
  Trophy,
  Users,
  Sparkles,
  Search,
  Filter,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Home,
  User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import UserProfile from '@/components/UserProfile';
import AuthDialog from '@/components/AuthDialog';
import CreateEventDialog from '@/components/CreateEventDialog';
import EventCard from '@/components/EventCard';

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

export default function EventsPage() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };

    checkUser();
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setAuthOpen(false);
  };

  const handleSignOut = () => {
    setUser(null);
  };

  const handleEventCreated = () => {
    fetchEvents();
    setCreateEventOpen(false);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || event.event_type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const eventTypes = [
    { value: 'all', label: 'All Events', icon: Users },
    { value: 'achievement', label: 'Achievements', icon: Trophy },
    { value: 'workshop', label: 'Workshops', icon: BookOpen },
    { value: 'conference', label: 'Conferences', icon: GraduationCap },
    { value: 'announcement', label: 'Announcements', icon: Sparkles },
  ];

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
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Events</h1>
                  <p className="text-sm text-gray-300">Educational Community Feed</p>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/')}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Classrooms
                </Button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Button
                    onClick={() => setCreateEventOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/profile/${user.id}`)}
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                  <UserProfile onSignOut={handleSignOut} />
                </>
              ) : (
                <Button
                  onClick={() => setAuthOpen(true)}
                  variant="outline"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-white text-lg">Search Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {eventTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={selectedFilter === type.value ? "default" : "ghost"}
                    onClick={() => setSelectedFilter(type.value)}
                    className={`w-full justify-start ${
                      selectedFilter === type.value 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'text-gray-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <type.icon className="h-4 w-4 mr-2" />
                    {type.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{events.length}</div>
                  <div className="text-sm text-gray-400">Total Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {events.filter(e => e.event_type === 'achievement').length}
                  </div>
                  <div className="text-sm text-gray-400">Achievements</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {events.filter(e => e.event_type === 'workshop').length}
                  </div>
                  <div className="text-sm text-gray-400">Workshops</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-6">
            {/* Create Event Prompt */}
            {user && (
              <Card className="glass-effect">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {(user.user_metadata?.name || user.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button 
                      onClick={() => setCreateEventOpen(true)}
                      className="flex-1 text-left bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 rounded-full px-4 py-3 text-gray-300 transition-colors"
                    >
                      Share an educational event or achievement...
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Events Feed */}
            <div className="space-y-6">
              {filteredEvents.length === 0 ? (
                <Card className="glass-effect">
                  <CardContent className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
                    <p className="text-gray-300 mb-6">
                      {searchQuery || selectedFilter !== 'all' 
                        ? 'Try adjusting your search or filters' 
                        : 'Be the first to share an educational event!'}
                    </p>
                    {user && (
                      <Button 
                        onClick={() => setCreateEventOpen(true)} 
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Event
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    currentUser={user}
                    onUpdate={fetchEvents}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={handleAuthSuccess}
      />

      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onEventCreated={handleEventCreated}
        currentUser={user}
      />
    </div>
  );
}