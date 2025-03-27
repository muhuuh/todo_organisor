import { Task, TaskBucketType, ImportanceLevel } from "@/types";
import TaskCard from "@/components/task/TaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
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

// Get accent color based on bucket type
const getBucketAccentColor = (bucketType: TaskBucketType): string => {
  switch (bucketType) {
    case "Short-Term":
      return "var(--color-blue)";
    case "Mid-Term":
      return "var(--color-purple)";
    case "Long-Term":
      return "var(--color-indigo)";
    case "Today":
      return "var(--color-green)";
    case "Tomorrow":
      return "var(--color-orange)";
    case "This Week":
      return "var(--color-pink)";
    default:
      return "var(--color-gray)";
  }
};

// Get border color style based on bucket type
const getBucketBorderStyle = (bucketType: TaskBucketType): string => {
  const accentColor = getBucketAccentColor(bucketType);
  return `border-t-4 border-t-[${accentColor}]`;
};

// Get header background gradient based on bucket type
const getHeaderGradient = (bucketType: TaskBucketType): string => {
  const accentColor = getBucketAccentColor(bucketType);
  return `linear-gradient(to right, ${accentColor}15, transparent)`;
};

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
    dropzone.classList.add("bg-accent/50", "border-dashed");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const dropzone = e.currentTarget;
    dropzone.classList.remove("bg-accent/50", "border-dashed");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropzone = e.currentTarget;
    dropzone.classList.remove("bg-accent/50", "border-dashed");
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

  // Get CSS variables for bucket-specific styling
  const accentColor = getBucketAccentColor(type);
  const bucketStyle = {
    "--bucket-accent": accentColor,
    "--bucket-bg": `${accentColor}05`, // Very subtle background tint
    "--bucket-header-bg": `${accentColor}10`, // Slightly stronger header background
  } as React.CSSProperties;

  return (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="transition-all duration-300 min-h-[16rem] shadow-md border-t-4"
      style={{
        ...bucketStyle,
        borderTopColor: accentColor,
        backgroundColor: "var(--bucket-bg)",
      }}
    >
      <CardHeader
        className="pb-2 rounded-t-md"
        style={{
          background: "var(--bucket-header-bg)",
        }}
      >
        <div className="flex justify-between items-center">
          <CardTitle
            className="text-base font-semibold"
            style={{ color: accentColor }}
          >
            {title}
          </CardTitle>
          <Badge
            variant="outline"
            className="ml-2 font-medium"
            style={{
              borderColor: accentColor,
              backgroundColor: `${accentColor}10`,
              color: accentColor,
            }}
          >
            {bucketTasks.length}
          </Badge>
        </div>
        {totalTime > 0 && (
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            <span className="font-medium">Total:</span> {totalTime} minutes
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        {bucketTasks.length === 0 ? (
          <div
            className="text-center py-12 text-sm text-muted-foreground italic rounded-md border border-dashed"
            style={{ borderColor: `${accentColor}30` }}
          >
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
                    className="border rounded-md mb-3 bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    style={{
                      borderLeftColor: accentColor,
                      borderLeftWidth: "3px",
                    }}
                  >
                    <CollapsibleTrigger
                      className="flex items-center justify-between w-full text-left p-3"
                      style={{
                        background: isOpen ? `${accentColor}15` : "transparent",
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={() => toggleGroup(mainTask)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{mainTask}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isOpen && (
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${accentColor}15`,
                              color: accentColor,
                            }}
                          >
                            {tasks.length}
                          </Badge>
                        )}
                        {isOpen ? (
                          <ChevronDown
                            className="h-4 w-4"
                            style={{ color: accentColor }}
                          />
                        ) : (
                          <ChevronRight
                            className="h-4 w-4"
                            style={{ color: accentColor }}
                          />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-0 divide-y divide-slate-100">
                        {tasks.map((task, index) => (
                          <div
                            key={task.id}
                            className={`
                              p-2
                              ${index % 2 === 0 ? "bg-accent/5" : "bg-white"}
                            `}
                            style={{
                              borderLeft:
                                index % 2 === 0
                                  ? `1px solid ${accentColor}15`
                                  : "none",
                              borderRight:
                                index % 2 === 0
                                  ? `1px solid ${accentColor}15`
                                  : "none",
                            }}
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
                      </div>
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
