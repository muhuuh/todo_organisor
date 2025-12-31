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
  const [supportsSortOrder, setSupportsSortOrder] = useState<boolean | null>(
    null
  );

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

  const serializeBucket = (bucket: TaskBucketType) => {
    if (bucket === "On Hold") {
      return "Short-Term";
    }
    return bucket;
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
      const buildQuery = () =>
        supabase
          .from("tasks")
          .select("*")
          .eq("user_id", currentUserId)
          .eq("is_archived", false);
      let { data, error } = await buildQuery().order("created_at", {
        ascending: false,
      });

      if (error) {
        console.error("Error fetching tasks with ordering:", error);
        const fallback = await buildQuery();
        if (fallback.error) {
          handleSupabaseError(fallback.error);
          return;
        }
        data = fallback.data;
      }

      // Double-check to ensure no archived tasks appear in the main view
      const filteredData = data ? data.filter((task) => !task.is_archived) : [];
      const normalizedData = filteredData.map((task) => ({
        ...task,
        bucket: normalizeBucket(task.bucket),
      }));
      setTasks(normalizedData);

      if (supportsSortOrder !== true) {
        const hasSortOrder = normalizedData.some(
          (task) => task.sort_order !== undefined
        );
        if (hasSortOrder) {
          setSupportsSortOrder(true);
        }
      }
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

      const newTask = {
        ...taskInput,
        bucket: serializeBucket(taskInput.bucket),
        user_id: userId,
        is_archived: false,
        completed: false,
      };

      if (supportsSortOrder) {
        newTask.sort_order = maxSortOrder + 1;
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert([newTask])
        .select();

      if (handleSupabaseError(error)) return;

      const normalizedInserted = (data || []).map((task) => ({
        ...task,
        bucket: normalizeBucket(task.bucket),
      }));
      setTasks((prevTasks) => [...prevTasks, ...normalizedInserted]);
      if (supportsSortOrder !== true) {
        const hasSortOrder = (data || []).some(
          (task) => task.sort_order !== undefined
        );
        if (hasSortOrder) {
          setSupportsSortOrder(true);
        }
      }
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

      const dbPayload = { ...task, bucket: serializeBucket(task.bucket) };
      const { error } = await supabase
        .from("tasks")
        .update(dbPayload)
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
      const completedAt = new Date().toISOString();
      const { error } = await supabase
        .from("tasks")
        .update({
          is_archived: true,
          completed: true,
          completed_at: completedAt,
          updated_at: completedAt,
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
        completed_at: completedAt,
        updated_at: completedAt,
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
      const restoredAt = new Date().toISOString();
      const { error } = await supabase
        .from("tasks")
        .update({
          is_archived: false,
          completed: false,
          completed_at: null,
          updated_at: restoredAt,
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
        completed_at: null,
        updated_at: restoredAt,
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

      let shouldFallbackToBucketOnly = supportsSortOrder !== true;
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

      const serializedBucket = serializeBucket(bucket);

      if (supportsSortOrder === true) {
        const { error } = await supabase
          .from("tasks")
          .update({ bucket: serializedBucket, sort_order: nextSortOrder })
          .eq("id", taskId)
          .eq("user_id", userId);

        if (error && String(error.message || "").includes("sort_order")) {
          setSupportsSortOrder(false);
          shouldFallbackToBucketOnly = true;
        } else if (handleSupabaseError(error)) {
          return;
        }
      }

      if (shouldFallbackToBucketOnly) {
        const { error } = await supabase
          .from("tasks")
          .update({ bucket: serializedBucket })
          .eq("id", taskId)
          .eq("user_id", userId);

        if (handleSupabaseError(error)) return;
      }

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

      const updatedAt = new Date().toISOString();
      const { error } = await supabase
        .from("tasks")
        .update({
          completed: newCompletedStatus,
          completed_at: newCompletedStatus ? updatedAt : null,
          updated_at: updatedAt,
        })
        .eq("id", taskId)
        .eq("user_id", userId);

      if (handleSupabaseError(error)) return;

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completed: newCompletedStatus,
                completed_at: newCompletedStatus ? updatedAt : null,
                updated_at: updatedAt,
              }
            : t
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

    const applyUpdates = async (includeSortOrder: boolean) => {
      const results = await Promise.all(
        updates.map((update) => {
          const payload = includeSortOrder
            ? {
                bucket: serializeBucket(update.bucket),
                sort_order: update.sort_order,
              }
            : { bucket: serializeBucket(update.bucket) };

          return supabase
            .from("tasks")
            .update(payload)
            .eq("id", update.id)
            .eq("user_id", userId);
        })
      );

      return results;
    };

    if (supportsSortOrder !== true) {
      const results = await applyUpdates(false);
      const firstError = results.find((result) => result.error)?.error;
      if (handleSupabaseError(firstError || null)) {
        fetchTasks(userId);
      }
      return;
    }

    const results = await applyUpdates(true);
    const sortOrderError = results.find(
      (result) =>
        result.error &&
        String(result.error.message || "").includes("sort_order")
    )?.error;

    if (sortOrderError) {
      setSupportsSortOrder(false);
      const fallback = await applyUpdates(false);
      const fallbackError = fallback.find((result) => result.error)?.error;
      if (handleSupabaseError(fallbackError || null)) {
        fetchTasks(userId);
      }
      return;
    }

    const firstError = results.find((result) => result.error)?.error;
    if (handleSupabaseError(firstError || null)) {
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
