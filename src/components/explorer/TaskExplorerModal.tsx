import { Task, ImportanceLevel } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  Tag,
  Info,
  AlertCircle,
  AlertTriangle,
  X,
  Square,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TaskExplorerModalProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  title: string;
  onDelete: (id: string) => void;
}

// Helper function to get importance badge
const getImportanceBadge = (importance: ImportanceLevel) => {
  switch (importance) {
    case "High":
      return (
        <Badge
          variant="outline"
          className="inline-flex items-center h-5 text-xs px-1.5 py-0 rounded-full importance-badge-high"
        >
          <AlertTriangle className="h-3 w-3 mr-0.5" />
          High
        </Badge>
      );
    case "Medium":
      return (
        <Badge
          variant="outline"
          className="inline-flex items-center h-5 text-xs px-1.5 py-0 rounded-full importance-badge-medium"
        >
          <AlertCircle className="h-3 w-3 mr-0.5" />
          Medium
        </Badge>
      );
    case "Low":
      return (
        <Badge
          variant="outline"
          className="inline-flex items-center h-5 text-xs px-1.5 py-0 rounded-full importance-badge-low"
        >
          <Info className="h-3 w-3 mr-0.5" />
          Low
        </Badge>
      );
  }
};

// Helper to group tasks by bucket
const groupTasksByBucket = (tasks: Task[]) => {
  const grouped: Record<string, Task[]> = {};

  tasks.forEach((task) => {
    if (!grouped[task.bucket]) {
      grouped[task.bucket] = [];
    }
    grouped[task.bucket].push(task);
  });

  return grouped;
};

const TaskExplorerModal = ({
  open,
  onClose,
  tasks,
  title,
  onDelete,
}: TaskExplorerModalProps) => {
  const groupedTasks = groupTasksByBucket(tasks);
  const bucketOrder = [
    "Today",
    "Tomorrow",
    "This Week",
    "Short-Term",
    "Mid-Term",
    "Long-Term",
  ];

  // Sort buckets in a logical order
  const sortedBuckets = Object.keys(groupedTasks).sort(
    (a, b) => bucketOrder.indexOf(a) - bucketOrder.indexOf(b)
  );

  const handleDelete = (id: string) => {
    onDelete(id);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-xl font-medium tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription>
            Viewing {tasks.length} task{tasks.length !== 1 && "s"} across{" "}
            {sortedBuckets.length} bucket{sortedBuckets.length !== 1 && "s"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 pt-2">
          {sortedBuckets.map((bucket) => (
            <div key={bucket} className="space-y-4">
              {/* Bucket header with more prominent styling */}
              <div className="flex items-center mb-3">
                <Badge
                  variant="secondary"
                  className="bg-muted/90 hover:bg-muted text-foreground rounded-full px-3 py-0.5 text-sm font-medium"
                >
                  {bucket}
                  <span className="ml-2 text-muted-foreground">
                    {groupedTasks[bucket].length} task
                    {groupedTasks[bucket].length !== 1 && "s"}
                  </span>
                </Badge>
              </div>

              <div className="space-y-3 pl-1">
                {groupedTasks[bucket].map((task) => (
                  <div
                    key={task.id}
                    className="bg-background rounded-lg border shadow-sm hover:shadow-md transition-all p-4 relative"
                  >
                    {/* Delete button - positioned absolutely in top right */}
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="absolute right-3 top-3 text-muted-foreground/40 hover:text-destructive transition-colors hover:bg-muted/20 rounded-sm p-0.5"
                      aria-label="Delete task"
                      title="Delete task"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    <div className="grid grid-cols-[auto_1fr] gap-x-3">
                      {/* Status indicator - only show checkmark for completed tasks */}
                      <div className="flex-shrink-0 mt-0.5">
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-[18px] w-[18px] text-muted-foreground" />
                        )}
                      </div>

                      {/* Task content area */}
                      <div className="min-w-0 space-y-2 pr-4">
                        <div
                          className={
                            task.completed
                              ? "line-through text-muted-foreground"
                              : ""
                          }
                        >
                          <h3 className="text-base font-medium leading-tight">
                            {task.sub_task}
                          </h3>

                          {task.main_task && (
                            <p className="text-sm text-muted-foreground mt-0.5 leading-tight">
                              {task.main_task}
                            </p>
                          )}
                        </div>

                        {/* Badges in a cleaner horizontal row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Importance badge */}
                          <div className="flex-shrink-0">
                            {getImportanceBadge(task.importance)}
                          </div>

                          {/* Category badge */}
                          {task.category && (
                            <Badge
                              variant="outline"
                              className="inline-flex items-center h-5 text-xs px-2 py-0 rounded-full bg-indigo-50/80 text-indigo-600 border-indigo-100 flex-shrink-0"
                            >
                              <Tag className="h-2.5 w-2.5 mr-1" />
                              {task.category}
                            </Badge>
                          )}

                          {/* Time estimate badge */}
                          {task.time_estimate > 0 && (
                            <Badge
                              variant="outline"
                              className="inline-flex items-center h-5 text-xs px-2 py-0 rounded-full bg-blue-50/80 text-blue-600 border-blue-100 flex-shrink-0"
                            >
                              <Clock
                                className="h-2.5 w-2.5 mr-1"
                                style={{ color: "#6B7280" }}
                              />
                              {task.time_estimate} min
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-10 text-sm text-muted-foreground/60 italic bg-muted/10 rounded-lg border border-dashed border-muted/30">
              No tasks found matching your criteria
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskExplorerModal;
