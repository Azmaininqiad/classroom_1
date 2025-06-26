'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  User, 
  MapPin, 
  Globe, 
  Calendar,
  Trophy,
  BookOpen,
  Edit,
  Save,
  X,
  ArrowLeft,
  Mail,
  Star,
  Award,
  Target
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getCurrentUser } from '@/lib/auth';
import EventCard from '@/components/EventCard';

interface UserProfile {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
  achievements: string[] | null;
  created_at: string;
  updated_at: string;
}

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

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    achievements: [] as string[]
  });
  const [newAchievement, setNewAchievement] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };

    checkUser();
    fetchProfile();
    fetchUserEvents();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      // First try to find by user_id
      let { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If not found by user_id, try by email (for backward compatibility)
      if (error && error.code === 'PGRST116') {
        const { data: profileByEmail, error: emailError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', userId)
          .single();

        if (emailError && emailError.code === 'PGRST116') {
          // Profile doesn't exist, create a basic one
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: userId,
              name: 'User',
              email: userId.includes('@') ? userId : `NULL`,
              bio: 'No bio available'
            })
            .select()
            .single();

          if (createError) throw createError;
          profileData = newProfile;
        } else if (emailError) {
          throw emailError;
        } else {
          profileData = profileByEmail;
        }
      } else if (error) {
        throw error;
      }

      setProfile(profileData);
      setEditForm({
        name: profileData.name || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        website: profileData.website || '',
        achievements: profileData.achievements || []
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserEvents(data || []);
    } catch (error) {
      console.error('Error fetching user events:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: editForm.name,
          bio: editForm.bio,
          location: editForm.location,
          website: editForm.website,
          achievements: editForm.achievements,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim() && !editForm.achievements.includes(newAchievement.trim())) {
      setEditForm({
        ...editForm,
        achievements: [...editForm.achievements, newAchievement.trim()]
      });
      setNewAchievement('');
    }
  };

  const handleRemoveAchievement = (achievement: string) => {
    setEditForm({
      ...editForm,
      achievements: editForm.achievements.filter(a => a !== achievement)
    });
  };

  const isOwnProfile = currentUser?.id === userId;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Profile not found</h2>
          <Button onClick={() => router.push('/events')}>Go Back to Events</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/events')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            {isOwnProfile && (
              <Button
                onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                className={editing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
              >
                {editing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                {editing ? 'Save Profile' : 'Edit Profile'}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-blue-500/20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {editing ? (
                  <div className="space-y-3">
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="bg-slate-800 border-slate-600 text-white text-center"
                    />
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold text-white mb-2">{profile.name}</h1>
                )}

                <div className="flex items-center justify-center text-gray-400 mb-4">
                  <Mail className="h-4 w-4 mr-1" />
                  {profile.email}
                </div>

                {editing ? (
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    className="bg-slate-800 border-slate-600 text-white"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-300 mb-4">{profile.bio || 'No bio available'}</p>
                )}

                <div className="space-y-2 text-sm">
                  {editing ? (
                    <>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <Input
                          value={editForm.location}
                          onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                          placeholder="Location"
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-gray-400" />
                        <Input
                          value={editForm.website}
                          onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                          placeholder="Website"
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {profile.location && (
                        <div className="flex items-center text-gray-400">
                          <MapPin className="h-4 w-4 mr-2" />
                          {profile.location}
                        </div>
                      )}
                      {profile.website && (
                        <div className="flex items-center text-gray-400">
                          <Globe className="h-4 w-4 mr-2" />
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                            {profile.website}
                          </a>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex items-center text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    Joined {format(new Date(profile.created_at), 'MMM yyyy')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newAchievement}
                        onChange={(e) => setNewAchievement(e.target.value)}
                        placeholder="Add achievement..."
                        className="bg-slate-800 border-slate-600 text-white"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddAchievement()}
                      />
                      <Button
                        onClick={handleAddAchievement}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editForm.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-800/50 p-2 rounded">
                          <span className="text-white text-sm">{achievement}</span>
                          <Button
                            onClick={() => handleRemoveAchievement(achievement)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile.achievements && profile.achievements.length > 0 ? (
                      profile.achievements.map((achievement, index) => (
                        <Badge key={index} variant="outline" className="w-full justify-start border-yellow-500/30 text-yellow-300">
                          <Award className="h-3 w-3 mr-1" />
                          {achievement}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm">No achievements yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Activity Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{userEvents.length}</div>
                  <div className="text-sm text-gray-400">Events Shared</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {userEvents.filter(e => e.event_type === 'achievement').length}
                  </div>
                  <div className="text-sm text-gray-400">Achievements</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {userEvents.reduce((sum, event) => sum + event.reactions_count, 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Reactions</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="events" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="events" className="data-[state=active]:bg-blue-600">
                  Events & Posts
                </TabsTrigger>
                <TabsTrigger value="achievements" className="data-[state=active]:bg-blue-600">
                  Achievements
                </TabsTrigger>
              </TabsList>

              <TabsContent value="events" className="mt-6">
                <div className="space-y-6">
                  {userEvents.length === 0 ? (
                    <Card className="glass-effect">
                      <CardContent className="text-center py-12">
                        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No events shared yet</h3>
                        <p className="text-gray-300">
                          {isOwnProfile ? 'Start sharing your educational journey!' : 'This user hasn\'t shared any events yet.'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    userEvents.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        currentUser={currentUser}
                        onUpdate={fetchUserEvents}
                      />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="achievements" className="mt-6">
                <div className="space-y-6">
                  {userEvents.filter(e => e.event_type === 'achievement').length === 0 ? (
                    <Card className="glass-effect">
                      <CardContent className="text-center py-12">
                        <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No achievements shared</h3>
                        <p className="text-gray-300">
                          {isOwnProfile ? 'Share your accomplishments with the community!' : 'This user hasn\'t shared any achievements yet.'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    userEvents
                      .filter(e => e.event_type === 'achievement')
                      .map((event) => (
                        <EventCard 
                          key={event.id} 
                          event={event} 
                          currentUser={currentUser}
                          onUpdate={fetchUserEvents}
                        />
                      ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}