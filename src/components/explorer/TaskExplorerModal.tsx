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
  XCircle,
  Tag,
  Layers,
  Info,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TaskExplorerModalProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  title: string;
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription>
            Viewing {tasks.length} task{tasks.length !== 1 && "s"} across{" "}
            {sortedBuckets.length} bucket{sortedBuckets.length !== 1 && "s"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {sortedBuckets.map((bucket) => (
            <div key={bucket} className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-primary/5 px-2.5">
                  {bucket}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {groupedTasks[bucket].length} task
                  {groupedTasks[bucket].length !== 1 && "s"}
                </span>
              </div>

              <div className="space-y-3">
                {groupedTasks[bucket].map((task) => (
                  <Card
                    key={task.id}
                    className={cn(
                      "task-card animate-scale-in rounded-md border hover:shadow-sm transition-all",
                      task.completed ? "opacity-70 bg-muted/30" : "",
                      `importance-${task.importance.toLowerCase()}`
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="grid grid-cols-[auto_1fr] gap-x-2.5">
                        {/* Status indicator - matching TaskCard style */}
                        <div className="flex-shrink-0 mt-0.5">
                          {task.completed ? (
                            <CheckCircle2 className="h-[18px] w-[18px] text-primary" />
                          ) : (
                            <XCircle className="h-[18px] w-[18px] text-muted-foreground" />
                          )}
                        </div>

                        {/* Task content area */}
                        <div className="min-w-0">
                          <div
                            className={
                              task.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            <h3 className="font-medium text-sm leading-tight">
                              {task.sub_task}
                            </h3>

                            {task.main_task && (
                              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                                {task.main_task}
                              </p>
                            )}
                          </div>

                          {/* Badges - using similar style to TaskCard */}
                          <div className="inline-flex items-center flex-wrap gap-1.5 mt-1.5 pb-0.5 max-w-full">
                            {/* Importance badge */}
                            <div className="flex-shrink-0">
                              {getImportanceBadge(task.importance)}
                            </div>

                            {/* Category badge */}
                            {task.category && (
                              <Badge
                                variant="outline"
                                className="inline-flex items-center h-5 text-xs px-1.5 py-0 rounded-full bg-indigo-50/80 text-indigo-600 border-indigo-100 flex-shrink-0"
                              >
                                <Tag className="h-2.5 w-2.5 mr-0.5" />
                                {task.category}
                              </Badge>
                            )}

                            {/* Time estimate badge */}
                            {task.time_estimate > 0 && (
                              <Badge
                                variant="outline"
                                className="inline-flex items-center h-5 text-xs px-1.5 py-0 rounded-full bg-blue-50/80 text-blue-600 border-blue-100 flex-shrink-0"
                              >
                                <Clock
                                  className="h-2.5 w-2.5 mr-0.5"
                                  style={{ color: "#6B7280" }}
                                />
                                <span>{task.time_estimate} min</span>
                              </Badge>
                            )}

                            {/* Bucket badge */}
                            <Badge
                              variant="outline"
                              className="inline-flex items-center h-5 text-xs px-1.5 py-0 rounded-full bg-green-50/50 text-green-600 border-green-100 flex-shrink-0"
                            >
                              <Layers className="h-2.5 w-2.5 mr-0.5" />
                              <span>{task.bucket}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {bucket !== sortedBuckets[sortedBuckets.length - 1] && (
                <Separator className="my-4 opacity-30" />
              )}
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
