import { Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Rectangle,
  CartesianGrid,
} from "recharts";

interface TimeVisualizationProps {
  tasks: Task[];
}

const TimeVisualization = ({ tasks }: TimeVisualizationProps) => {
  // Filter tasks to only include Today and Tomorrow buckets with time estimates
  const filteredTasks = tasks.filter(
    (task) =>
      (task.bucket === "Today" || task.bucket === "Tomorrow") &&
      task.time_estimate &&
      task.time_estimate > 0
  );

  if (filteredTasks.length === 0) {
    return (
      <Card className="col-span-3 animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg">Time Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">
            No tasks with time estimates in Today or Tomorrow buckets
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group tasks by main task and bucket
  type ChartData = {
    name: string;
    mainTask: string;
    category: string;
    [bucket: string]: any;
  };

  // Create data structure for the chart
  const chartData: ChartData[] = [];

  // Map to track sub-tasks by main task and bucket
  const taskMap: Record<string, Record<string, Task[]>> = {};

  // Group tasks by main task and bucket
  filteredTasks.forEach((task) => {
    const mainTask = task.main_task || "Ungrouped";
    const bucket = task.bucket;

    if (!taskMap[mainTask]) {
      taskMap[mainTask] = {};
    }

    if (!taskMap[mainTask][bucket]) {
      taskMap[mainTask][bucket] = [];
    }

    taskMap[mainTask][bucket].push(task);
  });

  // Process the grouped tasks to create chart data
  Object.entries(taskMap).forEach(([mainTask, buckets]) => {
    const dataEntry: ChartData = {
      name: mainTask.length > 15 ? `${mainTask.substring(0, 15)}...` : mainTask,
      mainTask,
      category:
        buckets.Today?.[0]?.category || buckets.Tomorrow?.[0]?.category || "",
      Today: 0,
      Tomorrow: 0,
    };

    Object.entries(buckets).forEach(([bucket, tasks]) => {
      dataEntry[bucket] = tasks.reduce(
        (sum, task) => sum + (task.time_estimate || 0),
        0
      );
    });

    chartData.push(dataEntry);
  });

  // Colors for the bars
  const colors = {
    Today: "#3b82f6", // blue
    Tomorrow: "#8b5cf6", // purple
  };

  return (
    <Card className="col-span-3 animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">
          Time Breakdown for Today & Tomorrow
        </CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={70}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{
                value: "Time (minutes)",
                angle: -90,
                position: "insideLeft",
                offset: -5,
              }}
            />
            <Tooltip
              formatter={(value: number, name: string, props: any) => {
                return [`${value} minutes`, name];
              }}
              labelFormatter={(label: string) => {
                const fullName =
                  chartData.find((item) => item.name === label)?.mainTask ||
                  label;
                return fullName;
              }}
            />
            <Legend />
            <Bar dataKey="Today" fill={colors.Today} name="Today" stackId="a" />
            <Bar
              dataKey="Tomorrow"
              fill={colors.Tomorrow}
              name="Tomorrow"
              stackId="a"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TimeVisualization;
