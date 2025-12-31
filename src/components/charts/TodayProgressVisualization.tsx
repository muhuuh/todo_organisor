import { useEffect, useState } from "react";
import { Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { supabase, handleSupabaseError } from "@/lib/supabase";

interface TodayProgressVisualizationProps {
  tasks: Task[];
  completedTasks: Task[];
  userId?: string | null;
}

const TodayProgressVisualization = ({
  tasks,
  completedTasks,
  userId,
}: TodayProgressVisualizationProps) => {
  const today = startOfDay(new Date());
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [goalOverrides, setGoalOverrides] = useState<Record<string, number>>(
    {}
  );
  const goalType = showSubtasks ? "subtask" : "main";

  useEffect(() => {
    if (!userId) {
      setGoalOverrides({});
      return;
    }

    let isActive = true;
    const loadGoals = async () => {
      const { data, error } = await supabase
        .from("task_goals")
        .select("goal_key, goal_minutes")
        .eq("user_id", userId)
        .eq("goal_type", goalType);

      if (error) {
        handleSupabaseError(error);
        return;
      }

      if (!isActive) return;
      const nextGoals: Record<string, number> = {};
      (data || []).forEach((row) => {
        nextGoals[row.goal_key] = row.goal_minutes ?? 0;
      });
      setGoalOverrides(nextGoals);
    };

    loadGoals();
    return () => {
      isActive = false;
    };
  }, [goalType, userId]);

  const plannedToday = tasks.filter(
    (task) => task.bucket === "Today" && task.time_estimate
  );
  const completedToday = completedTasks.filter((task) => {
    if (!task.time_estimate || !task.updated_at) return false;
    if (task.bucket !== "Today") return false;
    return isSameDay(parseISO(task.updated_at), today);
  });

  const getGroupKey = (task: Task) =>
    showSubtasks ? task.sub_task : task.main_task || "Ungrouped";

  const plannedByGroup = new Map<string, number>();
  const completedByGroup = new Map<string, number>();

  plannedToday.forEach((task) => {
    const key = getGroupKey(task);
    plannedByGroup.set(
      key,
      (plannedByGroup.get(key) || 0) + (task.time_estimate || 0)
    );
  });

  completedToday.forEach((task) => {
    const key = getGroupKey(task);
    completedByGroup.set(
      key,
      (completedByGroup.get(key) || 0) + (task.time_estimate || 0)
    );
  });

  const keys = new Set([
    ...Array.from(plannedByGroup.keys()),
    ...Array.from(completedByGroup.keys()),
  ]);

  const data = Array.from(keys)
    .map((key) => {
      const plannedMinutes = plannedByGroup.get(key) || 0;
      const override = goalOverrides[key];
      const goalMinutes = override ?? plannedMinutes;
      const completedMinutes = completedByGroup.get(key) || 0;
      const completedWithinGoal = Math.min(completedMinutes, goalMinutes);
      const remainingMinutes = Math.max(goalMinutes - completedMinutes, 0);
      const overMinutes = Math.max(completedMinutes - goalMinutes, 0);

      return {
        name: key,
        plannedMinutes,
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

  const deleteGoal = async (key: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from("task_goals")
      .delete()
      .eq("user_id", userId)
      .eq("goal_type", goalType)
      .eq("goal_key", key);
    if (handleSupabaseError(error)) return;
  };

  const saveGoal = async (key: string, minutes: number) => {
    if (!userId) return;
    const { error } = await supabase.from("task_goals").upsert(
      [
        {
          user_id: userId,
          goal_type: goalType,
          goal_key: key,
          goal_minutes: minutes,
        },
      ],
      { onConflict: "user_id,goal_type,goal_key" }
    );
    if (handleSupabaseError(error)) return;
  };

  const handleGoalChange = (key: string, value: string) => {
    if (value.trim() === "") {
      setGoalOverrides((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      deleteGoal(key);
      return;
    }

    const parsed = Number.parseInt(value, 10);
    const minutes = Number.isNaN(parsed) ? 0 : Math.max(parsed, 0);
    setGoalOverrides((prev) => ({
      ...prev,
      [key]: minutes,
    }));
  };

  const handleGoalCommit = async (key: string) => {
    const minutes = goalOverrides[key];
    if (minutes === undefined) return;
    await saveGoal(key, minutes);
  };

  const handleResetGoals = () => {
    setGoalOverrides({});
    if (!userId) return;
    supabase
      .from("task_goals")
      .delete()
      .eq("user_id", userId)
      .eq("goal_type", goalType)
      .then(({ error }) => {
        if (error) {
          handleSupabaseError(error);
        }
      });
  };

  const titleSuffix = showSubtasks ? "Subtasks" : "Main Tasks";
  const canEditGoals = data.length > 0;

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-lg">
            Today Progress vs Goal ({titleSuffix})
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Label
              htmlFor="today-progress-view"
              className={showSubtasks ? "text-muted-foreground" : "font-medium"}
            >
              Main Tasks
            </Label>
            <Switch
              id="today-progress-view"
              checked={showSubtasks}
              onCheckedChange={setShowSubtasks}
            />
            <Label
              htmlFor="today-progress-view"
              className={!showSubtasks ? "text-muted-foreground" : "font-medium"}
            >
              Subtasks
            </Label>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGoalEditor((prev) => !prev)}
            disabled={!canEditGoals}
          >
            {showGoalEditor ? "Hide Goals" : "Set Goals"}
          </Button>
          {showGoalEditor && canEditGoals && (
            <Button variant="ghost" size="sm" onClick={handleResetGoals}>
              Reset to planned
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {!canEditGoals ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">
              Add today tasks or complete subtasks to see progress
            </p>
          </div>
        ) : (
          <>
            {showGoalEditor && (
              <div className="mb-4 rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
                <div className="text-xs text-muted-foreground">
                  Goals are saved locally for today.
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="text-sm font-medium truncate">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        className="h-8 w-20 text-xs text-right"
                        value={
                          goalOverrides[item.name] ?? item.plannedMinutes ?? 0
                        }
                        onChange={(event) =>
                          handleGoalChange(item.name, event.target.value)
                        }
                        onBlur={() => handleGoalCommit(item.name)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                        }}
                      />
                        <span className="text-xs text-muted-foreground">
                          min
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                  barSize={36}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.2}
                  />
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
                      style: {
                        textAnchor: "middle",
                        fill: "#64748b",
                        fontSize: 12,
                      },
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
            </div>

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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayProgressVisualization;
