import { useState } from "react";
import { Task, ImportanceLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Trash2,
  Archive,
  MoreHorizontal,
  CheckCircle,
  Tag,
  FolderOpen,
  Circle,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface TaskCardProps {
  task: Task;
  allowTimeEstimate?: boolean;
  inGroupView?: boolean; // Whether the card is displayed in a group view
  isCompleted?: boolean; // Whether this is displayed in the completed tasks list
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUpdateTimeEstimate: (id: string, estimate: number) => void;
  onToggleCompletion: (id: string) => void;
  onUpdateImportance: (id: string, importance: ImportanceLevel) => void;
}

const TaskCard = ({
  task,
  allowTimeEstimate = false,
  inGroupView = false,
  isCompleted = false,
  onDragStart,
  onDelete,
  onArchive,
  onUpdateTimeEstimate,
  onToggleCompletion,
  onUpdateImportance,
}: TaskCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [timeEstimate, setTimeEstimate] = useState(task.time_estimate || 0);
  const [showDetails, setShowDetails] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (isCompleted) return; // No dragging for completed tasks
    e.currentTarget.classList.add("task-dragging");
    onDragStart(e, task);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("task-dragging");
  };

  const handleTimeEstimateSubmit = () => {
    onUpdateTimeEstimate(task.id, timeEstimate);
    setIsEditing(false);
  };

  const handleCompletionToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCompletion(task.id);
  };

  const importanceClass = `importance-${task.importance.toLowerCase()}`;

  // Get the appropriate icon for importance level
  const getImportanceIcon = () => {
    switch (task.importance) {
      case "Low":
        return <Info className="h-3 w-3" />;
      case "Medium":
        return <AlertCircle className="h-3 w-3" />;
      case "High":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Get the appropriate class for importance badge
  const getImportanceBadgeClass = () => {
    switch (task.importance) {
      case "Low":
        return "bg-importance-badge-low text-importance-low";
      case "Medium":
        return "bg-importance-badge-medium text-importance-medium";
      case "High":
        return "bg-importance-badge-high text-importance-high";
      default:
        return "";
    }
  };

  return (
    <>
      <div
        draggable={!isCompleted}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`task-card ${importanceClass} animate-scale-in mb-3 ${
          task.completed || isCompleted ? "opacity-70" : ""
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex gap-2 flex-1">
            <button
              onClick={handleCompletionToggle}
              className="flex-shrink-0 mt-0.5"
              disabled={isCompleted}
            >
              {task.completed || isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            <div
              className={
                task.completed || isCompleted
                  ? "line-through text-muted-foreground"
                  : ""
              }
            >
              <h3 className="font-medium text-sm">{task.sub_task}</h3>
              {/* Only show main_task if not in a group view */}
              {task.main_task && !inGroupView && (
                <p className="text-xs text-muted-foreground mt-1">
                  {task.main_task}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-mt-1 -mr-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowDetails(true)}>
                View Details
              </DropdownMenuItem>
              {!isCompleted && (
                <>
                  {allowTimeEstimate && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      Set Time Estimate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Set Importance
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup
                        value={task.importance}
                        onValueChange={(value) =>
                          onUpdateImportance(task.id, value as ImportanceLevel)
                        }
                      >
                        <DropdownMenuRadioItem
                          value="Low"
                          className="importance-low-text"
                        >
                          Low
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="Medium"
                          className="importance-medium-text"
                        >
                          Medium
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="High"
                          className="importance-high-text"
                        >
                          High
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem onClick={() => onArchive(task.id)}>
                    Mark as Completed
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center mt-2 gap-2 ml-7">
          {/* Importance badge */}
          <Badge
            variant="outline"
            className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${getImportanceBadgeClass()}`}
          >
            {getImportanceIcon()}
            <span className="ml-1">{task.importance}</span>
          </Badge>

          <span className="inline-flex items-center text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            <Tag className="h-3 w-3 mr-1" /> {task.category}
          </span>

          {task.time_estimate > 0 && (
            <span className="inline-flex items-center text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full">
              <Clock className="h-3 w-3 mr-1" /> {task.time_estimate} min
            </span>
          )}
        </div>
      </div>

      {/* Time Estimate Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Time Estimate</DialogTitle>
            <DialogDescription>
              How long do you expect this task to take?
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right col-span-1">Minutes:</span>
              <Input
                id="time-estimate"
                type="number"
                min="0"
                className="col-span-3"
                value={timeEstimate}
                onChange={(e) => setTimeEstimate(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleTimeEstimateSubmit}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{task.sub_task}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {task.main_task && (
              <div className="flex gap-2 items-start">
                <FolderOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Main Task</p>
                  <p className="text-sm">{task.main_task}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 items-start">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Category</p>
                <p className="text-sm">{task.category}</p>
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Importance</p>
                <p className="text-sm">{task.importance}</p>
              </div>
            </div>

            {task.time_estimate > 0 && (
              <div className="flex gap-2 items-start">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Time Estimate</p>
                  <p className="text-sm">{task.time_estimate} minutes</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 items-start">
              <div className="h-5 w-5 flex items-center justify-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    task.importance === "Low"
                      ? "bg-importance-low"
                      : task.importance === "Medium"
                      ? "bg-importance-medium"
                      : "bg-importance-high"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium">Current Bucket</p>
                <p className="text-sm">{task.bucket}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            {!isCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onArchive(task.id)}
                className="flex items-center gap-1"
              >
                <Archive className="h-4 w-4" />
                Mark as Completed
              </Button>
            )}

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(task.id);
                setShowDetails(false);
              }}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskCard;
