import { Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  format,
  parseISO,
  startOfDay,
  subDays,
  differenceInDays,
} from "date-fns";

interface CompletedTasksVisualizationProps {
  tasks: Task[];
  dayRange?: number; // Optional prop to control how many days to display
}

// More distinct color palette
const COLORS = [
  "#4285F4", // Google Blue
  "#EA4335", // Google Red
  "#FBBC05", // Google Yellow
  "#34A853", // Google Green
  "#8429F6", // Purple
  "#FF6D01", // Orange
  "#0AB4FF", // Light Blue
  "#FF61C6", // Pink
  "#5F6368", // Grey
  "#00C49F", // Teal
];

const CompletedTasksVisualization = ({
  tasks,
  dayRange = 14,
}: CompletedTasksVisualizationProps) => {
  const [showSubTasks, setShowSubTasks] = useState(false);
  const [useFixedScale, setUseFixedScale] = useState(true);

  // Filter out tasks without updated_at or time_estimate
  const filteredTasks = tasks.filter(
    (task) => task.updated_at && task.time_estimate
  );

  // If no tasks available, display a message
  if (filteredTasks.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg">
            Time Spent on Completed Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72 flex items-center justify-center">
          <p className="text-muted-foreground">
            No completed tasks with time estimates found
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get the date range for the chart
  const today = startOfDay(new Date());
  const dateRange: Date[] = [];

  // Create an array of dates for the last X days
  for (let i = 0; i < dayRange; i++) {
    dateRange.push(subDays(today, i));
  }

  // Reverse so dates are in ascending order
  dateRange.reverse();

  // Group tasks by main task or subtask and by date
  const groupTasks = () => {
    const taskGroups = new Map<string, { key: string; mainTask?: string }>();

    // First identify all unique task groups
    filteredTasks.forEach((task) => {
      const key = showSubTasks ? task.sub_task : task.main_task || "Ungrouped";

      if (!taskGroups.has(key)) {
        taskGroups.set(key, {
          key,
          mainTask: task.main_task,
        });
      }
    });

    return Array.from(taskGroups.values());
  };

  const groupedTasks = groupTasks();

  // Prepare data for the stacked bar chart
  const chartData = dateRange.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const displayDate = format(date, "MMM d"); // e.g., "Jan 5"

    const dateObj: any = {
      name: displayDate,
      date: dateStr,
      total: 0,
    };

    // For each task group, calculate total time for this date
    groupedTasks.forEach((group) => {
      const tasksOnDay = filteredTasks.filter((task) => {
        if (!task.updated_at) return false;

        const taskDate = startOfDay(parseISO(task.updated_at));
        const matchesDate = differenceInDays(taskDate, date) === 0;
        const matchesGroup = showSubTasks
          ? task.sub_task === group.key
          : (task.main_task || "Ungrouped") === group.key;

        return matchesDate && matchesGroup;
      });

      const totalTime = tasksOnDay.reduce(
        (sum, task) => sum + (task.time_estimate || 0),
        0
      );
      dateObj[group.key] = totalTime;
      dateObj.total += totalTime;
    });

    return dateObj;
  });

  // Filter out dates with no data to avoid empty bars
  const filteredChartData = chartData.filter((data) => data.total > 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    // Filter out zero values
    const nonZeroPayload = payload.filter((entry: any) => entry.value > 0);

    if (nonZeroPayload.length === 0) return null;

    return (
      <div className="bg-white p-3 rounded-md border shadow-md text-sm">
        <p className="font-medium mb-2">{label}</p>
        <div className="space-y-1.5">
          {nonZeroPayload.map((entry: any, index: number) => {
            const taskName = entry.name;
            const mainTask = groupedTasks.find(
              (g) => g.key === taskName
            )?.mainTask;
            const displayName =
              showSubTasks && mainTask ? `${taskName} (${mainTask})` : taskName;

            return (
              <div key={index} className="flex items-center">
                <span
                  className="inline-block w-3 h-3 rounded-sm mr-2"
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="mr-2">{displayName}:</span>
                <span className="font-medium">{entry.value} min</span>
              </div>
            );
          })}
          <div className="pt-1.5 mt-1.5 border-t text-xs flex justify-between">
            <span>Total:</span>
            <span className="font-medium">
              {nonZeroPayload.reduce(
                (sum: number, entry: any) => sum + entry.value,
                0
              )}{" "}
              min
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Determine bar keys (what to stack)
  const barKeys = groupedTasks.map((g) => g.key);

  // If no filtered data, show message
  if (filteredChartData.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg">
            Time Spent on Completed Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72 flex items-center justify-center">
          <p className="text-muted-foreground">
            No completed tasks in the selected date range
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in bg-background shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-lg">
            Time Spent on Completed Tasks
          </CardTitle>

          <div className="flex items-center space-x-2">
            <Label
              htmlFor="view-mode-completed"
              className={showSubTasks ? "text-muted-foreground" : "font-medium"}
            >
              Main Tasks
            </Label>
            <Switch
              id="view-mode-completed"
              checked={showSubTasks}
              onCheckedChange={setShowSubTasks}
            />
            <Label
              htmlFor="view-mode-completed"
              className={
                !showSubTasks ? "text-muted-foreground" : "font-medium"
              }
            >
              Subtasks
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] pt-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredChartData}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
            barSize={filteredChartData.length > 7 ? 20 : 40}
            barGap={0}
            maxBarSize={60}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.2}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              axisLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
            />
            <YAxis
              label={{
                value: "Time (minutes)",
                angle: -90,
                position: "insideLeft",
                offset: -15,
                style: { textAnchor: "middle", fill: "#64748b", fontSize: 12 },
              }}
              axisLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              tick={{ fontSize: 12, fill: "#64748b" }}
              domain={useFixedScale ? [0, 800] : [0, "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            {useFixedScale && (
              <ReferenceLine
                y={480}
                stroke="#FF4444"
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{
                  value: "8 hrs",
                  position: "right",
                  fill: "#FF4444",
                  fontSize: 12,
                }}
              />
            )}

            {barKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="stack"
                fill={COLORS[index % COLORS.length]}
                radius={[index === 0 ? 4 : 0, index === 0 ? 4 : 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>

        <div className="absolute bottom-1 right-1 flex items-center space-x-2 text-xs text-muted-foreground">
          <Checkbox
            id="fixed-scale-completed"
            checked={useFixedScale}
            onCheckedChange={(checked) => setUseFixedScale(checked as boolean)}
          />
          <Label htmlFor="fixed-scale-completed" className="cursor-pointer">
            Show 8hr limit
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompletedTasksVisualization;
