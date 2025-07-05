import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, CheckCircle, Circle, Trash2, ChevronDown, 
  User, Calendar, Edit, X, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  completed: boolean;
  createdAt: number;
}

const TaskManagerPage = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignee: '',
  });
  
  useEffect(() => {
    if (currentUser) {
      const tasksRef = ref(database, `tasks/${currentUser.uid}`);
      const unsubscribe = onValue(tasksRef, (snapshot) => {
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

      return () => unsubscribe();
    }
  }, [currentUser]);

  // Update form when selecting a task to edit
  useEffect(() => {
    if (selectedTask) {
      setFormData({
        title: selectedTask.title,
        description: selectedTask.description,
        dueDate: selectedTask.dueDate,
        priority: selectedTask.priority,
        assignee: selectedTask.assignee,
      });
    } else {
      // Reset form when not editing
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        assignee: '',
      });
    }
  }, [selectedTask]);

  const saveTask = async () => {
    if (!currentUser || !formData.title.trim()) {
      console.error("Cannot save task: No user or empty title");
      return;
    }

    try {
      if (selectedTask?.id) {
        // Update existing task
        const taskRef = ref(database, `tasks/${currentUser.uid}/${selectedTask.id}`);
        await update(taskRef, {
          ...formData,
          completed: selectedTask.completed,
          createdAt: selectedTask.createdAt,
        });
        console.log("Task updated successfully");
      } else {
        // Create new task
        const tasksRef = ref(database, `tasks/${currentUser.uid}`);
        const newTaskRef = push(tasksRef);
        
        await update(newTaskRef, {
          ...formData,
          completed: false,
          createdAt: Date.now(),
        });
        console.log("Task created successfully");
      }
      
      // Reset selection and form
      setSelectedTask(null);
    } catch (error) {
      console.error("Error saving task:", error);
      alert(`Error saving task: ${error.message}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!currentUser) return;

    const taskRef = ref(database, `tasks/${currentUser.uid}/${taskId}`);
    await remove(taskRef);
    
    // If deleting the currently selected task, reset selection
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!currentUser) return;

    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const taskRef = ref(database, `tasks/${currentUser.uid}/${taskId}`);
      await update(taskRef, { completed: !task.completed });
    }
  };

  // Priority badge component
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

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Get priority color for UI elements
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Task Form */}
          <div>
            <Card className="glass-effect border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    {selectedTask ? "Edit Task" : "Create New Task"}
                  </CardTitle>
                  {selectedTask && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-400 hover:text-white"
                      onClick={() => setSelectedTask(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Task Title
                    </label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="What needs to be done?"
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Add details about the task"
                      rows={3}
                      className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Due Date
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <Input
                          type="date"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleInputChange}
                          className="bg-white/10 border-white/20 text-white pl-10 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Priority
                      </label>
                      <div className="relative">
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                          className={`w-full p-2 rounded bg-white/10 border border-white/20 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 ${getPriorityColor(formData.priority)}`}
                        >
                          <option value="low" className="text-green-500 bg-slate-800">Low</option>
                          <option value="medium" className="text-yellow-500 bg-slate-800">Medium</option>
                          <option value="high" className="text-red-500 bg-slate-800">High</option>
                        </select>
                        <div className="absolute left-3 top-3">
                          <div className={`h-2 w-2 rounded-full ${getPriorityColor(formData.priority)}`}></div>
                        </div>
                        <ChevronDown className="h-4 w-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Assignee
                    </label>
                    <div className="relative">
                      <User className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        name="assignee"
                        value={formData.assignee}
                        onChange={handleInputChange}
                        placeholder="Who should do this task?"
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400 pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-2">
                    {selectedTask && (
                      <Button 
                        variant="outline" 
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => setSelectedTask(null)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button 
                      onClick={saveTask}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!formData.title.trim()}
                    >
                      {selectedTask ? "Update Task" : "Create Task"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks List */}
          <div>
            <Card className="glass-effect border-0">
              <CardHeader>
                <CardTitle className="text-white">Added Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {tasks.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No tasks yet. Create your first task!</p>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${
                          task.completed ? 'opacity-75' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <button 
                            onClick={() => toggleTask(task.id)}
                            className="mt-1 flex-shrink-0"
                          >
                            {task.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400 hover:text-blue-400" />
                            )}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className={`text-white font-medium break-words ${task.completed ? 'line-through' : ''}`}>
                                  {task.title}
                                </h3>
                                {task.description && (
                                  <p className="text-gray-300 text-sm mt-2 break-words">
                                    {truncateText(task.description, 150)}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <PriorityBadge priority={task.priority} />
                                <div className="flex space-x-1">
                                  <Button
                                    onClick={() => setSelectedTask(task)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-1"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => deleteTask(task.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
                              {task.dueDate && (
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              
                              {task.assignee && (
                                <div className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  <span className="truncate max-w-[120px]">{task.assignee}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManagerPage;