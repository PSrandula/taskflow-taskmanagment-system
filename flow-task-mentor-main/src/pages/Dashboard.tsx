import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Brain, MessageSquare, Calendar, CheckCircle, LogOut, 
  List, ArrowRight, Circle, User, Plus, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { database } from '@/lib/firebase'; 
import { ref, onValue, push, set, get, child } from 'firebase/database';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  assignee: string;
}

// Gemini API configuration
const GEMINI_API_KEY = "AIzaSyCu3KCwXtkIIy_8hg1qnAF7ZGnNXNTO_Xw";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

interface ChatMessage {
  id?: string; // Firebase will generate this
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [chatMessage, setChatMessage] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();
  
  // Create a ref for the chat messages container
  const chatMessagesRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  React.useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  // Load tasks and chat history from Firebase
  React.useEffect(() => {
    if (currentUser) {
      // Load tasks
      const tasksRef = ref(database, `tasks/${currentUser.uid}`);
      const unsubscribeTasks = onValue(tasksRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const tasksList = Object.entries(data).map(([id, task]: [string, any]) => ({
            id,
            title: task.title || '',
            description: task.description || '',
            dueDate: task.dueDate || '',
            priority: task.priority || 'medium',
            assignee: task.assignee || '',
            completed: task.completed || false,
            createdAt: task.createdAt || Date.now(),
          }));
          setTasks(tasksList.sort((a, b) => b.createdAt - a.createdAt));
        } else {
          setTasks([]);
        }
      });

      // Load chat history
      const chatRef = ref(database, `chats/${currentUser.uid}`);
      const unsubscribeChat = onValue(chatRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const chatList: ChatMessage[] = Object.entries(data).map(([id, chat]: [string, any]) => ({
            id,
            role: chat.role,
            text: chat.text,
            timestamp: chat.timestamp
          })).sort((a, b) => a.timestamp - b.timestamp);
          
          setChatHistory(chatList);
        } else {
          setChatHistory([]);
        }
      });

      return () => {
        unsubscribeTasks();
        unsubscribeChat();
      };
    }
  }, [currentUser]);

  const getGeminiResponse = async (userInput: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: userInput }]
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 
             "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error('Gemini API error:', error);
      return "I'm having trouble connecting. Please check your connection and try again.";
    } finally {
      setIsLoading(false);
    }
  };

  // Save message to Firebase
  const saveMessageToFirebase = async (message: ChatMessage) => {
    if (!currentUser) return;
    
    try {
      const chatRef = ref(database, `chats/${currentUser.uid}`);
      const newMessageRef = push(chatRef);
      await set(newMessageRef, {
        ...message,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to save chat message:', error);
    }
  };

  const sendMessage = async () => {
    if (!chatMessage.trim() || isLoading || !currentUser) return;
    
    try {
      // Create user message
      const userMsg: ChatMessage = { 
        role: 'user', 
        text: chatMessage,
        timestamp: Date.now()
      };
      
      // Save to Firebase and update state
      await saveMessageToFirebase(userMsg);
      
      // Clear input
      setChatMessage('');
      
      // Get AI response
      const aiText = await getGeminiResponse(chatMessage);
      
      // Create AI message
      const aiMsg: ChatMessage = { 
        role: 'model', 
        text: aiText,
        timestamp: Date.now()
      };
      
      // Save to Firebase
      await saveMessageToFirebase(aiMsg);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg: ChatMessage = { 
        role: 'model', 
        text: "I encountered an error. Please try again later.",
        timestamp: Date.now()
      };
      await saveMessageToFirebase(errorMsg);
    }
  };

  const handleAcceptTask = (taskId: string) => {
    navigate(`/complete-task/${taskId}`);
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const recentTasks = tasks.slice(0, 5);

  const PriorityBadge = ({ priority }: { priority: 'low' | 'medium' | 'high' }) => {
    const priorityColors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">TaskFlow AI</h1>
                <p className="text-gray-300 text-sm">Welcome back, {currentUser.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/taskmanager">
                <Button className="backdrop-blur-md bg-gradient-to-r from-purple-600 to-indigo-800/90 text-white font-medium px-5 py-2 rounded-xl border border-white/10 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 ease-in-out">
                 <Plus className="h-4 w-4 mr-2" />
                   Add Task
                </Button>
              </Link>
              <Button onClick={logout} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Task Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass-effect border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">Total Tasks</p>
                      <p className="text-3xl font-bold text-white">{totalTasks}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">Completed</p>
                      <p className="text-3xl font-bold text-green-400">{completedTasks}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">Progress</p>
                      <p className="text-3xl font-bold text-purple-400">
                        {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                      </p>
                    </div>
                    <Brain className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tasks */}
            <Card className="glass-effect border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <List className="h-5 w-5 mr-2" />
                    Recent Tasks
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-4">No tasks yet. Create some tasks to get started!</p>
                    </div>
                  ) : (
                    recentTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${
                          task.completed ? 'opacity-75' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              {task.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              )}
                              <span className={`text-white font-medium break-words ${task.completed ? 'line-through' : ''}`}>
                                {task.title}
                              </span>
                            </div>
                            
                            {task.description && (
                              <p className="text-gray-300 text-sm mt-2 ml-7 break-words">
                                {task.description.length > 100 ? `${task.description.substring(0, 100)}...` : task.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-3 mt-2 ml-7 text-xs text-gray-400">
                              {task.dueDate && (
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              
                              {task.assignee && (
                                <div className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  <span className="truncate max-w-[120px]">Assignee: {task.assignee}</span>
                                </div>
                              )}
                              
                              <PriorityBadge priority={task.priority || 'medium'} />
                            </div>
                          </div>
                          
                          {!task.completed && (
                            <Button 
                              onClick={() => handleAcceptTask(task.id)}
                              className="text-sm px-4 py-1.5 rounded-md bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md transition"
                            >
                              Accept Task
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Chat - Fixed Section */}
          <div className="space-y-6">
            <Card className="glass-effect border-0 h-[600px] flex flex-col">
              <CardHeader className="pb-4 flex-shrink-0">
                <CardTitle className="text-white flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  AI Assistant (Gemini)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-6 pt-0 min-h-0">
                <div 
                  ref={chatMessagesRef}
                  className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2"
                  style={{ 
                    scrollBehavior: 'smooth',
                    maxHeight: '100%',
                    minHeight: '0'
                  }}
                >
                  {chatHistory.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 flex flex-col items-center justify-center h-full">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                      <p className="text-gray-300">Start a conversation with your AI assistant!</p>
                      <p className="text-sm mt-2 text-gray-400">Ask about your tasks, schedule, or get productivity tips.</p>
                      <p className="text-xs mt-4 text-gray-500">Powered by Google Gemini</p>
                    </div>
                  ) : (
                    chatHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg max-w-[85%] break-words ${
                          msg.role === 'user'
                            ? 'bg-blue-600/90 ml-auto text-white'
                            : 'bg-slate-700/80 mr-auto text-gray-100 border border-white/10'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="p-3 rounded-lg bg-slate-700/80 border border-white/10 mr-auto max-w-[85%] flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                      <span className="text-gray-300 text-sm">AI is thinking...</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 mt-auto flex-shrink-0">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Ask your AI assistant..."
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={sendMessage} 
                    className="bg-purple-600 hover:bg-purple-700 flex-shrink-0 border-0"
                    disabled={isLoading || !chatMessage.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;