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
} from "recharts";
import { isSameDay, parseISO, startOfDay } from "date-fns";

interface TodayProgressVisualizationProps {
  tasks: Task[];
  completedTasks: Task[];
}

const TodayProgressVisualization = ({
  tasks,
  completedTasks,
}: TodayProgressVisualizationProps) => {
  const today = startOfDay(new Date());

  const plannedToday = tasks.filter(
    (task) => task.bucket === "Today" && task.time_estimate
  );
  const completedToday = completedTasks.filter((task) => {
    if (!task.time_estimate || !task.updated_at) return false;
    if (task.bucket !== "Today") return false;
    return isSameDay(parseISO(task.updated_at), today);
  });

  const goalByMain = new Map<string, number>();
  const completedByMain = new Map<string, number>();

  plannedToday.forEach((task) => {
    const key = task.main_task || "Ungrouped";
    goalByMain.set(key, (goalByMain.get(key) || 0) + (task.time_estimate || 0));
  });

  completedToday.forEach((task) => {
    const key = task.main_task || "Ungrouped";
    completedByMain.set(
      key,
      (completedByMain.get(key) || 0) + (task.time_estimate || 0)
    );
  });

  const keys = new Set([
    ...Array.from(goalByMain.keys()),
    ...Array.from(completedByMain.keys()),
  ]);

  const data = Array.from(keys)
    .map((key) => {
      const goalMinutes = goalByMain.get(key) || 0;
      const completedMinutes = completedByMain.get(key) || 0;
      const completedWithinGoal = Math.min(completedMinutes, goalMinutes);
      const remainingMinutes = Math.max(goalMinutes - completedMinutes, 0);
      const overMinutes = Math.max(completedMinutes - goalMinutes, 0);

      return {
        name: key,
        goalMinutes,
        completedMinutes,
        completedWithinGoal,
        remainingMinutes,
        overMinutes,
      };
    })
    .sort(
      (a, b) =>
        b.goalMinutes - a.goalMinutes ||
        b.completedMinutes - a.completedMinutes
    );

  if (data.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg">
            Today Progress vs Goal (Subtasks)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">
            Add today tasks or complete subtasks to see progress
          </p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const entry = payload[0]?.payload;
    if (!entry) return null;

    return (
      <div className="bg-white p-3 rounded-md border shadow-md text-sm">
        <p className="font-medium mb-2">{entry.name}</p>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-6">
            <span>Goal:</span>
            <span className="font-medium">{entry.goalMinutes} min</span>
          </div>
          <div className="flex justify-between gap-6">
            <span>Completed:</span>
            <span className="font-medium">{entry.completedMinutes} min</span>
          </div>
          {entry.overMinutes > 0 && (
            <div className="flex justify-between gap-6 text-red-500">
              <span>Over goal:</span>
              <span className="font-medium">{entry.overMinutes} min</span>
            </div>
          )}
          {entry.remainingMinutes > 0 && (
            <div className="flex justify-between gap-6 text-muted-foreground">
              <span>Remaining:</span>
              <span className="font-medium">{entry.remainingMinutes} min</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="animate-fade-in bg-background shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          Today Progress vs Goal (Subtasks)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[360px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
            barSize={36}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickMargin={12}
              interval={0}
              angle={-12}
              textAnchor="end"
              height={50}
            />
            <YAxis
              label={{
                value: "Minutes",
                angle: -90,
                position: "insideLeft",
                offset: -5,
                style: { textAnchor: "middle", fill: "#64748b", fontSize: 12 },
              }}
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="completedWithinGoal"
              stackId="goal"
              fill="#34A853"
              radius={[4, 4, 0, 0]}
            />
            <Bar dataKey="remainingMinutes" stackId="goal" fill="#E2E8F0" />
            <Bar dataKey="overMinutes" stackId="goal" fill="#EA4335" />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-[#34A853]" />
            Completed
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-[#E2E8F0]" />
            Remaining to goal
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-[#EA4335]" />
            Over goal
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayProgressVisualization;
