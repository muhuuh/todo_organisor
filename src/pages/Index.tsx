
import { useState, useEffect } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { Task, TaskBucketType } from '@/types';
import TaskBucket from '@/components/buckets/TaskBucket';
import CreateTaskForm from '@/components/forms/CreateTaskForm';
import VisualSummary from '@/components/charts/VisualSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';

const Index = () => {
  const { 
    tasks, 
    isLoading, 
    addTask, 
    deleteTask, 
    archiveTask, 
    moveToBucket,
    updateTimeEstimate 
  } = useTaskContext();
  
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    // Set drag data with task ID for when dropping
    e.dataTransfer.setData('taskId', task.id);
    setDraggedTask(task);
  };
  
  // Handle drop
  const handleDrop = async (e: React.DragEvent, targetBucket: TaskBucketType) => {
    const taskId = e.dataTransfer.getData('taskId');
    
    if (!taskId) return;
    
    // Get the current bucket of the task
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // If the bucket hasn't changed, don't do anything
    if (task.bucket === targetBucket) return;
    
    // Move task to the new bucket
    try {
      await moveToBucket(taskId, targetBucket);
      toast.success(`Task moved to ${targetBucket}`);
    } catch (err) {
      console.error('Error moving task:', err);
      toast.error('Failed to move task');
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
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-1">Task Manager</h1>
          <p className="text-center text-muted-foreground">
            Organize your tasks and track your time
          </p>
        </header>
        
        <CreateTaskForm onSubmit={addTask} />
        
        <section className="mb-8">
          <h2 className="text-xl font-medium mb-4">Task Buckets</h2>
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
            />
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-medium mb-4">Timeframe Buckets</h2>
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
              allowTimeEstimate
            />
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-medium mb-4">Visual Summary</h2>
          <VisualSummary tasks={tasks} />
        </section>
      </div>
    </div>
  );
};

export default Index;
