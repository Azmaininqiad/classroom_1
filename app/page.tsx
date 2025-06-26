'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Star, 
  ArrowRight, 
  Sparkles,
  Brain,
  Target,
  Zap,
  Globe,
  Shield,
  Rocket,
  Calendar
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import AuthDialog from '@/components/AuthDialog';
import UserProfile from '@/components/UserProfile';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function WelcomePage() {
  const [user, setUser] = useState<any>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    checkUser();
  }, []);

  const handleAuthSuccess = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const handleSignOut = () => {
    setUser(null);
  };

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      setAuthOpen(true);
    }
  };

  const handleEventsPage = () => {
    router.push('/events');
  };

  const handleCoursePage = () => {
    router.push('/coursepage');
  };

  const handleMcqPage = () => {
    router.push('/mcqgeneration');
  };
  const handleChatbotPage = () => {
    router.push('/chatbot');
  };
  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ClassRoom</h1>
                <p className="text-sm text-gray-300">Virtual Learning Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <UserProfile onSignOut={handleSignOut} />
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

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Hero Badge */}
            <Badge className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 text-blue-300 hover:bg-gradient-to-r hover:from-blue-500/30 hover:to-purple-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Welcome to the Future of Learning
            </Badge>

            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Transform Your
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                {" "}Learning{" "}
              </span>
              Experience
            </h1>

            {/* Hero Description */}
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students and educators in our revolutionary virtual classroom. 
              Create, collaborate, and excel in an environment designed for modern learning.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <Rocket className="mr-2 h-5 w-5" />
                {user ? 'Go to Dashboard' : 'Get Started Free'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={handleEventsPage}
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl backdrop-blur-sm"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Explore Events
              </Button>
              <Button
                onClick={handleCoursePage}
                variant="secondary"
                size="lg"
                className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10 text-lg px-8 py-6 rounded-xl backdrop-blur-sm"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Create Courses
              </Button>
              <Button
                onClick={handleMcqPage}
                variant="secondary"
                size="lg"
                className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10 text-lg px-8 py-6 rounded-xl backdrop-blur-sm"
              >
                <Users className="mr-2 h-5 w-5" />
                Generate MCQs
              </Button>
              <Button
                onClick={handleChatbotPage}
                variant="secondary"
                size="lg"
                className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10 text-lg px-8 py-6 rounded-xl backdrop-blur-sm"
              >
                <Users className="mr-2 h-5 w-5" />
                Live Teacher
              </Button>
              
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">10K+</div>
                <div className="text-gray-400">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">500+</div>
                <div className="text-gray-400">Expert Teachers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">95%</div>
                <div className="text-gray-400">Success Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose ClassRoom?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the perfect blend of technology and education with our cutting-edge features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI-Powered Learning",
                description: "Personalized learning paths powered by artificial intelligence to maximize your potential.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Users,
                title: "Collaborative Environment",
                description: "Work together with classmates and teachers in real-time collaborative spaces.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Target,
                title: "Goal-Oriented Progress",
                description: "Set and track learning goals with detailed analytics and progress reports.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Optimized performance ensures smooth learning without any interruptions.",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: Globe,
                title: "Global Community",
                description: "Connect with learners and educators from around the world.",
                color: "from-indigo-500 to-purple-500"
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your data is protected with enterprise-grade security and privacy measures.",
                color: "from-red-500 to-pink-500"
              }
            ].map((feature, index) => (
              <Card key={index} className="glass-effect hover-lift group cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white group-hover:text-blue-300 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-300">
              Join thousands of satisfied learners and educators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Computer Science Student",
                content: "ClassRoom has revolutionized how I learn. The interactive features and collaborative tools make studying enjoyable and effective.",
                rating: 5
              },
              {
                name: "Dr. Michael Chen",
                role: "Mathematics Professor",
                content: "As an educator, I've never seen students so engaged. The platform's intuitive design makes teaching a pleasure.",
                rating: 5
              },
              {
                name: "Emily Rodriguez",
                role: "High School Teacher",
                content: "The file sharing and assignment management features have streamlined my workflow completely. Highly recommended!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="glass-effect hover-lift">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle className="text-white text-lg">{testimonial.name}</CardTitle>
                  <CardDescription className="text-blue-300">{testimonial.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 italic">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <Card className="glass-effect text-center p-12">
            <CardContent className="space-y-6">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Start Your Learning Journey?
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Join our community today and experience the future of education. 
                Create your first classroom in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-12 py-6 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  {user ? 'Go to Dashboard' : 'Start Learning Today'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  onClick={handleEventsPage}
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-xl backdrop-blur-sm"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Browse Events
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 ClassRoom. All rights reserved. Built with ❤️ for learners everywhere.</p>
          </div>
        </div>
      </footer>

      {/* Auth Dialog */}
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}