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
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface TaskBucketProps {
  title: string;
  type: TaskBucketType;
  tasks: Task[];
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUpdateTimeEstimate: (id: string, estimate: number) => void;
  onToggleCompletion: (id: string) => void;
  onUpdateImportance: (id: string, importance: ImportanceLevel) => void;
  onUpdateSubTask: (id: string, newSubTask: string) => void;
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
  onDelete,
  onArchive,
  onUpdateTimeEstimate,
  onToggleCompletion,
  onUpdateImportance,
  onUpdateSubTask,
  allowTimeEstimate = false,
}: TaskBucketProps) => {
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({});

  // --- dnd-kit Droppable --- 
  const { setNodeRef, isOver } = useDroppable({
    id: type, // Unique ID for the drop zone (using the bucket type)
  });

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
      const groupKey = task.main_task || "___ungrouped___";
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
      return groups;
    },
    {}
  );

  const toggleGroup = (groupKey: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const isGroupOpen = (groupKey: string): boolean => !!openGroups[groupKey];

  return (
    <Card
      ref={setNodeRef} // Apply the ref from useDroppable
      className={cn(
        "task-bucket transition-all duration-150 min-h-[16rem] border w-full min-w-[320px] max-w-full",
        // Add visual indication when a draggable is hovering over:
        isOver ? "border-primary border-dashed bg-primary/5" : "border-transparent"
      )}
    >
      <CardHeader className="pb-1.5 pt-4 px-3 sm:px-4">
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
      <CardContent className="space-y-3 pt-2 px-3 sm:px-4">
        {bucketTasks.length === 0 ? (
          <div className={cn(
              "text-center py-10 text-sm text-muted-foreground/60 italic rounded-lg border border-dashed",
              isOver ? "border-primary/50 bg-primary/10" : "bg-muted/10 border-muted/30"
            )}>
            Drop tasks here
          </div>
        ) : (
          <>
            {/* Ungrouped tasks (those without a main task) */}
            {groupedTasks["___ungrouped___"]?.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={onDelete}
                onArchive={onArchive}
                onUpdateTimeEstimate={onUpdateTimeEstimate}
                onToggleCompletion={onToggleCompletion}
                onUpdateImportance={onUpdateImportance}
                onUpdateSubTask={onUpdateSubTask}
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
                    className="border rounded-xl p-2.5 mb-3 bg-card/90 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all group relative overflow-hidden"
                  >
                    {/* Hover gradient effect for the entire box */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-violet-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative z-10">
                      {" "}
                      {/* Wrapper to ensure content is above gradient */}
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
                              onDelete={onDelete}
                              onArchive={onArchive}
                              onUpdateTimeEstimate={onUpdateTimeEstimate}
                              onToggleCompletion={onToggleCompletion}
                              onUpdateImportance={onUpdateImportance}
                              onUpdateSubTask={onUpdateSubTask}
                              allowTimeEstimate={true}
                              inGroupView={true}
                              hideCategory={true}
                            />
                          </div>
                        ))}
                      </CollapsibleContent>
                    </div>
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
