
import { useState } from 'react';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  Trash2, 
  Archive, 
  MoreHorizontal,
  CheckCircle,
  Tag,
  Briefcase 
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface TaskCardProps {
  task: Task;
  allowTimeEstimate?: boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUpdateTimeEstimate: (id: string, estimate: number) => void;
}

const TaskCard = ({
  task,
  allowTimeEstimate = false,
  onDragStart,
  onDelete,
  onArchive,
  onUpdateTimeEstimate,
}: TaskCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [timeEstimate, setTimeEstimate] = useState(task.time_estimate || 0);
  const [showDetails, setShowDetails] = useState(false);
  
  const handleDragStart = (e: React.DragEvent) => {
    e.currentTarget.classList.add('task-dragging');
    onDragStart(e, task);
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('task-dragging');
  };
  
  const handleTimeEstimateSubmit = () => {
    onUpdateTimeEstimate(task.id, timeEstimate);
    setIsEditing(false);
  };
  
  const importanceClass = `importance-${task.importance.toLowerCase()}`;
  
  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`task-card ${importanceClass} animate-scale-in mb-3`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium text-sm">{task.sub_task}</h3>
            {task.main_task && (
              <p className="text-xs text-muted-foreground mt-1">{task.main_task}</p>
            )}
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
              {allowTimeEstimate && (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  Set Time Estimate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onArchive(task.id)}>
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(task.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center mt-2 gap-2">
          <span className="inline-flex items-center text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            <Tag className="h-3 w-3 mr-1" /> {task.category}
          </span>
          
          {task.time_estimate && (
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
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
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
            
            {task.time_estimate && (
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
                <div className={`w-3 h-3 rounded-full ${
                  task.importance === 'Low' 
                    ? 'bg-importance-low' 
                    : task.importance === 'Medium' 
                    ? 'bg-importance-medium' 
                    : 'bg-importance-high'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium">Current Bucket</p>
                <p className="text-sm">{task.bucket}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onArchive(task.id)}
              className="flex items-center gap-1"
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>
            
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
