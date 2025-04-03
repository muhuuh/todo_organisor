import { useState, useMemo } from "react";
import { Task, ImportanceLevel } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, Eye } from "lucide-react";
import TaskExplorerModal from "@/components/explorer/TaskExplorerModal";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type FilterType = "main_task" | "category";
type ExplorerMode = "type" | "importance";

interface TaskExplorerProps {
  tasks: Task[];
  onDelete: (id: string) => Promise<void>;
  onToggleCompletion: (id: string) => Promise<void>;
}

const TaskExplorer = ({
  tasks,
  onDelete,
  onToggleCompletion,
}: TaskExplorerProps) => {
  // Mode toggle state (type or importance)
  const [explorerMode, setExplorerMode] = useState<ExplorerMode>("type");

  // Original states for Type mode
  const [filterType, setFilterType] = useState<FilterType>("main_task");
  const [selectedValue, setSelectedValue] = useState<string>("");

  // New state for Importance mode
  const [selectedImportance, setSelectedImportance] = useState<
    ImportanceLevel | ""
  >("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Local state for the task display in the modal
  const [localTaskStates, setLocalTaskStates] = useState<
    Record<string, boolean>
  >({});
  // Track tasks that were toggled but not yet processed
  const [pendingCompletionToggles, setPendingCompletionToggles] = useState<
    Set<string>
  >(new Set());

  // Get unique main tasks and categories from tasks
  const uniqueOptions = useMemo(() => {
    const mainTasks = new Set<string>();
    const categories = new Set<string>();

    tasks.forEach((task) => {
      if (task.main_task) {
        mainTasks.add(task.main_task);
      }
      if (task.category) {
        categories.add(task.category);
      }
    });

    return {
      main_task: Array.from(mainTasks).sort(),
      category: Array.from(categories).sort(),
    };
  }, [tasks]);

  // Filter tasks based on selected mode, filter type and value
  const filteredTasks = useMemo(() => {
    // Type mode filtering
    if (explorerMode === "type") {
      if (!selectedValue) return [];

      const filtered = tasks.filter((task) => {
        if (filterType === "main_task") {
          return task.main_task === selectedValue;
        } else {
          return task.category === selectedValue;
        }
      });

      // Apply any local state changes for display purposes
      return filtered.map((task) => {
        if (localTaskStates[task.id] !== undefined) {
          return {
            ...task,
            completed: localTaskStates[task.id],
          };
        }
        return task;
      });
    }
    // Importance mode filtering
    else {
      if (!selectedImportance) return [];

      const filtered = tasks.filter(
        (task) => task.importance === selectedImportance
      );

      // Apply any local state changes for display purposes
      return filtered.map((task) => {
        if (localTaskStates[task.id] !== undefined) {
          return {
            ...task,
            completed: localTaskStates[task.id],
          };
        }
        return task;
      });
    }
  }, [
    tasks,
    explorerMode,
    filterType,
    selectedValue,
    selectedImportance,
    localTaskStates,
  ]);

  const handleFilterTypeChange = (value: FilterType) => {
    setFilterType(value);
    setSelectedValue(""); // Reset selection when filter type changes
  };

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
  };

  const handleImportanceChange = (value: ImportanceLevel) => {
    setSelectedImportance(value);
  };

  const handleModeToggle = (checked: boolean) => {
    const mode = checked ? "importance" : "type";
    setExplorerMode(mode);
    // Reset selections when switching modes
    if (mode === "type") {
      setSelectedImportance("");
    } else {
      setSelectedValue("");
    }
  };

  const handleViewTasks = () => {
    const hasSelection =
      explorerMode === "type" ? !!selectedValue : !!selectedImportance;

    if (hasSelection) {
      // Reset local states when opening modal
      setLocalTaskStates({});
      setPendingCompletionToggles(new Set());
      setIsModalOpen(true);
    }
  };

  // Local handler for task completion in the modal
  const handleTaskCompletion = (id: string) => {
    // Find the current task to get its state
    const task = filteredTasks.find((t) => t.id === id);
    if (!task) return;

    // Update local state for immediate UI feedback
    setLocalTaskStates((prev) => ({
      ...prev,
      [id]: !task.completed,
    }));

    // Add to our pending changes set
    setPendingCompletionToggles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id); // Toggle off if it was already toggled
      } else {
        newSet.add(id); // Toggle on
      }
      return newSet;
    });
  };

  // Handle the modal closing - process all pending changes
  const handleCloseModal = async () => {
    // Process all pending toggles
    if (pendingCompletionToggles.size > 0) {
      // Create an array of promises for all toggles
      const togglePromises = Array.from(pendingCompletionToggles).map(
        (taskId) => onToggleCompletion(taskId)
      );

      // Execute all toggles in parallel
      try {
        await Promise.all(togglePromises);
      } catch (error) {
        console.error("Error processing completion toggles:", error);
      }
    }

    // Reset all local state
    setLocalTaskStates({});
    setPendingCompletionToggles(new Set());
    setIsModalOpen(false);
  };

  const getModalTitle = () => {
    if (explorerMode === "type") {
      return `${
        filterType === "main_task" ? "Main Task" : "Category"
      }: ${selectedValue}`;
    } else {
      return `Importance: ${selectedImportance}`;
    }
  };

  return (
    <section className="mb-6">
      <Card className="bg-card/90 w-full">
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-medium flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              Task Explorer
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="mode-toggle" className="text-sm mr-1">
                Type
              </Label>
              <Switch
                id="mode-toggle"
                checked={explorerMode === "importance"}
                onCheckedChange={handleModeToggle}
              />
              <Label htmlFor="mode-toggle" className="text-sm ml-1">
                Importance
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            {explorerMode === "type" ? (
              <>
                <div className="w-full md:w-1/3">
                  <Select
                    value={filterType}
                    onValueChange={(value) =>
                      handleFilterTypeChange(value as FilterType)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main_task">Main Task</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-1/2">
                  <Select
                    value={selectedValue}
                    onValueChange={handleValueChange}
                    disabled={
                      !uniqueOptions[filterType] ||
                      uniqueOptions[filterType].length === 0
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={`Select ${
                          filterType === "main_task" ? "Main Task" : "Category"
                        }`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueOptions[filterType]?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="w-full md:w-5/6">
                <Select
                  value={selectedImportance}
                  onValueChange={(value) =>
                    handleImportanceChange(value as ImportanceLevel)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Importance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="w-full md:w-1/6">
              <Button
                onClick={handleViewTasks}
                disabled={
                  explorerMode === "type" ? !selectedValue : !selectedImportance
                }
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Tasks
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <TaskExplorerModal
          open={isModalOpen}
          onClose={handleCloseModal}
          tasks={filteredTasks}
          title={getModalTitle()}
          onDelete={onDelete}
          onToggleCompletion={handleTaskCompletion}
        />
      )}
    </section>
  );
};

export default TaskExplorer;
