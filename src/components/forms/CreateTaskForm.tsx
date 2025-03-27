import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskFormInput, TaskBucketType, ImportanceLevel } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ListChecks,
  Check,
  Briefcase,
  Tag,
  AlertCircle,
  Clock,
  Timer,
} from "lucide-react";
import { useTaskContext } from "@/context/TaskContext";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const formSchema = z.object({
  main_task: z.string().min(1, { message: "Project/Main task is required" }),
  sub_task: z.string().min(1, { message: "Subtask is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  importance: z.enum(["Low", "Medium", "High"]),
  bucket: z.enum([
    "Short-Term",
    "Mid-Term",
    "Long-Term",
    "Today",
    "Tomorrow",
    "This Week",
  ]),
  time_estimate: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
});

interface CreateTaskFormProps {
  onSubmit: (task: TaskFormInput) => Promise<void>;
}

const CreateTaskForm = ({ onSubmit }: CreateTaskFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // Instead of tracking "open" state, track if user has explicitly interacted
  const [hasClickedMainTask, setHasClickedMainTask] = useState(false);
  const [hasClickedCategory, setHasClickedCategory] = useState(false);
  const [mainTaskOptions, setMainTaskOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [mainTaskInput, setMainTaskInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [timeEstimate, setTimeEstimate] = useState(0);

  const mainTaskRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const { tasks } = useTaskContext();

  // Reset all states when modal opens/closes
  useEffect(() => {
    setHasClickedMainTask(false);
    setHasClickedCategory(false);
    setMainTaskInput("");
    setCategoryInput("");
    setTimeEstimate(0);
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      main_task: "",
      sub_task: "",
      category: "",
      importance: "Medium" as ImportanceLevel,
      bucket: "Short-Term" as TaskBucketType,
      time_estimate: undefined,
    },
  });

  // Track the time estimate value from form
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "time_estimate") {
        const newTime = value.time_estimate || 0;
        setTimeEstimate(newTime);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Update form when time estimate changes from slider
  useEffect(() => {
    form.setValue("time_estimate", timeEstimate || undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [timeEstimate, form]);

  // Extract unique main tasks and categories from existing tasks
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      // Extract main tasks
      const uniqueMainTasks = Array.from(
        new Set(
          tasks
            .map((task) => task.main_task)
            .filter((mainTask): mainTask is string => !!mainTask)
        )
      );
      setMainTaskOptions(uniqueMainTasks);

      // Extract categories
      const uniqueCategories = Array.from(
        new Set(
          tasks
            .map((task) => task.category)
            .filter((category): category is string => !!category)
        )
      );
      setCategoryOptions(uniqueCategories);
    }
  }, [tasks]);

  // Filter main task options based on input
  const filteredMainTasks = mainTaskOptions.filter((option) =>
    option.toLowerCase().includes(mainTaskInput.toLowerCase())
  );

  // Filter category options based on input
  const filteredCategories = categoryOptions.filter((option) =>
    option.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const taskInput: TaskFormInput = {
      main_task: values.main_task,
      sub_task: values.sub_task,
      category: values.category,
      importance: values.importance,
      bucket: values.bucket,
      time_estimate: values.time_estimate,
    };

    await onSubmit(taskInput);
    form.reset();
    setIsOpen(false);
  };

  // Handle selection of a main task option
  const handleMainTaskSelect = (option: string) => {
    form.setValue("main_task", option);
    setMainTaskInput(option);
    setHasClickedMainTask(false);
    mainTaskRef.current?.blur();
  };

  // Handle selection of a category option
  const handleCategorySelect = (option: string) => {
    form.setValue("category", option);
    setCategoryInput(option);
    setHasClickedCategory(false);
    categoryRef.current?.blur();
  };

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setTimeEstimate(value[0]);
  };

  // Display either all options (if input is empty) or filtered ones (if typing)
  const getMainTaskDisplayOptions = () => {
    if (mainTaskInput.length === 0) return mainTaskOptions;
    return filteredMainTasks;
  };

  const getCategoryDisplayOptions = () => {
    if (categoryInput.length === 0) return categoryOptions;
    return filteredCategories;
  };

  // We'll use mousedown instead of click to capture the event before blur
  const handleInputMouseDown = (inputType: "main" | "category") => {
    if (inputType === "main") {
      setHasClickedMainTask(true);
    } else {
      setHasClickedCategory(true);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full mb-8" variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Create New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="main_task"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    Project / Main Task
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        ref={mainTaskRef}
                        placeholder="What is the overall task or project?"
                        autoComplete="off"
                        {...field}
                        onMouseDown={() => handleInputMouseDown("main")}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setMainTaskInput(e.target.value);
                          // Enable dropdown on typing
                          if (!hasClickedMainTask) {
                            setHasClickedMainTask(true);
                          }
                        }}
                        onBlur={() => {
                          // Delay closing to allow for selection
                          setTimeout(() => {
                            setHasClickedMainTask(false);
                          }, 200);
                        }}
                      />
                    </FormControl>

                    {/* Only show dropdown when user has explicitly interacted with input */}
                    {hasClickedMainTask && mainTaskOptions.length > 0 && (
                      <div className="absolute top-full left-0 z-10 w-full mt-1 bg-background rounded-md border shadow-md">
                        <div className="p-1 max-h-[200px] overflow-y-auto">
                          {getMainTaskDisplayOptions().map((option) => (
                            <div
                              key={option}
                              className="flex items-center px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-muted"
                              onMouseDown={(e) => {
                                // Prevent blur handler from firing before click
                                e.preventDefault();
                                handleMainTaskSelect(option);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === option
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sub_task"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <ListChecks className="h-4 w-4" />
                    Subtask
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What specific step needs to be done?"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" />
                    Category
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        ref={categoryRef}
                        placeholder="Work, Personal, Health..."
                        autoComplete="off"
                        {...field}
                        onMouseDown={() => handleInputMouseDown("category")}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setCategoryInput(e.target.value);
                          // Enable dropdown on typing
                          if (!hasClickedCategory) {
                            setHasClickedCategory(true);
                          }
                        }}
                        onBlur={() => {
                          // Delay closing to allow for selection
                          setTimeout(() => {
                            setHasClickedCategory(false);
                          }, 200);
                        }}
                      />
                    </FormControl>

                    {/* Category suggestions dropdown */}
                    {hasClickedCategory && categoryOptions.length > 0 && (
                      <div className="absolute top-full left-0 z-10 w-full mt-1 bg-background rounded-md border shadow-md">
                        <div className="p-1 max-h-[200px] overflow-y-auto">
                          {getCategoryDisplayOptions().map((option) => (
                            <div
                              key={option}
                              className="flex items-center px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-muted"
                              onMouseDown={(e) => {
                                // Prevent blur handler from firing before click
                                e.preventDefault();
                                handleCategorySelect(option);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === option
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time_estimate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Timer className="h-4 w-4" />
                    Time Estimate (minutes)
                  </FormLabel>
                  <div className="bg-accent/5 p-3 rounded-md border border-accent/10">
                    <div className="flex items-center gap-2.5">
                      <Slider
                        className="flex-grow"
                        min={0}
                        max={120}
                        step={5}
                        value={[timeEstimate]}
                        onValueChange={handleSliderChange}
                      />
                      <FormControl>
                        <Input
                          ref={timeInputRef}
                          type="number"
                          min={0}
                          className="w-16 h-8 text-xs text-center"
                          value={timeEstimate || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setTimeEstimate(value);
                            field.onChange(value === 0 ? undefined : value);
                          }}
                        />
                      </FormControl>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="importance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />
                      Importance
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="importance-select">
                          <SelectValue placeholder="Select importance" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low" className="importance-low-text">
                          Low
                        </SelectItem>
                        <SelectItem
                          value="Medium"
                          className="importance-medium-text"
                        >
                          Medium
                        </SelectItem>
                        <SelectItem
                          value="High"
                          className="importance-high-text"
                        >
                          High
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bucket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Initial Bucket
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bucket" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Short-Term">Short-Term</SelectItem>
                        <SelectItem value="Mid-Term">Mid-Term</SelectItem>
                        <SelectItem value="Long-Term">Long-Term</SelectItem>
                        <SelectItem value="Today">Today</SelectItem>
                        <SelectItem value="Tomorrow">Tomorrow</SelectItem>
                        <SelectItem value="This Week">This Week</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskForm;
