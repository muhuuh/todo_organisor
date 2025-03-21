
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { Task, TaskFormInput, TaskBucketType } from '@/types';
import { toast } from 'sonner';

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  addTask: (task: TaskFormInput) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  moveToBucket: (taskId: string, bucket: TaskBucketType) => Promise<void>;
  updateTimeEstimate: (taskId: string, estimate: number) => Promise<void>;
  userId: string | null;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Check for authentication and fetch tasks on component mount
  useEffect(() => {
    const checkAuthAndFetchTasks = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        setUserId(data.session.user.id);
        fetchTasks(data.session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchTasks();

    // Set up listener for auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user.id || null;
      setUserId(newUserId);
      
      if (newUserId) {
        fetchTasks(newUserId);
      } else {
        setTasks([]);
        setIsLoading(false);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Fetch all active tasks from Supabase for the current user
  const fetchTasks = async (currentUserId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (handleSupabaseError(error)) return;

      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new task
  const addTask = async (taskInput: TaskFormInput) => {
    if (!userId) {
      toast.error('You must be signed in to add tasks');
      return;
    }

    try {
      const newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
        ...taskInput,
        user_id: userId,
        is_archived: false,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select();

      if (handleSupabaseError(error)) return;

      setTasks((prevTasks) => [...prevTasks, ...(data || [])]);
      toast.success('Task added successfully');
    } catch (err) {
      console.error('Error adding task:', err);
      toast.error('Failed to add task');
    }
  };

  // Update an existing task
  const updateTask = async (task: Task) => {
    if (!userId) {
      toast.error('You must be signed in to update tasks');
      return;
    }

    try {
      // Ensure we're only updating the current user's tasks
      if (task.user_id !== userId) {
        toast.error('You can only update your own tasks');
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .update(task)
        .eq('id', task.id)
        .eq('user_id', userId);

      if (handleSupabaseError(error)) return;

      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === task.id ? task : t))
      );
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task');
    }
  };

  // Delete a task
  const deleteTask = async (id: string) => {
    if (!userId) {
      toast.error('You must be signed in to delete tasks');
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (handleSupabaseError(error)) return;

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
      toast.success('Task deleted');
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Failed to delete task');
    }
  };

  // Archive a task
  const archiveTask = async (id: string) => {
    if (!userId) {
      toast.error('You must be signed in to archive tasks');
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_archived: true })
        .eq('id', id)
        .eq('user_id', userId);

      if (handleSupabaseError(error)) return;

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
      toast.success('Task archived');
    } catch (err) {
      console.error('Error archiving task:', err);
      toast.error('Failed to archive task');
    }
  };

  // Move task to a different bucket
  const moveToBucket = async (taskId: string, bucket: TaskBucketType) => {
    if (!userId) {
      toast.error('You must be signed in to move tasks');
      return;
    }

    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Ensure we're only updating the current user's tasks
      if (task.user_id !== userId) {
        toast.error('You can only move your own tasks');
        return;
      }

      const updatedTask = { ...task, bucket };
      
      const { error } = await supabase
        .from('tasks')
        .update({ bucket })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (handleSupabaseError(error)) return;

      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? { ...t, bucket } : t))
      );
    } catch (err) {
      console.error('Error moving task:', err);
      toast.error('Failed to move task');
    }
  };

  // Update time estimate for a task
  const updateTimeEstimate = async (taskId: string, estimate: number) => {
    if (!userId) {
      toast.error('You must be signed in to update time estimates');
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ time_estimate: estimate })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (handleSupabaseError(error)) return;

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, time_estimate: estimate } : t
        )
      );
    } catch (err) {
      console.error('Error updating time estimate:', err);
      toast.error('Failed to update time estimate');
    }
  };

  const value = {
    tasks,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    archiveTask,
    moveToBucket,
    updateTimeEstimate,
    userId,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
