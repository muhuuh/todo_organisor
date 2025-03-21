import { useState, useEffect } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, ListChecks, Check } from "lucide-react";
import { useTaskContext } from "@/context/TaskContext";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
});

interface CreateTaskFormProps {
  onSubmit: (task: TaskFormInput) => Promise<void>;
}

const CreateTaskForm = ({ onSubmit }: CreateTaskFormProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mainTaskOpen, setMainTaskOpen] = useState(false);
  const [mainTaskOptions, setMainTaskOptions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const { tasks } = useTaskContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      main_task: "",
      sub_task: "",
      category: "",
      importance: "Medium" as ImportanceLevel,
      bucket: "Short-Term" as TaskBucketType,
    },
  });

  // Extract unique main tasks from existing tasks
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const uniqueMainTasks = Array.from(
        new Set(
          tasks
            .map((task) => task.main_task)
            .filter((mainTask): mainTask is string => !!mainTask)
        )
      );
      setMainTaskOptions(uniqueMainTasks);
    }
  }, [tasks]);

  // Filter main task options based on input
  const filteredMainTasks = mainTaskOptions.filter((option) =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const taskInput: TaskFormInput = {
      main_task: values.main_task,
      sub_task: values.sub_task,
      category: values.category,
      importance: values.importance,
      bucket: values.bucket,
    };

    await onSubmit(taskInput);
    form.reset();
    setIsFormOpen(false);
  };

  return (
    <div className="mb-8">
      {!isFormOpen ? (
        <Button
          onClick={() => setIsFormOpen(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" /> Create New Task
        </Button>
      ) : (
        <div className="glass p-4 rounded-lg animate-scale-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">New Task</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFormOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

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
                    <FormLabel>Project / Main Task</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="What is the overall task or project?"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setInputValue(e.target.value);
                            if (e.target.value.length > 0) {
                              setMainTaskOpen(true);
                            } else {
                              setMainTaskOpen(false);
                            }
                          }}
                        />
                      </FormControl>

                      {/* Only show suggestions in a popover without restricting input */}
                      {mainTaskOpen && filteredMainTasks.length > 0 && (
                        <div className="absolute top-full left-0 z-10 w-full mt-1 bg-background rounded-md border shadow-md">
                          <div className="p-1 max-h-[200px] overflow-y-auto">
                            {filteredMainTasks.map((option) => (
                              <div
                                key={option}
                                className="flex items-center px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-muted"
                                onClick={() => {
                                  form.setValue("main_task", option);
                                  setMainTaskOpen(false);
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
                    <FormDescription>
                      Tasks under the same project will be grouped together
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sub_task"
                render={({ field }) => (
                  <FormItem className="pl-4 border-l-2 border-primary/20">
                    <FormLabel>
                      <div className="flex items-center gap-1">
                        <ListChecks className="h-4 w-4" />
                        Subtask
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What specific step needs to be done?"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This is what you'll actually work on
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Work, Personal, Health..."
                        {...field}
                      />
                    </FormControl>
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
                      <FormLabel>Importance</FormLabel>
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
                          <SelectItem
                            value="Low"
                            className="importance-low-text"
                          >
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
                      <FormLabel>Initial Bucket</FormLabel>
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

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Task</Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
};

export default CreateTaskForm;
