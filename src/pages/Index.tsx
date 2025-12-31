import { useState, useCallback } from "react";
import { useTaskContext } from "@/context/TaskContext";
import { Task, TaskBucketType } from "@/types";
import TaskBucket from "@/components/buckets/TaskBucket";
import CreateTaskForm from "@/components/forms/CreateTaskForm";
import TimeVisualization from "@/components/charts/TimeVisualization";
import TodayProgressVisualization from "@/components/charts/TodayProgressVisualization";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/Navbar";
import TaskExplorer from "@/components/explorer/TaskExplorer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  flattenGroupedTasks,
  getGroupOrder,
  getTaskGroupKey,
  groupTasksByMain,
  UNGROUPED_TASK_KEY,
} from "@/lib/taskOrder";

// Helper function to format dates
const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

type DragData = {
  type: "task" | "group" | "bucket";
  bucket?: TaskBucketType;
  group?: string;
};

const Index = () => {
  const {
    tasks,
    completedTasks,
    isLoading,
    addTask,
    deleteTask,
    archiveTask,
    updateTimeEstimate,
    toggleTaskCompletion,
    updateTaskImportance,
    updateSubTask,
    reorderTasks,
    userId,
  } = useTaskContext();

  // Calculate dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTitle = `${formatDate(today)}`;
  const tomorrowTitle = `${formatDate(tomorrow)}`;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 5,
      },
    })
  );

  const [showPlanningSubtasks, setShowPlanningSubtasks] = useState(false);

  const collisionDetectionStrategy = useCallback((args: any) => {
    const activeType = (args.active?.data?.current as DragData | undefined)
      ?.type;
    if (activeType === "group") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (container: any) =>
            (container.data?.current as DragData | undefined)?.type === "group"
        ),
      });
    }

    if (activeType === "task") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (container: any) =>
            (container.data?.current as DragData | undefined)?.type !== "group"
        ),
      });
    }

    return closestCenter(args);
  }, []);

  const buildUpdates = (bucketTasks: Task[]) =>
    bucketTasks.map((task) => ({
      id: task.id,
      bucket: task.bucket,
      sort_order: task.sort_order ?? 0,
    }));

  const handleDndDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as DragData | undefined;
    const overData = over.data.current as DragData | undefined;

    if (activeData?.type === "group" && overData?.type === "group") {
      if (active.id === over.id || !activeData.bucket) return;
      if (activeData.bucket !== overData.bucket) return;

      const bucketTasks = tasks.filter(
        (task) => task.bucket === activeData.bucket
      );
      const groups = groupTasksByMain(bucketTasks);
      const groupOrder = getGroupOrder(groups);
      const activeIndex = groupOrder.indexOf(activeData.group ?? "");
      const overIndex = groupOrder.indexOf(overData.group ?? "");

      if (activeIndex === -1 || overIndex === -1) return;

      const updatedBucket = flattenGroupedTasks(
        groups,
        arrayMove(groupOrder, activeIndex, overIndex)
      );

      await reorderTasks(buildUpdates(updatedBucket));
      return;
    }

    if (activeData?.type !== "task") return;

    const activeTask = tasks.find((task) => task.id === active.id);
    if (!activeTask) return;

    const sourceBucket = (activeData.bucket ??
      activeTask.bucket) as TaskBucketType;
    const sourceGroup = activeData.group ?? getTaskGroupKey(activeTask);

    let targetBucket = sourceBucket;
    if (overData?.type === "task" || overData?.type === "bucket") {
      targetBucket = (overData.bucket ?? sourceBucket) as TaskBucketType;
    } else {
      return;
    }

    if (sourceBucket === targetBucket) {
      if (overData?.type === "task" && overData.group !== sourceGroup) {
        return;
      }

      const bucketTasks = tasks.filter(
        (task) => task.bucket === sourceBucket
      );
      const groups = groupTasksByMain(bucketTasks);
      const groupTasks = groups.get(sourceGroup) ?? [];
      const activeIndex = groupTasks.findIndex(
        (task) => task.id === activeTask.id
      );
      if (activeIndex === -1) return;

      const overIndex =
        overData?.type === "task"
          ? groupTasks.findIndex((task) => task.id === over.id)
          : groupTasks.length - 1;

      if (overIndex === -1 || overIndex === activeIndex) return;

      const updatedGroup = arrayMove(groupTasks, activeIndex, overIndex);
      groups.set(sourceGroup, updatedGroup);

      const updatedBucket = flattenGroupedTasks(
        groups,
        getGroupOrder(groups)
      );

      await reorderTasks(buildUpdates(updatedBucket));
      return;
    }

    const sourceBucketTasks = tasks.filter(
      (task) => task.bucket === sourceBucket && task.id !== activeTask.id
    );
    const targetBucketTasks = tasks.filter(
      (task) => task.bucket === targetBucket
    );

    const sourceGroups = groupTasksByMain(sourceBucketTasks);
    const targetGroups = groupTasksByMain(targetBucketTasks);
    const targetGroup = sourceGroup;
    const targetGroupTasks = targetGroups.get(targetGroup) ?? [];
    const isNewGroup = targetGroupTasks.length === 0;

    const insertIndex =
      overData?.type === "task" &&
      overData.bucket === targetBucket &&
      overData.group === targetGroup
        ? targetGroupTasks.findIndex((task) => task.id === over.id)
        : targetGroupTasks.length;

    const updatedTargetGroup = [...targetGroupTasks];
    updatedTargetGroup.splice(
      insertIndex === -1 ? updatedTargetGroup.length : insertIndex,
      0,
      { ...activeTask, bucket: targetBucket }
    );
    targetGroups.set(targetGroup, updatedTargetGroup);

    let targetGroupOrder = getGroupOrder(targetGroups);
    if (isNewGroup && targetGroup !== UNGROUPED_TASK_KEY) {
      targetGroupOrder = [
        ...targetGroupOrder.filter((key) => key !== targetGroup),
        targetGroup,
      ];
    }

    const updatedSourceBucket = flattenGroupedTasks(
      sourceGroups,
      getGroupOrder(sourceGroups)
    );
    const updatedTargetBucket = flattenGroupedTasks(
      targetGroups,
      targetGroupOrder
    );

    await reorderTasks(
      buildUpdates([...updatedSourceBucket, ...updatedTargetBucket])
    );
  };

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-2 py-8 max-w-7xl">
          <div className="mb-8">
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
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
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragEnd={handleDndDragEnd}
      >
        <div className="container mx-auto px-2 py-8 max-w-7xl">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-1">
              Task Organizer
            </h1>
            <p className="text-center text-muted-foreground">
              Organize tasks by projects and track your time efficiently
            </p>
          </header>

          <CreateTaskForm onSubmit={addTask} />

          <TaskExplorer
            tasks={tasks}
            onDelete={deleteTask}
            onToggleCompletion={toggleTaskCompletion}
          />

          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">Task Category Buckets</h2>
            <div className="grid grid-cols-1 gap-3">
              <TaskBucket
                title="On Hold Tasks"
                type="On Hold"
                tasks={tasks}
                onDelete={deleteTask}
                onArchive={archiveTask}
                onUpdateTimeEstimate={updateTimeEstimate}
                onToggleCompletion={toggleTaskCompletion}
                onUpdateImportance={updateTaskImportance}
                onUpdateSubTask={updateSubTask}
              />
            </div>
          </section>

          <section className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <h2 className="text-xl font-medium">Planning Timeframes</h2>
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="planning-view"
                  className={
                    showPlanningSubtasks ? "text-muted-foreground" : "font-medium"
                  }
                >
                  Main Tasks
                </Label>
                <Switch
                  id="planning-view"
                  checked={showPlanningSubtasks}
                  onCheckedChange={setShowPlanningSubtasks}
                />
                <Label
                  htmlFor="planning-view"
                  className={
                    !showPlanningSubtasks ? "text-muted-foreground" : "font-medium"
                  }
                >
                  Subtasks
                </Label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TaskBucket
                title={todayTitle}
                type="Today"
                tasks={tasks}
                onDelete={deleteTask}
                onArchive={archiveTask}
                onUpdateTimeEstimate={updateTimeEstimate}
                onToggleCompletion={toggleTaskCompletion}
                onUpdateImportance={updateTaskImportance}
                onUpdateSubTask={updateSubTask}
                allowTimeEstimate
                showSubtasksOnly={showPlanningSubtasks}
              />
              <TaskBucket
                title={tomorrowTitle}
                type="Tomorrow"
                tasks={tasks}
                onDelete={deleteTask}
                onArchive={archiveTask}
                onUpdateTimeEstimate={updateTimeEstimate}
                onToggleCompletion={toggleTaskCompletion}
                onUpdateImportance={updateTaskImportance}
                onUpdateSubTask={updateSubTask}
                allowTimeEstimate
                showSubtasksOnly={showPlanningSubtasks}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">Time Visualization</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <TimeVisualization tasks={tasks} />
              <TodayProgressVisualization
                tasks={tasks}
                completedTasks={completedTasks}
                userId={userId}
              />
            </div>
          </section>
        </div>
      </DndContext>
    </div>
  );
};

export default Index;
