
import { Task, TaskBucketType } from '@/types';
import TaskCard from '@/components/task/TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TaskBucketProps {
  title: string;
  type: TaskBucketType;
  tasks: Task[];
  onDrop: (e: React.DragEvent, bucketType: TaskBucketType) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUpdateTimeEstimate: (id: string, estimate: number) => void;
  allowTimeEstimate?: boolean;
}

const TaskBucket = ({
  title,
  type,
  tasks,
  onDrop,
  onDragStart,
  onDelete,
  onArchive,
  onUpdateTimeEstimate,
  allowTimeEstimate = false,
}: TaskBucketProps) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const dropzone = e.currentTarget;
    dropzone.classList.add('bg-accent/50', 'border-dashed');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const dropzone = e.currentTarget;
    dropzone.classList.remove('bg-accent/50', 'border-dashed');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropzone = e.currentTarget;
    dropzone.classList.remove('bg-accent/50', 'border-dashed');
    onDrop(e, type);
  };

  // Filter tasks for this bucket
  const bucketTasks = tasks.filter(task => task.bucket === type);
  const totalTime = bucketTasks.reduce((sum, task) => sum + (task.time_estimate || 0), 0);

  return (
    <Card 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="transition-all duration-300 min-h-[16rem]"
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="outline" className="ml-2">
            {bucketTasks.length}
          </Badge>
        </div>
        {totalTime > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            Total: {totalTime} minutes
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {bucketTasks.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground italic">
            Drop tasks here
          </div>
        ) : (
          <>
            {bucketTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDragStart={onDragStart}
                onDelete={onDelete}
                onArchive={onArchive}
                onUpdateTimeEstimate={onUpdateTimeEstimate}
                allowTimeEstimate={allowTimeEstimate}
              />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskBucket;
