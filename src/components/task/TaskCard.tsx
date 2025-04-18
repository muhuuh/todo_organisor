import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Save,
  GripVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import TaskCountdown from "./TaskCountdown";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  task: Task;
  allowTimeEstimate?: boolean;
  inGroupView?: boolean;
  isCompleted?: boolean;
  hideCategory?: boolean;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUpdateTimeEstimate: (id: string, estimate: number) => void;
  onToggleCompletion: (id: string) => void;
  onUpdateImportance: (id: string, importance: ImportanceLevel) => void;
  onUpdateSubTask: (id: string, newSubTask: string) => void;
}

const TaskCard = ({
  task,
  allowTimeEstimate = false,
  inGroupView = false,
  isCompleted = false,
  hideCategory = false,
  onDelete,
  onArchive,
  onUpdateTimeEstimate,
  onToggleCompletion,
  onUpdateImportance,
  onUpdateSubTask,
}: TaskCardProps) => {
  const [timeEstimate, setTimeEstimate] = useState(task.time_estimate || 0);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [showImportanceOptions, setShowImportanceOptions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [showCountdown, setShowCountdown] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedSubTask, setEditedSubTask] = useState(task.sub_task);

  const timeInputRef = useRef<HTMLInputElement>(null);
  const importanceRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Focus input when editing time
  useEffect(() => {
    if (isEditingTime && timeInputRef.current) {
      timeInputRef.current.focus();
    }
  }, [isEditingTime]);

  // Focus input when editing title
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

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

  // Close title editing when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        titleInputRef.current &&
        !titleInputRef.current.contains(event.target as Node) &&
        saveButtonRef.current &&
        !saveButtonRef.current.contains(event.target as Node)
      ) {
        // We can either cancel or save here - choosing to cancel for now
        setIsEditingTitle(false);
        setEditedSubTask(task.sub_task); // Reset to original value
      }
    };

    if (isEditingTitle) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingTitle, task.sub_task]);

  const isDisabled = isCompleted || isEditingTitle || isEditingTime;
  // console.log(`Task ${task.id} - isDisabled: ${isDisabled}`); // Add this temporarily for debugging if needed

  // --- dnd-kit Draggable ---
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    isDragging 
  } = useDraggable({
    id: task.id, 
    data: { task }, 
    disabled: isDisabled, // Use the calculated disabled state
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 100 : undefined, 
  } : undefined;

  const handleTimeEstimateSubmit = () => {
    onUpdateTimeEstimate(task.id, timeEstimate);
    setIsEditingTime(false);
    toast.success(`Time estimate updated to ${timeEstimate} minutes`);
  };

  const handleSubTaskEdit = () => {
    if (!isCompleted && !task.completed) {
      setIsEditingTitle(true);
      setEditedSubTask(task.sub_task);
    }
  };

  const handleSubTaskSave = () => {
    if (editedSubTask.trim() === "") {
      toast.error("Task title cannot be empty");
      return;
    }

    onUpdateSubTask(task.id, editedSubTask);
    setIsEditingTitle(false);
    toast.success("Task title updated");
  };

  const handleSubTaskCancel = () => {
    setIsEditingTitle(false);
    setEditedSubTask(task.sub_task); // Reset to original value
  };

  const handleSubTaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubTaskSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleSubTaskCancel();
    }
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
        return "importance-badge-low";
      case "Medium":
        return "importance-badge-medium";
      case "High":
        return "importance-badge-high";
      default:
        return "";
    }
  };

  // Render the importance dropdown at the fixed position
  const renderImportanceDropdown = () => {
    if (!showImportanceOptions || isCompleted) return null;

    // Use createPortal to render the dropdown at the body level
    return createPortal(
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
      </div>,
      document.body // Target element for the portal
    );
  };

  return (
    <>
      <div
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        className={cn(
          "task-card relative", // Removed group as handle is always visible
          importanceClass,
          "mb-3 rounded-md border hover:shadow-sm transition-shadow", 
          (task.completed || isCompleted) && "opacity-70 bg-muted/30",
          isDragging && "shadow-xl z-50 opacity-90", // Added slight opacity when dragging
          isDisabled && "bg-muted/20" // Keep visual cue for disabled
        )}
      >
        <div className="flex items-stretch"> {/* Flex container for handle and content */}
          {/* Simplified Drag Handle - always visible */}
          {!isDisabled && (
              <div 
                  {...listeners} // Apply listeners ONLY to the handle
                  className={cn(
                      "px-1.5 flex items-center justify-center",
                      "bg-muted/30 hover:bg-muted/50 transition-colors",
                      "cursor-grab border-r border-border/50",
                      "touch-none"
                  )}
                  aria-label="Drag task"
              >
                  <GripVertical className="h-4 w-4 text-muted-foreground/60" />
              </div>
          )}
          {/* If disabled, render a placeholder to maintain layout */}
          {isDisabled && (
              <div className="px-1.5 flex items-center justify-center border-r border-border/50">
                  <GripVertical className="h-4 w-4 text-muted-foreground/20" />
              </div>
          )}

          {/* Task Content Area */}
          <div className="p-1 flex-grow min-w-0"> { /* Removed pl-4, handle provides space */}
            {/* Main Task Content - Grid Structure */}
            <div
              className={cn(
                "grid gap-x-2.5",
                isEditingTitle ? "grid-cols-[1fr]" : "grid-cols-[auto_1fr]"
              )}
            >
              {/* Column 1: Checkbox - Only show when not editing title */}
              {!isEditingTitle && (
                <div className="flex-shrink-0 mt-0.5">
                  {!isEditingTime ? (
                    <button
                      onClick={handleCompletionToggle}
                      className="flex-shrink-0"
                      disabled={isCompleted}
                      aria-label={
                        isCompleted ? "Task completed" : "Mark as completed"
                      }
                      title={isCompleted ? "Task completed" : "Mark as completed"}
                    >
                      {task.completed || isCompleted ? (
                        <CheckSquare className="h-[18px] w-[18px] text-primary" />
                      ) : (
                        <Square className="h-[18px] w-[18px] text-muted-foreground hover:text-primary hover:border-primary transition-colors" />
                      )}
                    </button>
                  ) : (
                    <div className="w-[18px] h-[18px]"></div>
                  )}
                </div>
              )}

              {/* Column 2: Content and Badges */}
              <div className="min-w-0 relative">
                {/* Task Title Area */}
                <div className="relative pr-5">
                  {isEditingTitle ? (
                    <div className="mb-2">
                      <Input
                        ref={titleInputRef}
                        value={editedSubTask}
                        onChange={(e) => setEditedSubTask(e.target.value)}
                        onKeyDown={handleSubTaskKeyDown}
                        className="w-full h-9 text-xs rounded-md mb-2 border-primary/30 focus-visible:ring-0 focus:outline-none"
                        placeholder="Task title"
                        autoFocus
                      />
                      <Button
                        ref={saveButtonRef}
                        size="sm"
                        className="w-full h-7 text-xs rounded-md bg-primary/90 hover:bg-primary"
                        onClick={handleSubTaskSave}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={
                        task.completed || isCompleted
                          ? "line-through text-muted-foreground"
                          : ""
                      }
                    >
                      <h3
                        className={cn(
                          "font-medium text-sm leading-tight",
                          !isCompleted &&
                            !task.completed &&
                            "hover:text-primary cursor-pointer hover:underline"
                        )}
                        onClick={handleSubTaskEdit}
                      >
                        {task.sub_task}
                      </h3>
                      {/* Only show main_task if not in a group view */}
                      {task.main_task && !inGroupView && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                          {task.main_task}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Delete button - Only show when not editing */}
                  {!isEditingTime && !isEditingTitle && (
                    <button
                      onClick={() => onDelete(task.id)}
                      className="absolute right-0 top-0 text-muted-foreground/40 hover:text-destructive transition-colors hover:bg-muted/20 rounded-sm p-0.5"
                      aria-label="Delete task"
                      title="Delete task"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Time Estimate Slider - Only show when editing */}
                {allowTimeEstimate && isEditingTime && (
                  <div className="mt-2 bg-accent/5 p-3 rounded-md border border-accent/10">
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

                {/* Badges row - using inline-flex and nowrap to prevent wrapping */}
                {(!isEditingTime || !allowTimeEstimate) && !isEditingTitle && (
                  <div className="inline-flex items-center flex-nowrap overflow-x-auto space-x-1.5 mt-1.5 pb-0.5 max-w-full no-scrollbar -ml-7">
                    {/* Importance badge */}
                    <div ref={importanceRef} className="relative flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={`inline-flex items-center h-5 text-xs px-1.5 py-0 rounded-full border-transparent ${
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
                        <span className="ml-0.5">{task.importance}</span>
                        {!isCompleted && (
                          <Edit2 className="h-2.5 w-2.5 ml-0.5 opacity-50" />
                        )}
                      </Badge>
                    </div>

                    {/* Category badge */}
                    {!hideCategory && (
                      <Badge
                        variant="outline"
                        className="inline-flex items-center h-5 text-xs px-1.5 py-0 rounded-full bg-indigo-50/80 text-indigo-600 border-indigo-100 flex-shrink-0"
                        title="Category"
                      >
                        <Tag className="h-2.5 w-2.5 mr-0.5" />
                        {task.category}
                      </Badge>
                    )}

                    {/* Time estimate badge with countdown button */}
                    {task.time_estimate > 0 && !isEditingTime && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={`inline-flex items-center h-5 text-xs px-1.5 py-0 rounded-full bg-blue-50/80 text-blue-600 border-blue-100 ${
                            allowTimeEstimate && !isCompleted
                              ? "cursor-pointer hover:bg-blue-100/70"
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
                          <Clock
                            className="h-2.5 w-2.5 mr-0.5"
                            style={{ color: "#6B7280" }}
                          />
                          <span>{task.time_estimate} min</span>
                          {allowTimeEstimate && !isCompleted && (
                            <Edit2 className="h-2.5 w-2.5 ml-0.5 opacity-50" />
                          )}
                        </Badge>

                        {!isCompleted && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-50/80 hover:bg-blue-100/70 text-blue-600 border-blue-100"
                            onClick={handleOpenCountdown}
                            title="Start countdown timer"
                          >
                            <Timer className="h-2.5 w-2.5" />
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
                          className="inline-flex items-center h-5 text-xs px-1.5 py-0 rounded-full bg-blue-50/80 text-blue-600 cursor-pointer hover:bg-blue-100/70 border-blue-100 flex-shrink-0"
                          onClick={() => setIsEditingTime(true)}
                          title="Add time"
                        >
                          <Clock
                            className="h-2.5 w-2.5 mr-0.5"
                            style={{ color: "#6B7280" }}
                          />
                          <span>Add time</span>
                          <Edit2 className="h-2.5 w-2.5 ml-0.5 opacity-50" />
                        </Badge>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
