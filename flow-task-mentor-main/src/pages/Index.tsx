
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Calendar, MessageSquare, Shield, ArrowRight, Github, Mail } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">TaskFlow AI</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
            <Link to="/auth">
              <Button variant="outline" className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto animate-fade-up">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your AI Personal
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {' '}Task Assistant
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Revolutionize your productivity with AI-powered task management, 
            smart scheduling, and natural language planning.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg glow-effect">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Experience the future of task management with AI-driven insights and automation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="glass-effect border-0 hover:scale-105 transition-transform duration-300">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Smart Scheduling</h3>
              <p className="text-gray-300 leading-relaxed">
                AI analyzes your patterns and priorities to optimize your schedule automatically
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 hover:scale-105 transition-transform duration-300">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Conversational Chat</h3>
              <p className="text-gray-300 leading-relaxed">
                Plan and manage tasks naturally using our AI chat interface
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 hover:scale-105 transition-transform duration-300">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Secure Real-Time Sync</h3>
              <p className="text-gray-300 leading-relaxed">
                Your data is protected and synchronized across all your devices instantly
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="container mx-auto px-6 py-12 border-t border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Brain className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">TaskFlow AI</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Github className="h-6 w-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Mail className="h-6 w-6" />
            </a>
            <span className="text-gray-400">© 2024 TaskFlow AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
