import { useEffect, useState } from "react";
import { Check, X, Loader2, RefreshCw } from "lucide-react";
import { useTaskContext } from "@/context/TaskContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TaskCard from "@/components/task/TaskCard";
import { Navbar } from "@/components/layout/Navbar";

export default function CompletedTasksPage() {
  const {
    completedTasks,
    isLoadingCompleted,
    fetchCompletedTasks,
    deleteTask,
  } = useTaskContext();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a specific function to handle the fetch operation
  const loadCompletedTasks = async () => {
    try {
      setError(null);
      await fetchCompletedTasks();
    } catch (err) {
      console.error("Error loading completed tasks:", err);
      setError("Failed to load completed tasks. Please try again.");
    }
  };

  useEffect(() => {
    // Load completed tasks when component mounts
    loadCompletedTasks();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCompletedTasks();
    setIsRefreshing(false);
  };

  // Group tasks by main_task
  const groupedTasks = completedTasks.reduce((acc, task) => {
    const mainTask = task.main_task || "Ungrouped";
    if (!acc[mainTask]) {
      acc[mainTask] = [];
    }
    acc[mainTask].push(task);
    return acc;
  }, {} as Record<string, typeof completedTasks>);

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Completed Tasks
                </CardTitle>
                <CardDescription>
                  {completedTasks.length
                    ? `${completedTasks.length} tasks have been completed`
                    : "Tasks that have been marked as completed will appear here"}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoadingCompleted}
              >
                {isRefreshing || isLoadingCompleted ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingCompleted && (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!isLoadingCompleted && error && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            )}

            {!isLoadingCompleted && !error && completedTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <h3 className="text-lg font-medium">No completed tasks yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  When you complete tasks, they will appear here
                </p>
              </div>
            )}

            {!isLoadingCompleted && !error && completedTasks.length > 0 && (
              <div className="space-y-8">
                {Object.entries(groupedTasks).map(([mainTask, tasks]) => (
                  <div key={mainTask} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">{mainTask}</h3>
                      <Badge variant="outline" className="text-sm">
                        {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div key={task.id} className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full opacity-70 hover:opacity-100"
                            onClick={() => deleteTask(task.id)}
                            title="Delete permanently"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <TaskCard
                            task={task}
                            inGroupView={true}
                            isCompleted={true}
                            allowTimeEstimate={false}
                            onDragStart={(e) => {}}
                            onDelete={deleteTask}
                            onArchive={() => {}}
                            onUpdateTimeEstimate={() => {}}
                            onToggleCompletion={() => {}}
                            onUpdateImportance={() => {}}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {completedTasks.length > 0 && (
            <CardFooter className="flex justify-end">
              <p className="text-sm text-muted-foreground">
                Click the X button to permanently delete a completed task
              </p>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
