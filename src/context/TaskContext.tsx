import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase, handleSupabaseError } from "@/lib/supabase";
import { Task, TaskFormInput, TaskBucketType, ImportanceLevel } from "@/types";
import { toast } from "sonner";

interface TaskContextType {
  tasks: Task[];
  completedTasks: Task[];
  isLoading: boolean;
  isLoadingCompleted: boolean;
  addTask: (task: TaskFormInput) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  unarchiveTask: (id: string) => Promise<void>;
  moveToBucket: (taskId: string, bucket: TaskBucketType) => Promise<void>;
  updateTimeEstimate: (taskId: string, estimate: number) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  updateTaskImportance: (
    taskId: string,
    importance: ImportanceLevel
  ) => Promise<void>;
  updateSubTask: (taskId: string, newSubTask: string) => Promise<void>;
  reorderTasks: (
    updates: { id: string; bucket: TaskBucketType; sort_order: number }[]
  ) => Promise<void>;
  fetchCompletedTasks: () => Promise<void>;
  userId: string | null;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const normalizeBucket = (bucket: string): TaskBucketType => {
    if (
      bucket === "Short-Term" ||
      bucket === "Mid-Term" ||
      bucket === "Long-Term" ||
      bucket === "This Week"
    ) {
      return "On Hold";
    }
    if (bucket !== "On Hold" && bucket !== "Today" && bucket !== "Tomorrow") {
      return "On Hold";
    }
    return bucket as TaskBucketType;
  };

