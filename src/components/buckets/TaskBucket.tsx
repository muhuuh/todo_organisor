import { Task, TaskBucketType, ImportanceLevel } from "@/types";
import TaskCard from "@/components/task/TaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Clock, GripVertical } from "lucide-react";
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getGroupOrder,
  groupTasksByMain,
  sortTasksByOrder,
  UNGROUPED_TASK_KEY,
} from "@/lib/taskOrder";

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
  showSubtasksOnly?: boolean;
}

const buildGroupId = (bucket: TaskBucketType, groupKey: string) =>
  `group:${bucket}:${groupKey}`;

interface SortableGroupProps {
  bucketType: TaskBucketType;
  groupKey: string;
  tasks: Task[];
  isOpen: boolean;
  onToggle: () => void;
  allowTimeEstimate: boolean;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUpdateTimeEstimate: (id: string, estimate: number) => void;
  onToggleCompletion: (id: string) => void;
  onUpdateImportance: (id: string, importance: ImportanceLevel) => void;
  onUpdateSubTask: (id: string, newSubTask: string) => void;
}

const SortableGroup = ({
  bucketType,
  groupKey,
  tasks,
  isOpen,
  onToggle,
  allowTimeEstimate,
  onDelete,
  onArchive,
  onUpdateTimeEstimate,
  onToggleCompletion,
  onUpdateImportance,
  onUpdateSubTask,
}: SortableGroupProps) => {
  const groupId = buildGroupId(bucketType, groupKey);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: groupId,
    data: { type: "group", bucket: bucketType, group: groupKey },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const groupTime = tasks.reduce(
    (sum, task) => sum + (task.time_estimate || 0),
    0
  );

  return (
    <Collapsible
      ref={setNodeRef}
      style={style}
      open={isOpen}
      {...attributes}
      className={cn(
        "border rounded-xl p-2.5 mb-3 bg-card/90 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all group relative overflow-hidden",
        isDragging && "shadow-lg ring-1 ring-primary/20"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-violet-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...listeners}
            className="p-1 text-muted-foreground/70 hover:text-foreground transition-colors cursor-grab"
            aria-label="Reorder main task"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <CollapsibleTrigger asChild>
            <button
              type="button"
              onClick={onToggle}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <div className="font-medium text-sm">{groupKey}</div>
              </div>
              <div className="flex items-center gap-2">
                {groupTime > 0 && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground/70" />
                    {groupTime} min
                  </div>
                )}
                <Badge variant="secondary" className="bg-secondary/50 text-xs">
                  {tasks.length}
                </Badge>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="mt-3 space-y-2">
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className={cn(
                  "rounded-lg p-0.5",
                  index % 2 === 0 ? "bg-accent/5" : "bg-background/80",
                  index > 0 && "border-t border-accent/10"
                )}
              >
                <TaskCard
                  task={task}
                  onDelete={onDelete}
                  onArchive={onArchive}
                  onUpdateTimeEstimate={onUpdateTimeEstimate}
                  onToggleCompletion={onToggleCompletion}
                  onUpdateImportance={onUpdateImportance}
                  onUpdateSubTask={onUpdateSubTask}
                  allowTimeEstimate={allowTimeEstimate}
                  inGroupView={true}
                  hideCategory={true}
                />
              </div>
            ))}
          </SortableContext>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

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
  showSubtasksOnly = false,
}: TaskBucketProps) => {
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({});

  // --- dnd-kit Droppable ---
  const { setNodeRef, isOver } = useDroppable({
    id: type, // Unique ID for the drop zone (using the bucket type)
    data: { type: "bucket", bucket: type },
  });

  // Filter tasks for this bucket
  const bucketTasks = sortTasksByOrder(
    tasks.filter((task) => task.bucket === type)
  );

  // Calculate total time estimation for all tasks in this bucket
  const totalTime = bucketTasks.reduce(
    (sum, task) => sum + (task.time_estimate || 0),
    0
  );

  const groupedTasks = groupTasksByMain(bucketTasks);
  const groupOrder = getGroupOrder(groupedTasks);
  const ungroupedTasks = groupedTasks.get(UNGROUPED_TASK_KEY) ?? [];

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
            {showSubtasksOnly ? (
              <SortableContext
                items={bucketTasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {bucketTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDelete={onDelete}
                    onArchive={onArchive}
                    onUpdateTimeEstimate={onUpdateTimeEstimate}
                    onToggleCompletion={onToggleCompletion}
                    onUpdateImportance={onUpdateImportance}
                    onUpdateSubTask={onUpdateSubTask}
                    allowTimeEstimate={allowTimeEstimate}
                    inGroupView={false}
                  />
                ))}
              </SortableContext>
            ) : (
              <>
                {ungroupedTasks.length > 0 && (
                  <SortableContext
                    items={ungroupedTasks.map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {ungroupedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onDelete={onDelete}
                        onArchive={onArchive}
                        onUpdateTimeEstimate={onUpdateTimeEstimate}
                        onToggleCompletion={onToggleCompletion}
                        onUpdateImportance={onUpdateImportance}
                        onUpdateSubTask={onUpdateSubTask}
                        allowTimeEstimate={allowTimeEstimate}
                        inGroupView={false}
                      />
                    ))}
                  </SortableContext>
                )}

                <SortableContext
                  items={groupOrder.map((groupKey) =>
                    buildGroupId(type, groupKey)
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  {groupOrder.map((mainTask) => (
                    <SortableGroup
                      key={buildGroupId(type, mainTask)}
                      bucketType={type}
                      groupKey={mainTask}
                      tasks={groupedTasks.get(mainTask) ?? []}
                      isOpen={isGroupOpen(mainTask)}
                      onToggle={() => toggleGroup(mainTask)}
                      allowTimeEstimate={allowTimeEstimate}
                      onDelete={onDelete}
                      onArchive={onArchive}
                      onUpdateTimeEstimate={onUpdateTimeEstimate}
                      onToggleCompletion={onToggleCompletion}
                      onUpdateImportance={onUpdateImportance}
                      onUpdateSubTask={onUpdateSubTask}
                    />
                  ))}
                </SortableContext>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskBucket;
