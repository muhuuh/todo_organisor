import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

  // Calculate progress directly
  const calculateProgress = () => {
    // If paused at initial state, return 0
    if (isPaused && secondsLeft === totalSeconds.current) {
      return 0;
    }

    // Calculate elapsed time as percentage
    const elapsed = totalSeconds.current - secondsLeft;
    return Math.min(100, Math.max(0, (elapsed / totalSeconds.current) * 100));
  };

  // Get progress color
  const getProgressColor = () => {
    const progress = calculateProgress();
    if (progress >= 80) return "bg-destructive";
    if (progress >= 50) return "bg-amber-500";
    return "bg-primary";
  };

  // Calculate progress width style
  const progressWidth = {
    width: `${calculateProgress()}%`,
  };

  // Get timer ring color class
  const getTimerRingColorClass = () => {
    const percentageLeft = (secondsLeft / totalSeconds.current) * 100;
    if (percentageLeft <= 20) return "border-destructive/30";
    if (percentageLeft <= 50) return "border-amber-500/30";
    return "border-primary/20";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md bg-gradient-to-b from-background to-background/95 border-border/50 backdrop-blur-sm"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center py-7">
          <h3 className="font-medium text-lg mb-8 text-center max-w-[80%]">
            {taskName}
          </h3>

          <div className="relative w-44 h-44 flex items-center justify-center mb-8">
            {/* Circular background with more distinct border */}
            <div
              className={cn(
                "absolute inset-0 rounded-full bg-accent/5 border-2 shadow-inner",
                getTimerRingColorClass()
              )}
            ></div>

            {/* Simplified inner layer for better contrast */}
            <div className="absolute inset-3 rounded-full bg-muted/30"></div>

            {/* Additional contrasting layer for text background */}
            <div className="absolute inset-[25%] rounded-full bg-background"></div>

            {/* Pulse animation when active - made lighter */}
            {!isPaused && !isComplete && (
              <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse"></div>
            )}

            {/* Countdown display with enhanced visibility */}
            <div
              className={cn(
                "relative z-10 text-6xl font-bold tracking-tight text-foreground",
                getTimerColor()
              )}
            >
              {formatTime(secondsLeft)}
            </div>

            {/* Time finished alert */}
            {isComplete && (
              <div className="absolute -bottom-10 flex items-center text-destructive animate-pulse">
                <AlertCircle className="h-4 w-4 mr-1.5" />
                <span className="text-sm font-medium">Time's up!</span>
              </div>
            )}
          </div>

          {/* Enhanced progress bar with better contrast */}
          <div className="w-full h-3 mb-1 bg-secondary/40 rounded-full overflow-hidden shadow-inner">
            <div
              className={cn(
                "h-full transition-all ease-linear duration-1000 rounded-full shadow-sm",
                getProgressColor()
              )}
              style={progressWidth}
            />
          </div>

          <div className="text-xs text-muted-foreground/80 mt-1.5 mb-8">
            Initial time: {totalMinutes} min
          </div>

          <div className="flex gap-5">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full border-border/60 bg-muted/20 hover:bg-muted/40 shadow-sm transition-colors"
              onClick={resetTimer}
              title="Reset timer"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>

            <Button
              variant={isPaused ? "default" : "secondary"}
              size="icon"
              className={cn(
                "h-14 w-14 rounded-full transition-all active:scale-95 shadow-md",
                isPaused
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-secondary hover:bg-secondary/90",
                !isComplete && !isPaused && "animate-subtle-pulse"
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
              className="h-11 w-11 rounded-full border-border/60 bg-muted/20 hover:bg-muted/40 shadow-sm transition-colors"
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
