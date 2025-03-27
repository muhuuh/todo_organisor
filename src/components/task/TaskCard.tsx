import { useState, useRef, useEffect } from "react";
import { Task, ImportanceLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Clock,
  Trash2,
  Tag,
  Square,
  CheckSquare,
  AlertTriangle,
  AlertCircle,
  Info,
  Edit2,
  X,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import TaskCountdown from "./TaskCountdown";

interface TaskCardProps {
  task: Task;
  allowTimeEstimate?: boolean;
  inGroupView?: boolean; // Whether the card is displayed in a group view
  isCompleted?: boolean; // Whether this is displayed in the completed tasks list
  hideCategory?: boolean; // Whether to hide the category badge
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
  hideCategory = false,
  onDragStart,
  onDelete,
  onArchive,
  onUpdateTimeEstimate,
  onToggleCompletion,
  onUpdateImportance,
}: TaskCardProps) => {
  const [timeEstimate, setTimeEstimate] = useState(task.time_estimate || 0);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [showImportanceOptions, setShowImportanceOptions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [showCountdown, setShowCountdown] = useState(false);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const importanceRef = useRef<HTMLDivElement>(null);

  // Focus input when editing time
  useEffect(() => {
    if (isEditingTime && timeInputRef.current) {
      timeInputRef.current.focus();
    }
  }, [isEditingTime]);

  // Calculate dropdown position when showing importance options
  useEffect(() => {
    if (showImportanceOptions && importanceRef.current) {
      const rect = importanceRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 5,
        left: rect.left,
      });
    }
  }, [showImportanceOptions]);

  // Close importance dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if clicking on dropdown menu
      const dropdownEl = document.getElementById("importance-dropdown");
      if (dropdownEl && dropdownEl.contains(event.target as Node)) {
        return;
      }

      if (
        importanceRef.current &&
        !importanceRef.current.contains(event.target as Node)
      ) {
        setShowImportanceOptions(false);
      }
    };

    if (showImportanceOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showImportanceOptions]);

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
    setIsEditingTime(false);
    toast.success(`Time estimate updated to ${timeEstimate} minutes`);
  };

  const handleCompletionToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCompletion(task.id);
  };

  const handleSliderChange = (value: number[]) => {
    setTimeEstimate(value[0]);
  };

  const handleImportanceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) {
      setShowImportanceOptions(!showImportanceOptions);
    }
  };

  const updateImportanceHandler = (importance: ImportanceLevel) => {
    onUpdateImportance(task.id, importance);
    setShowImportanceOptions(false);
    toast.success(`Task importance set to ${importance}`);
  };

  const handleOpenCountdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.time_estimate > 0) {
      setShowCountdown(true);
    }
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
        return "bg-importance-badge-low/20 text-importance-low hover:bg-importance-low/30";
      case "Medium":
        return "bg-importance-badge-medium/20 text-importance-medium hover:bg-importance-medium/30";
      case "High":
        return "bg-importance-badge-high/20 text-importance-high hover:bg-importance-high/30";
      default:
        return "";
    }
  };

  // Render the importance dropdown at the fixed position
  const renderImportanceDropdown = () => {
    if (!showImportanceOptions || isCompleted) return null;

    return (
      <div
        id="importance-dropdown"
        className="fixed rounded-md border bg-card shadow-lg p-2 w-32 z-[9999]"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
        }}
      >
        <h4 className="text-xs font-medium mb-1">Set Importance</h4>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-7 gap-2 text-xs importance-low-text hover:bg-importance-badge-low/10"
          onClick={() => updateImportanceHandler("Low")}
        >
          <Info className="h-3.5 w-3.5" />
          Low
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-7 gap-2 text-xs importance-medium-text hover:bg-importance-badge-medium/10"
          onClick={() => updateImportanceHandler("Medium")}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Medium
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-7 gap-2 text-xs importance-high-text hover:bg-importance-badge-high/10"
          onClick={() => updateImportanceHandler("High")}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          High
        </Button>
      </div>
    );
  };

  return (
    <>
      <div
        draggable={!isCompleted}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`task-card ${importanceClass} ${
          task.completed || isCompleted ? "opacity-60 bg-muted/30" : ""
        }`}
      >
        <div className="p-1.5">
          {/* Main Task Content - Grid Structure */}
          <div className="grid grid-cols-[auto_1fr] gap-x-3">
            {/* Column 1: Checkbox */}
            <div className="flex-shrink-0 mt-0.5">
              {!isEditingTime ? (
                <button
                  onClick={handleCompletionToggle}
                  className="flex-shrink-0 transition-colors"
                  disabled={isCompleted}
                  aria-label={
                    isCompleted ? "Task completed" : "Mark as completed"
                  }
                  title={isCompleted ? "Task completed" : "Mark as completed"}
                >
                  {task.completed || isCompleted ? (
                    <CheckSquare className="h-[18px] w-[18px] text-primary/90" />
                  ) : (
                    <Square className="h-[18px] w-[18px] text-muted-foreground/60 hover:text-primary hover:border-primary transition-colors" />
                  )}
                </button>
              ) : (
                <div className="w-[18px] h-[18px]"></div>
              )}
            </div>

            {/* Column 2: Content and Badges */}
            <div className="min-w-0 relative">
              {/* Task Title Area */}
              <div className="relative pr-5">
                <div
                  className={
                    task.completed || isCompleted
                      ? "line-through text-muted-foreground"
                      : ""
                  }
                >
                  <h3 className="font-medium text-sm leading-tight">
                    {task.sub_task}
                  </h3>
                  {/* Only show main_task if not in a group view */}
                  {task.main_task && !inGroupView && (
                    <p className="text-xs text-muted-foreground/80 mt-0.5 leading-tight">
                      {task.main_task}
                    </p>
                  )}
                </div>

                {/* Delete button */}
                {!isEditingTime && (
                  <button
                    onClick={() => onDelete(task.id)}
                    className="absolute right-0 top-0 text-muted-foreground/40 hover:text-destructive transition-colors hover:bg-destructive/10 rounded-full p-0.5"
                    aria-label="Delete task"
                    title="Delete task"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Time Estimate Slider - Only show when editing */}
              {allowTimeEstimate && isEditingTime && (
                <div className="mt-2 bg-accent/5 p-3 rounded-lg border border-accent/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Time Estimate (minutes):
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Slider
                      className="flex-grow"
                      min={0}
                      max={120}
                      step={5}
                      value={[timeEstimate]}
                      onValueChange={handleSliderChange}
                    />
                    <Input
                      ref={timeInputRef}
                      type="number"
                      min={0}
                      className="w-16 h-8 text-xs text-center"
                      value={timeEstimate}
                      onChange={(e) =>
                        setTimeEstimate(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="flex gap-2 mt-3 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-3"
                      onClick={() => setIsEditingTime(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={handleTimeEstimateSubmit}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}

              {/* Badges row - aligned with the content */}
              {(!isEditingTime || !allowTimeEstimate) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {/* Importance badge */}
                  <div ref={importanceRef} className="relative">
                    <Badge
                      variant="outline"
                      className={`h-[22px] text-xs px-2.5 py-0 rounded-full border-transparent shadow-sm ${
                        !isCompleted ? "cursor-pointer hover:bg-opacity-80" : ""
                      } ${getImportanceBadgeClass()}`}
                      onClick={handleImportanceClick}
                      title={
                        isCompleted
                          ? "Task importance"
                          : "Click to change importance"
                      }
                    >
                      {getImportanceIcon()}
                      <span className="ml-1">{task.importance}</span>
                      {!isCompleted && (
                        <Edit2 className="h-2.5 w-2.5 ml-1 opacity-50" />
                      )}
                    </Badge>
                  </div>

                  {/* Category badge */}
                  {!hideCategory && (
                    <Badge
                      variant="outline"
                      className="h-[22px] text-xs px-2.5 py-0 rounded-full bg-primary/10 text-primary border-transparent shadow-sm"
                      title="Category"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {task.category}
                    </Badge>
                  )}

                  {/* Time estimate badge with countdown button */}
                  {task.time_estimate > 0 && !isEditingTime && (
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={`h-[22px] text-xs px-2.5 py-0 rounded-full bg-accent/20 text-accent-foreground border-transparent shadow-sm ${
                          allowTimeEstimate && !isCompleted
                            ? "cursor-pointer hover:bg-accent/30"
                            : ""
                        }`}
                        onClick={() => {
                          if (allowTimeEstimate && !isCompleted) {
                            setIsEditingTime(true);
                          }
                        }}
                        title={
                          allowTimeEstimate && !isCompleted
                            ? "Click to edit time"
                            : "Time estimate"
                        }
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {task.time_estimate} min
                        {allowTimeEstimate && !isCompleted && (
                          <Edit2 className="h-2.5 w-2.5 ml-1 opacity-50" />
                        )}
                      </Badge>

                      {!isCompleted && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-[22px] w-[22px] rounded-full p-0 flex items-center justify-center bg-primary/10 hover:bg-primary/20 border-0 shadow-sm"
                          onClick={handleOpenCountdown}
                          title="Start countdown timer"
                        >
                          <Timer className="h-3 w-3 text-primary" />
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Add time button */}
                  {!task.time_estimate &&
                    allowTimeEstimate &&
                    !isCompleted &&
                    !isEditingTime && (
                      <Badge
                        variant="outline"
                        className="h-[22px] text-xs px-2.5 py-0 rounded-full bg-accent/20 text-accent-foreground cursor-pointer hover:bg-accent/30 border-transparent shadow-sm"
                        onClick={() => setIsEditingTime(true)}
                        title="Add time"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Add time
                        <Edit2 className="h-2.5 w-2.5 ml-1 opacity-50" />
                      </Badge>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Render importance dropdown */}
      {renderImportanceDropdown()}

      {/* Task Countdown Modal */}
      <TaskCountdown
        isOpen={showCountdown}
        onClose={() => setShowCountdown(false)}
        taskName={task.sub_task}
        totalMinutes={task.time_estimate || 0}
      />
    </>
  );
};

export default TaskCard;
