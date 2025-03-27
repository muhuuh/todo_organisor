import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  PlayCircle,
  PauseCircle,
  RotateCcw,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCountdownProps {
  isOpen: boolean;
  onClose: () => void;
  taskName: string;
  totalMinutes: number;
}

const TaskCountdown = ({
  isOpen,
  onClose,
  taskName,
  totalMinutes,
}: TaskCountdownProps) => {
  const [secondsLeft, setSecondsLeft] = useState(totalMinutes * 60);
  const [isPaused, setIsPaused] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const totalSeconds = useRef(totalMinutes * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const progressPercentage = Math.max(
    0,
    ((totalSeconds.current - secondsLeft) / totalSeconds.current) * 100
  );

  // Start/reset timer when opening modal
  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(totalMinutes * 60);
      totalSeconds.current = totalMinutes * 60;
      setIsPaused(true);
      setIsComplete(false);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, totalMinutes]);

  // Handle timer logic
  useEffect(() => {
    if (!isPaused && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsComplete(true);
            setIsPaused(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, secondsLeft]);

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetTimer = () => {
    setSecondsLeft(totalMinutes * 60);
    setIsPaused(true);
    setIsComplete(false);
  };

  // Get color based on time remaining
  const getTimerColor = () => {
    const percentageLeft = (secondsLeft / totalSeconds.current) * 100;
    if (percentageLeft <= 20) return "text-destructive";
    if (percentageLeft <= 50) return "text-amber-500";
    return "text-primary";
  };

  // Get progress color based on time remaining
  const getProgressColor = () => {
    const percentageLeft = (secondsLeft / totalSeconds.current) * 100;
    if (percentageLeft <= 20) return "bg-destructive";
    if (percentageLeft <= 50) return "bg-amber-500";
    return "bg-primary";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-background to-background/95 border-border/50 backdrop-blur-sm">
        <div className="flex flex-col items-center py-7">
          <h3 className="font-medium text-lg mb-8 text-center max-w-[80%]">
            {taskName}
          </h3>

          <div className="relative w-40 h-40 flex items-center justify-center mb-8">
            {/* Circular background */}
            <div className="absolute inset-0 rounded-full bg-accent/10 border border-border/40"></div>

            {/* Countdown display */}
            <div
              className={cn(
                "text-5xl font-bold tracking-tight transition-colors",
                getTimerColor()
              )}
            >
              {formatTime(secondsLeft)}
            </div>

            {/* Time finished alert */}
            {isComplete && (
              <div className="absolute -bottom-9 flex items-center text-destructive animate-pulse">
                <AlertCircle className="h-4 w-4 mr-1.5" />
                <span className="text-sm font-medium">Time's up!</span>
              </div>
            )}
          </div>

          <Progress
            value={progressPercentage}
            className={cn("w-full h-2 mb-1", getProgressColor())}
          />
          <div className="text-xs text-muted-foreground/80 mt-1 mb-8">
            Initial time: {totalMinutes} min
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full border-border/60 bg-muted/30 hover:bg-muted/50 shadow-sm"
              onClick={resetTimer}
              title="Reset timer"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>

            <Button
              variant={isPaused ? "default" : "secondary"}
              size="icon"
              className={cn(
                "h-14 w-14 rounded-full transition-transform active:scale-95 shadow-md",
                !isPaused && "bg-primary/90"
              )}
              onClick={togglePause}
              disabled={isComplete}
              title={isPaused ? "Start timer" : "Pause timer"}
            >
              {isPaused ? (
                <PlayCircle className="h-7 w-7" />
              ) : (
                <PauseCircle className="h-7 w-7" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full border-border/60 bg-muted/30 hover:bg-muted/50 shadow-sm"
              onClick={onClose}
              title="Close timer"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskCountdown;
