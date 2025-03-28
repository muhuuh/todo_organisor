import { useState, useMemo } from "react";
import { Task } from "@/types";
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

type FilterType = "main_task" | "category";

interface TaskExplorerProps {
  tasks: Task[];
  onDeleteTask: (id: string) => Promise<void>;
}

const TaskExplorer = ({ tasks, onDeleteTask }: TaskExplorerProps) => {
  const [filterType, setFilterType] = useState<FilterType>("main_task");
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Filter tasks based on selected filter type and value
  const filteredTasks = useMemo(() => {
    if (!selectedValue) return [];

    return tasks.filter((task) => {
      if (filterType === "main_task") {
        return task.main_task === selectedValue;
      } else {
        return task.category === selectedValue;
      }
    });
  }, [tasks, filterType, selectedValue]);

  const handleFilterTypeChange = (value: FilterType) => {
    setFilterType(value);
    setSelectedValue(""); // Reset selection when filter type changes
  };

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
  };

  const handleViewTasks = () => {
    if (selectedValue) {
      setIsModalOpen(true);
    }
  };

  return (
    <section className="mb-6">
      <Card className="bg-card/90">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-xl font-medium flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            Task Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-[150px]">
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

            <div className="flex-1 min-w-[200px]">
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

            <Button
              onClick={handleViewTasks}
              disabled={!selectedValue}
              size="sm"
              className="min-w-[100px]"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Tasks
            </Button>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <TaskExplorerModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tasks={filteredTasks}
          title={`${
            filterType === "main_task" ? "Main Task" : "Category"
          }: ${selectedValue}`}
          onDelete={onDeleteTask}
        />
      )}
    </section>
  );
};

export default TaskExplorer;
