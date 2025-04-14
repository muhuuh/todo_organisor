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
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";

// Helper function to format dates
const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

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

  // Calculate dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTitle = `${formatDate(today)}`;
  const tomorrowTitle = `${formatDate(tomorrow)}`;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 5,
      },
    })
  );

  async function handleDndDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const taskId = active.id as string;
      const targetBucket = over.id as TaskBucketType;
      const taskToMove = tasks.find((t) => t.id === taskId);

      if (taskToMove && taskToMove.bucket !== targetBucket) {
        console.log(`Moving task ${taskId} to bucket ${targetBucket}`);
        try {
          await moveToBucket(taskId, targetBucket);
          toast.success(`Task moved to ${targetBucket}`);
        } catch (err) {
          console.error("Error moving task:", err);
          toast.error("Failed to move task");
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-2 py-8 max-w-7xl">
          <div className="mb-8">
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDndDragEnd}
      >
        <div className="container mx-auto px-2 py-8 max-w-7xl">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-1">
              Task Organizer
            </h1>
            <p className="text-center text-muted-foreground">
              Organize tasks by projects and track your time efficiently
            </p>
          </header>

          <CreateTaskForm onSubmit={addTask} />

          <TaskExplorer
            tasks={tasks}
            onDelete={deleteTask}
            onToggleCompletion={toggleTaskCompletion}
          />

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">Task Category Buckets</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <TaskBucket
                title="Short-Term Tasks"
                type="Short-Term"
                tasks={tasks}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TaskBucket
                title={todayTitle}
                type="Today"
                tasks={tasks}
                onDelete={deleteTask}
                onArchive={archiveTask}
                onUpdateTimeEstimate={updateTimeEstimate}
                onToggleCompletion={toggleTaskCompletion}
                onUpdateImportance={updateTaskImportance}
                onUpdateSubTask={updateSubTask}
                allowTimeEstimate
              />
              <TaskBucket
                title={tomorrowTitle}
                type="Tomorrow"
                tasks={tasks}
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
      </DndContext>
    </div>
  );
};

export default Index;
