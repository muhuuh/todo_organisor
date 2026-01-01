import { Task } from "@/types";

export const UNGROUPED_TASK_KEY = "__ungrouped__";

export const getTaskGroupKey = (task: Task) =>
  task.main_task || UNGROUPED_TASK_KEY;

const getFallbackOrder = (task: Task) => {
  const createdAt = new Date(task.created_at).getTime();
  return Number.isNaN(createdAt) ? Number.MIN_SAFE_INTEGER : -createdAt;
};

export const sortTasksByOrder = (tasks: Task[]) =>
  [...tasks].sort((a, b) => {
    const orderA = a.sort_order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sort_order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return getFallbackOrder(a) - getFallbackOrder(b);
  });

export const groupTasksByMain = (tasks: Task[]) => {
  const groups = new Map<string, Task[]>();

  tasks.forEach((task) => {
    const key = getTaskGroupKey(task);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)?.push(task);
  });

  for (const [key, groupTasks] of groups) {
    groups.set(key, sortTasksByOrder(groupTasks));
  }

  return groups;
};

const getGroupSortValue = (tasks: Task[]) => {
  const [first] = sortTasksByOrder(tasks);
  if (!first) {
    return Number.MAX_SAFE_INTEGER;
  }
  return first.sort_order ?? getFallbackOrder(first);
};

export const getGroupOrder = (groups: Map<string, Task[]>) =>
  Array.from(groups.entries())
    .filter(([key]) => key !== UNGROUPED_TASK_KEY)
    .sort((a, b) => getGroupSortValue(a[1]) - getGroupSortValue(b[1]))
    .map(([key]) => key);

export const flattenGroupedTasks = (
  groups: Map<string, Task[]>,
  groupOrder: string[]
) => {
  const ordered: Task[] = [];
  const ungrouped = groups.get(UNGROUPED_TASK_KEY) ?? [];
  ordered.push(...ungrouped);

  groupOrder.forEach((key) => {
    const groupTasks = groups.get(key);
    if (groupTasks) {
      ordered.push(...groupTasks);
    }
  });

  return ordered.map((task, index) => ({
    ...task,
    sort_order: index + 1,
  }));
};
