
// Task importance levels
export type ImportanceLevel = 'Low' | 'Medium' | 'High';

// Bucket types
export type TaskBucketType = 'Short-Term' | 'Mid-Term' | 'Long-Term' | 'Today' | 'Tomorrow' | 'This Week';

// Task object structure
export interface Task {
  id: string;
  user_id: string;
  sub_task: string;
  main_task?: string;
  category: string;
  importance: ImportanceLevel;
  time_estimate?: number; // Optional, in minutes
  bucket: TaskBucketType;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// Form input for creating a new task
export interface TaskFormInput {
  sub_task: string;
  main_task?: string;
  category: string;
  importance: ImportanceLevel;
  bucket: TaskBucketType;
}

// Props for the TaskCard component
export interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUpdateTimeEstimate: (id: string, estimate: number) => void;
}

// Props for the TaskBucket component
export interface TaskBucketProps {
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

// Chart data for visual summary
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}
