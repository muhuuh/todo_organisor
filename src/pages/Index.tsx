import { useState, useEffect } from "react";
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
  } = useTaskContext();

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    // Set drag data with task ID for when dropping
    e.dataTransfer.setData("taskId", task.id);
    setDraggedTask(task);
  };

  // Handle drop
  const handleDrop = async (
    e: React.DragEvent,
    targetBucket: TaskBucketType
  ) => {
    const taskId = e.dataTransfer.getData("taskId");

    if (!taskId) return;

    // Get the current bucket of the task
    const task = tasks.find((t) => t.id === taskId);

    if (!task) return;

    // If the bucket hasn't changed, don't do anything
    if (task.bucket === targetBucket) return;

    // Move task to the new bucket
    try {
      await moveToBucket(taskId, targetBucket);
      toast.success(`Task moved to ${targetBucket}`);
    } catch (err) {
      console.error("Error moving task:", err);
      toast.error("Failed to move task");
    }
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
              onDrop={handleDrop}
              onDelete={deleteTask}
              onArchive={archiveTask}
              onUpdateTimeEstimate={updateTimeEstimate}
              onToggleCompletion={toggleTaskCompletion}
              onUpdateImportance={updateTaskImportance}
            />
            <TaskBucket
              title="Mid-Term Tasks"
              type="Mid-Term"
              tasks={tasks}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDelete={deleteTask}
              onArchive={archiveTask}
              onUpdateTimeEstimate={updateTimeEstimate}
              onToggleCompletion={toggleTaskCompletion}
              onUpdateImportance={updateTaskImportance}
            />
            <TaskBucket
              title="Long-Term Tasks"
              type="Long-Term"
              tasks={tasks}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDelete={deleteTask}
              onArchive={archiveTask}
              onUpdateTimeEstimate={updateTimeEstimate}
              onToggleCompletion={toggleTaskCompletion}
              onUpdateImportance={updateTaskImportance}
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
              onDrop={handleDrop}
              onDelete={deleteTask}
              onArchive={archiveTask}
              onUpdateTimeEstimate={updateTimeEstimate}
              onToggleCompletion={toggleTaskCompletion}
              onUpdateImportance={updateTaskImportance}
              allowTimeEstimate
            />
            <TaskBucket
              title="Tomorrow"
              type="Tomorrow"
              tasks={tasks}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDelete={deleteTask}
              onArchive={archiveTask}
              onUpdateTimeEstimate={updateTimeEstimate}
              onToggleCompletion={toggleTaskCompletion}
              onUpdateImportance={updateTaskImportance}
              allowTimeEstimate
            />
            <TaskBucket
              title="This Week"
              type="This Week"
              tasks={tasks}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDelete={deleteTask}
              onArchive={archiveTask}
              onUpdateTimeEstimate={updateTimeEstimate}
              onToggleCompletion={toggleTaskCompletion}
              onUpdateImportance={updateTaskImportance}
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
