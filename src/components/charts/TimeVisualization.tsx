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

interface TimeVisualizationProps {
  tasks: Task[];
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

const TimeVisualization = ({ tasks }: TimeVisualizationProps) => {
  const [showSubTasks, setShowSubTasks] = useState(false);
  const [useFixedScale, setUseFixedScale] = useState(true);

  // Filter out any tasks without a bucket (Today/Tomorrow)
  const filteredTasks = tasks.filter(
    (task) => task.bucket === "Today" || task.bucket === "Tomorrow"
  );

  // If no tasks available, display a message
  if (filteredTasks.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg">
            Time Breakdown for Today & Tomorrow
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72 flex items-center justify-center">
          <p className="text-muted-foreground">
            Add tasks with time estimates to see the visualization
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group tasks by main task or subtask based on view mode
  const groupTasks = () => {
    const taskGroups = new Map<
      string,
      {
        key: string;
        todayTime: number;
        tomorrowTime: number;
        mainTask?: string;
      }
    >();

    filteredTasks.forEach((task) => {
      const key = showSubTasks ? task.sub_task : task.main_task || "Ungrouped";

      if (!taskGroups.has(key)) {
        taskGroups.set(key, {
          key,
          todayTime: 0,
          tomorrowTime: 0,
          mainTask: task.main_task,
        });
      }

      const group = taskGroups.get(key)!;
      if (task.bucket === "Today") {
        group.todayTime += task.time_estimate || 0;
      } else if (task.bucket === "Tomorrow") {
        group.tomorrowTime += task.time_estimate || 0;
      }
    });

    return Array.from(taskGroups.values()).sort(
      (a, b) => b.todayTime + b.tomorrowTime - (a.todayTime + a.tomorrowTime)
    );
  };

  const groupedTasks = groupTasks();

  // Prepare data for the stacked bar chart (simplified approach)
  const chartData = [
    {
      name: "Today",
      total: filteredTasks
        .filter((t) => t.bucket === "Today")
        .reduce((sum, t) => sum + (t.time_estimate || 0), 0),
      ...Object.fromEntries(
        groupedTasks.map((group) => [group.key, group.todayTime])
      ),
    },
    {
      name: "Tomorrow",
      total: filteredTasks
        .filter((t) => t.bucket === "Tomorrow")
        .reduce((sum, t) => sum + (t.time_estimate || 0), 0),
      ...Object.fromEntries(
        groupedTasks.map((group) => [group.key, group.tomorrowTime])
      ),
    },
  ];

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

  return (
    <Card className="animate-fade-in bg-background shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-lg">
            Time Breakdown for Today & Tomorrow
          </CardTitle>

          <div className="flex items-center space-x-2">
            <Label
              htmlFor="view-mode"
              className={showSubTasks ? "text-muted-foreground" : "font-medium"}
            >
              Main Tasks
            </Label>
            <Switch
              id="view-mode"
              checked={showSubTasks}
              onCheckedChange={setShowSubTasks}
            />
            <Label
              htmlFor="view-mode"
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
            data={chartData}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
            barSize={80}
            barGap={0}
            maxBarSize={100}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.2}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 14 }}
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
            id="fixed-scale"
            checked={useFixedScale}
            onCheckedChange={(checked) => setUseFixedScale(checked as boolean)}
          />
          <Label htmlFor="fixed-scale" className="cursor-pointer">
            Show 8hr limit
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeVisualization;
