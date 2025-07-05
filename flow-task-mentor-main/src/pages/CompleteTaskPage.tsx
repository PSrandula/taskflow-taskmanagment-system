import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, File, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, update } from 'firebase/database';

const CompleteTaskPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [completionNotes, setCompletionNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser || !taskId) return;
    
    setIsSubmitting(true);
    
    try {
      // Update task as completed
      const taskRef = ref(database, `tasks/${currentUser.uid}/${taskId}`);
      
      await update(taskRef, {
        completed: true,
        completedAt: Date.now(),
        completionNotes,
      });

      navigate('/dashboard', { state: { message: 'Task completed successfully!' } });
    } catch (error) {
      console.error("Error completing task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-8">
        <Button 
          onClick={() => navigate('/dashboard')} 
          variant="ghost" 
          className="text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <Card className="glass-effect border-0 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-400" />
              Complete Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2">Completion Notes</label>
                <Textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Describe how you completed the task..."
                  className="bg-white/10 border-white/20 text-white"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Upload Proof (PDF)</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-gray-600 bg-white/5 hover:bg-white/10">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <File className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">
                      {file ? file.name : 'Click to upload PDF'}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  {isSubmitting ? 'Completing...' : 'Mark as Completed'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompleteTaskPage;