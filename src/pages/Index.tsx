import { useState, useEffect, useCallback } from "react";
import { useTaskContext } from "@/context/TaskContext";
import { Task, TaskBucketType } from "@/types";
import TaskBucket from "@/components/buckets/TaskBucket";
import CreateTaskForm from "@/components/forms/CreateTaskForm";
import TimeVisualization from "@/components/charts/TimeVisualization";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import TaskExplorer from "@/components/explorer/TaskExplorer";

const Index = () => {
  const {
    tasks,
    isLoading,
    addTask,
    deleteTask,
    archiveTask,
    moveToBucket,
    updateTimeEstimate,
    toggleTaskCompletion,
    updateTaskImportance,
    updateSubTask,
  } = useTaskContext();

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false); // Track dragging state for autoscroll

  // Autoscroll logic for drag operations near window edges
  const autoscrollOnDrag = useCallback((e: DragEvent) => {
    const threshold = 60; // Pixels from edge to trigger scroll
    const scrollSpeed = 15; // Pixels to scroll per frame
    const clientY = e.clientY;
    const windowHeight = window.innerHeight;

    if (clientY < threshold) {
      window.scrollBy(0, -scrollSpeed); // Scroll up
    } else if (clientY > windowHeight - threshold) {
      window.scrollBy(0, scrollSpeed); // Scroll down
    }
  }, []);

  // Effect to add/remove autoscroll listener based on dragging state
  useEffect(() => {
    if (!isDragging) {
      document.removeEventListener("dragover", autoscrollOnDrag);
      return;
    }

    document.addEventListener("dragover", autoscrollOnDrag);

    return () => {
      document.removeEventListener("dragover", autoscrollOnDrag);
    };
  }, [isDragging, autoscrollOnDrag]);

  // Handle drag start: set task data and flag dragging as true
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("taskId", task.id);
    // Use a minimal drag image
    const dragImage = new Image();
    dragImage.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    e.dataTransfer.effectAllowed = "move";

    setDraggedTask(task);
    // Set isDragging *after* setting data transfer seems more reliable
    setIsDragging(true);
  };

  // Handle drag end: always reset dragging state
  const handleDragEnd = (e: React.DragEvent) => {
    // Reset state and clean up any lingering styles
    setIsDragging(false);
    setDraggedTask(null);
    document
      .querySelectorAll(".task-dragging")
      .forEach((el) => el.classList.remove("task-dragging"));
    document
      .querySelectorAll(".bg-accent/30")
      .forEach((el) => el.classList.remove("bg-accent/30", "border-dashed"));
  };

  // Handle drop: move task if valid
  const handleDrop = async (
    e: React.DragEvent,
    targetBucket: TaskBucketType
  ) => {
    e.preventDefault(); // Prevent default browser drop behavior
    const taskId = e.dataTransfer.getData("taskId");

    // Reset dropzone visual style immediately
    const dropzone = e.currentTarget;
    dropzone.classList.remove("bg-accent/30", "border-dashed");

    if (!taskId) return; // Exit if no task ID

    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove) return; // Exit if task not found
    if (taskToMove.bucket === targetBucket) return; // Exit if bucket hasn't changed

    try {
      await moveToBucket(taskId, targetBucket);
      toast.success(`Task moved to ${targetBucket}`);
    } catch (err) {
      console.error("Error moving task:", err);
      toast.error("Failed to move task");
    }
    // No finally block needed here, handleDragEnd takes care of cleanup
  };

  // Render loading skeleton while data is loading
  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-1">
            Task Organizer
          </h1>
          <p className="text-center text-muted-foreground">
            Organize tasks by projects and track your time efficiently
          </p>
        </header>

        <CreateTaskForm onSubmit={addTask} />

        {/* Task Explorer Section */}
        <TaskExplorer
          tasks={tasks}
          onDelete={deleteTask}
          onToggleCompletion={toggleTaskCompletion}
        />

        <section className="mb-8">
          <h2 className="text-xl font-medium mb-4">Task Category Buckets</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TaskBucket
              title="Short-Term Tasks"
              type="Short-Term"
              tasks={tasks}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onDelete={deleteTask}
              onArchive={archiveTask}
              onUpdateTimeEstimate={updateTimeEstimate}
              onToggleCompletion={toggleTaskCompletion}
              onUpdateImportance={updateTaskImportance}
              onUpdateSubTask={updateSubTask}
            />
            <TaskBucket
              title="Mid-Term Tasks"
              type="Mid-Term"
              tasks={tasks}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onDelete={deleteTask}
              onArchive={archiveTask}
              onUpdateTimeEstimate={updateTimeEstimate}
              onToggleCompletion={toggleTaskCompletion}
              onUpdateImportance={updateTaskImportance}
              onUpdateSubTask={updateSubTask}
            />
            <TaskBucket
              title="Long-Term Tasks"
              type="Long-Term"
              tasks={tasks}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onDelete={deleteTask}
              onArchive={archiveTask}
              onUpdateTimeEstimate={updateTimeEstimate}
              onToggleCompletion={toggleTaskCompletion}
              onUpdateImportance={updateTaskImportance}
              onUpdateSubTask={updateSubTask}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-medium mb-4">Planning Timeframes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TaskBucket
              title="Today"
              type="Today"
              tasks={tasks}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onDelete={deleteTask}
              onArchive={archiveTask}
              onUpdateTimeEstimate={updateTimeEstimate}
              onToggleCompletion={toggleTaskCompletion}
              onUpdateImportance={updateTaskImportance}
              onUpdateSubTask={updateSubTask}
              allowTimeEstimate
            />
            <TaskBucket
              title="Tomorrow"
              type="Tomorrow"
              tasks={tasks}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onDelete={deleteTask}
              onArchive={archiveTask}
              onUpdateTimeEstimate={updateTimeEstimate}
              onToggleCompletion={toggleTaskCompletion}
              onUpdateImportance={updateTaskImportance}
              onUpdateSubTask={updateSubTask}
              allowTimeEstimate
            />
            <TaskBucket
              title="This Week"
              type="This Week"
              tasks={tasks}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onDelete={deleteTask}
              onArchive={archiveTask}
              onUpdateTimeEstimate={updateTimeEstimate}
              onToggleCompletion={toggleTaskCompletion}
              onUpdateImportance={updateTaskImportance}
              onUpdateSubTask={updateSubTask}
              allowTimeEstimate
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium mb-4">Time Visualization</h2>
          <TimeVisualization tasks={tasks} />
        </section>
      </div>
    </div>
  );
};

export default Index;
