import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
    if (percentageLeft <= 50) return "text-warning";
    return "text-primary";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Task Timer</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          <h3 className="font-medium text-lg mb-6 text-center">{taskName}</h3>

          <div className="relative w-36 h-36 flex items-center justify-center mb-6">
            {/* Circular progress background */}
            <div className="absolute inset-0 rounded-full bg-accent/10"></div>

            {/* Countdown text */}
            <div className={cn("text-4xl font-bold", getTimerColor())}>
              {formatTime(secondsLeft)}
            </div>

            {/* Time finished alert */}
            {isComplete && (
              <div className="absolute -bottom-8 flex items-center text-destructive">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Time's up!</span>
              </div>
            )}
          </div>

          <Progress value={progressPercentage} className="w-full h-2" />

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={resetTimer}
              title="Reset timer"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>

            <Button
              variant={isPaused ? "default" : "secondary"}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={togglePause}
              disabled={isComplete}
              title={isPaused ? "Start timer" : "Pause timer"}
            >
              {isPaused ? (
                <PlayCircle className="h-6 w-6" />
              ) : (
                <PauseCircle className="h-6 w-6" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={onClose}
              title="Close timer"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Estimated: {totalMinutes} min
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskCountdown;
