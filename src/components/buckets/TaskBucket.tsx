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
import { useState, useEffect } from "react";

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

  // Initialize all groups as open by default
  useEffect(() => {
    const initialOpenState: { [key: string]: boolean } = {};
    Object.keys(groupedTasks).forEach((key) => {
      initialOpenState[key] = true;
    });
    setOpenGroups(initialOpenState);
  }, []);

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
              .map(([mainTask, tasks]) => (
                <Collapsible
                  key={mainTask}
                  open={openGroups[mainTask]}
                  className="border rounded-md p-2 mb-3 bg-card"
                >
                  <CollapsibleTrigger
                    className="flex items-center justify-between w-full text-left"
                    onClick={() => toggleGroup(mainTask)}
                  >
                    <div className="font-medium">{mainTask}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{tasks.length}</Badge>
                      {openGroups[mainTask] ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    {tasks.map((task) => (
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
                        inGroupView={true}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskBucket;