  // Check for authentication and fetch tasks on component mount
  useEffect(() => {
    const checkAuthAndFetchTasks = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setUserId(data.session.user.id);
        fetchTasks(data.session.user.id);
        // Also fetch completed tasks on initial load
        fetchCompletedTasks(data.session.user.id);
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
        // Also fetch completed tasks when auth changes
        fetchCompletedTasks(newUserId);
      } else {
        setTasks([]);
        setCompletedTasks([]);
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
        .from("tasks")
        .select("*")
        .eq("user_id", currentUserId)
        .eq("is_archived", false) // Only fetch non-archived tasks
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (handleSupabaseError(error)) return;

      // Double-check to ensure no archived tasks appear in the main view
      const filteredData = data ? data.filter((task) => !task.is_archived) : [];
      const normalizedData = filteredData.map((task) => ({
        ...task,
        bucket: normalizeBucket(task.bucket),
      }));
      setTasks(normalizedData);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch completed tasks from Supabase
  const fetchCompletedTasks = async (currentUserIdParam?: string) => {
    const userIdToUse = currentUserIdParam || userId;
    if (!userIdToUse) {
      toast.error("You must be signed in to view completed tasks");
      return;
    }

    setIsLoadingCompleted(true);
    try {
      // Make sure to explicitly get tasks that are both archived and completed
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userIdToUse)
        .eq("is_archived", true)
        .eq("completed", true)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching completed tasks:", error);
        toast.error(error.message || "Failed to load completed tasks");
        return;
      }

      console.log(`Fetched ${data?.length || 0} completed tasks`);

      // Ensure we only set completed tasks when we have valid data
      if (data) {
        setCompletedTasks(
          data.map((task) => ({
            ...task,
            bucket: normalizeBucket(task.bucket),
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching completed tasks:", err);
      toast.error("Failed to load completed tasks");
      throw err; // Rethrow so we can catch it in the CompletedTasksPage
    } finally {
      setIsLoadingCompleted(false);
    }
  };

  // Add a new task
  const addTask = async (taskInput: TaskFormInput) => {
    if (!userId) {
      toast.error("You must be signed in to add tasks");
      return;
    }

    try {
      const bucketTasks = tasks.filter(
        (task) => task.bucket === taskInput.bucket
      );
      const maxSortOrder = bucketTasks.reduce(
        (max, task) => Math.max(max, task.sort_order ?? 0),
        0
      );

      const newTask: Omit<Task, "id" | "created_at" | "updated_at"> = {
        ...taskInput,
        user_id: userId,
        is_archived: false,
        completed: false,
        sort_order: maxSortOrder + 1,
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert([newTask])
        .select();

      if (handleSupabaseError(error)) return;

      setTasks((prevTasks) => [...prevTasks, ...(data || [])]);
      toast.success("Task added successfully");
    } catch (err) {
      console.error("Error adding task:", err);
      toast.error("Failed to add task");
    }
  };

  // Update an existing task
  const updateTask = async (task: Task) => {
    if (!userId) {
      toast.error("You must be signed in to update tasks");
      return;
    }

    try {
      // Ensure we're only updating the current user's tasks
      if (task.user_id !== userId) {
        toast.error("You can only update your own tasks");
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .update(task)
        .eq("id", task.id)
        .eq("user_id", userId);

      if (handleSupabaseError(error)) return;

      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === task.id ? task : t))
      );
    } catch (err) {
      console.error("Error updating task:", err);
      toast.error("Failed to update task");
    }
  };

  // Delete a task
  const deleteTask = async (id: string) => {
    if (!userId) {
      toast.error("You must be signed in to delete tasks");
      return;
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (handleSupabaseError(error)) return;

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
      setCompletedTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== id)
      );
      toast.success("Task deleted");
    } catch (err) {
      console.error("Error deleting task:", err);
      toast.error("Failed to delete task");
    }
  };

  // Archive a task (mark as completed)
  const archiveTask = async (id: string) => {
    if (!userId) {
      toast.error("You must be signed in to mark tasks as complete");
      return;
    }

    try {
      const task = tasks.find((t) => t.id === id);
      if (!task) {
        console.error("Task not found for archiving:", id);
        return;
      }

      console.log("Archiving task:", id);

      // First update the database
      const { error } = await supabase
        .from("tasks")
        .update({
          is_archived: true,
          completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Error archiving task:", error);
        toast.error(error.message || "Failed to archive task");
        return;
      }

      // Create the completed task object with updated fields
      const completedTask = {
        ...task,
        is_archived: true,
        completed: true,
        updated_at: new Date().toISOString(),
      };

      // Remove from active tasks list
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== id));

      // Add to completed tasks list
      setCompletedTasks((prev) => [completedTask, ...prev]);

      toast.success("Task marked as completed");

      // Refresh both task lists to ensure consistency
      if (userId) {
        fetchTasks(userId);
      }
    } catch (err) {
      console.error("Error marking task as completed:", err);
      toast.error("Failed to mark task as completed");
    }
  };

  // Unarchive a task (mark as incomplete and restore to active tasks)
  const unarchiveTask = async (id: string) => {
    if (!userId) {
      toast.error("You must be signed in to restore tasks");
      return;
    }

    try {
      const task = completedTasks.find((t) => t.id === id);
      if (!task) {
        console.error("Task not found for unarchiving:", id);
        return;
      }

      console.log("Unarchiving task:", id);

      // Update the database
      const { error } = await supabase
        .from("tasks")
        .update({
          is_archived: false,
          completed: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Error unarchiving task:", error);
        toast.error(error.message || "Failed to restore task");
        return;
      }

      // Create the restored task object with updated fields
      const restoredTask = {
        ...task,
        is_archived: false,
        completed: false,
        updated_at: new Date().toISOString(),
      };

      // Remove from completed tasks list
      setCompletedTasks((prevTasks) => prevTasks.filter((t) => t.id !== id));

      // Add to active tasks list
      setTasks((prev) => [restoredTask, ...prev]);

      toast.success("Task restored to active tasks");

      // Refresh both task lists to ensure consistency
      if (userId) {
        fetchTasks(userId);
        fetchCompletedTasks(userId);
      }
    } catch (err) {
      console.error("Error restoring task:", err);
      toast.error("Failed to restore task");
    }
  };

  // Move task to a different bucket
  const moveToBucket = async (taskId: string, bucket: TaskBucketType) => {
    if (!userId) {
      toast.error("You must be signed in to move tasks");
      return;
    }

    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const targetBucketTasks = tasks.filter(
        (t) => t.bucket === bucket && t.id !== taskId
      );
      const maxSortOrder = targetBucketTasks.reduce(
        (max, t) => Math.max(max, t.sort_order ?? 0),
        0
      );
      const nextSortOrder = maxSortOrder + 1;

      // Ensure we're only updating the current user's tasks
      if (task.user_id !== userId) {
        toast.error("You can only move your own tasks");
        return;
      }

      const updatedTask = { ...task, bucket, sort_order: nextSortOrder };

      const { error } = await supabase
        .from("tasks")
        .update({ bucket, sort_order: nextSortOrder })
        .eq("id", taskId)
        .eq("user_id", userId);

      if (handleSupabaseError(error)) return;

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? { ...t, bucket, sort_order: nextSortOrder }
            : t
        )
      );
    } catch (err) {
      console.error("Error moving task:", err);
      toast.error("Failed to move task");
    }
  };

  // Update time estimate for a task
  const updateTimeEstimate = async (taskId: string, estimate: number) => {
    if (!userId) {
      toast.error("You must be signed in to update time estimates");
      return;
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ time_estimate: estimate })
        .eq("id", taskId)
        .eq("user_id", userId);

      if (handleSupabaseError(error)) return;

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, time_estimate: estimate } : t
        )
      );
    } catch (err) {
      console.error("Error updating time estimate:", err);
      toast.error("Failed to update time estimate");
    }
  };

  // Toggle task completion status
  const toggleTaskCompletion = async (taskId: string) => {
    if (!userId) {
      toast.error("You must be signed in to update tasks");
      return;
    }

    try {
      // Find the task to toggle its completion status
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Ensure we're only updating the current user's tasks
      if (task.user_id !== userId) {
        toast.error("You can only update your own tasks");
        return;
      }

      const newCompletedStatus = !task.completed;

      // If the task is being marked as completed, archive it immediately
      if (newCompletedStatus) {
        archiveTask(taskId);
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .update({ completed: newCompletedStatus })
        .eq("id", taskId)
        .eq("user_id", userId);

      if (handleSupabaseError(error)) return;

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, completed: newCompletedStatus } : t
        )
      );

      toast.success("Task marked as incomplete");
    } catch (err) {
      console.error("Error toggling task completion:", err);
      toast.error("Failed to update task");
    }
  };

  // Update task importance
  const updateTaskImportance = async (
    taskId: string,
    importance: ImportanceLevel
  ) => {
    if (!userId) {
      toast.error("You must be signed in to update task importance");
      return;
    }

    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        console.error("Task not found for importance update:", taskId);
        return;
      }

      // First update the UI optimistically
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, importance: importance } : t
        )
      );

      // Then update the database
      const { error } = await supabase
        .from("tasks")
        .update({ importance: importance })
        .eq("id", taskId)
        .eq("user_id", userId);

      if (handleSupabaseError(error)) {
        // Rollback UI changes on error
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === taskId ? { ...t, importance: task.importance } : t
          )
        );
        return;
      }
    } catch (err) {
      console.error("Error updating task importance:", err);
      toast.error("Failed to update task importance");
    }
  };

  // Update the subtask (title) of a task
  const updateSubTask = async (taskId: string, newSubTask: string) => {
    if (!userId) {
      toast.error("You must be signed in to update task title");
      return;
    }

    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        console.error("Task not found for title update:", taskId);
        return;
      }

      // First update the UI optimistically
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, sub_task: newSubTask } : t
        )
      );

      // Then update the database
      const { error } = await supabase
        .from("tasks")
        .update({ sub_task: newSubTask })
        .eq("id", taskId)
        .eq("user_id", userId);

      if (handleSupabaseError(error)) {
        // Rollback UI changes on error
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === taskId ? { ...t, sub_task: task.sub_task } : t
          )
        );
        return;
      }
    } catch (err) {
      console.error("Error updating task title:", err);
      toast.error("Failed to update task title");
    }
  };

  const reorderTasks = async (
    updates: { id: string; bucket: TaskBucketType; sort_order: number }[]
  ) => {
    if (!userId) {
      toast.error("You must be signed in to reorder tasks");
      return;
    }

    if (updates.length === 0) return;

    const updatesMap = new Map(
      updates.map((update) => [update.id, update])
    );

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        const update = updatesMap.get(task.id);
        return update ? { ...task, ...update } : task;
      })
    );

    const payload = updates.map((update) => ({
      ...update,
      user_id: userId,
    }));

    const { error } = await supabase
      .from("tasks")
      .upsert(payload, { onConflict: "id" });

    if (handleSupabaseError(error)) {
      fetchTasks(userId);
    }
  };

  const value = {
    tasks,
    completedTasks,
    isLoading,
    isLoadingCompleted,
    addTask,
    updateTask,
    deleteTask,
    archiveTask,
    unarchiveTask,
    moveToBucket,
    updateTimeEstimate,
    toggleTaskCompletion,
    updateTaskImportance,
    updateSubTask,
    reorderTasks,
    fetchCompletedTasks,
    userId,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
};
