import { Task, TaskBucketType, ImportanceLevel } from "@/types";
import TaskCard from "@/components/task/TaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";

interface TaskBucketProps {
  title: string;
  type: TaskBucketType;
  tasks: Task[];
  onDrop: (e: React.DragEvent, bucketType: TaskBucketType) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUpdateTimeEstimate: (id: string, estimate: number) => void;
  onToggleCompletion: (id: string) => void;
  onUpdateImportance: (id: string, importance: ImportanceLevel) => void;
  allowTimeEstimate?: boolean;
}

// Helper interface for grouped tasks
interface GroupedTasks {
  [key: string]: Task[];
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
  onToggleCompletion,
  onUpdateImportance,
  allowTimeEstimate = false,
}: TaskBucketProps) => {
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({});

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const dropzone = e.currentTarget;
    dropzone.classList.add("bg-accent/30", "border-dashed");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const dropzone = e.currentTarget;
    dropzone.classList.remove("bg-accent/30", "border-dashed");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropzone = e.currentTarget;
    dropzone.classList.remove("bg-accent/30", "border-dashed");
    onDrop(e, type);
  };

  // Filter tasks for this bucket
  const bucketTasks = tasks.filter((task) => task.bucket === type);

  // Calculate total time estimation for all tasks in this bucket
  const totalTime = bucketTasks.reduce(
    (sum, task) => sum + (task.time_estimate || 0),
    0
  );

  // Group tasks by main_task
  const groupedTasks: GroupedTasks = bucketTasks.reduce(
    (groups: GroupedTasks, task) => {
      // Use main_task if it exists, otherwise use a special identifier for ungrouped tasks
      const groupKey = task.main_task || "___ungrouped___";

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(task);
      return groups;
    },
    {}
  );

  // Toggle group open/closed state
  const toggleGroup = (groupKey: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Check if a specific group is open
  const isGroupOpen = (groupKey: string): boolean => {
    return !!openGroups[groupKey];
  };

  return (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="task-bucket transition-all duration-300 min-h-[16rem]"
    >
      <CardHeader className="pb-1.5 pt-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <Badge variant="outline" className="ml-2 bg-primary/5 px-2.5">
            {bucketTasks.length}
          </Badge>
        </div>
        {totalTime > 0 && (
          <div className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground/60" />
            Total: {totalTime} minutes
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {bucketTasks.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground/60 italic bg-muted/10 rounded-lg border border-dashed border-muted/30">
            Drop tasks here
          </div>
        ) : (
          <>
            {/* Ungrouped tasks (those without a main task) */}
            {groupedTasks["___ungrouped___"]?.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDragStart={onDragStart}
                onDelete={onDelete}
                onArchive={onArchive}
                onUpdateTimeEstimate={onUpdateTimeEstimate}
                onToggleCompletion={onToggleCompletion}
                onUpdateImportance={onUpdateImportance}
                allowTimeEstimate={true}
                inGroupView={false}
              />
            ))}

            {/* Grouped tasks by main task */}
            {Object.entries(groupedTasks)
              .filter(([key]) => key !== "___ungrouped___")
              .map(([mainTask, tasks]) => {
                const isOpen = isGroupOpen(mainTask);

                return (
                  <Collapsible
                    key={mainTask}
                    open={isOpen}
                    className="border rounded-xl p-2.5 mb-3 bg-card/90 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all"
                  >
                    <CollapsibleTrigger
                      className="flex items-center justify-between w-full text-left"
                      onClick={() => toggleGroup(mainTask)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm">{mainTask}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isOpen && (
                          <Badge
                            variant="secondary"
                            className="bg-secondary/50 text-xs"
                          >
                            {tasks.length}
                          </Badge>
                        )}
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {tasks.map((task, index) => (
                        <div
                          key={task.id}
                          className={`
                            rounded-lg 
                            ${
                              index % 2 === 0
                                ? "bg-accent/5"
                                : "bg-background/80"
                            } 
                            ${index > 0 ? "border-t border-accent/10" : ""}
                            first:border-t-0
                            p-0.5
                          `}
                        >
                          <TaskCard
                            task={task}
                            onDragStart={onDragStart}
                            onDelete={onDelete}
                            onArchive={onArchive}
                            onUpdateTimeEstimate={onUpdateTimeEstimate}
                            onToggleCompletion={onToggleCompletion}
                            onUpdateImportance={onUpdateImportance}
                            allowTimeEstimate={true}
                            inGroupView={true}
                            hideCategory={true}
                          />
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskBucket;
