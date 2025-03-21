import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskFormInput, TaskBucketType, ImportanceLevel } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

const formSchema = z.object({
  sub_task: z.string().min(1, { message: 'Sub-task is required' }),
  main_task: z.string().optional(),
  category: z.string().min(1, { message: 'Category is required' }),
  importance: z.enum(['Low', 'Medium', 'High']),
  bucket: z.enum(['Short-Term', 'Mid-Term', 'Long-Term', 'Today', 'Tomorrow', 'This Week'])
});

interface CreateTaskFormProps {
  onSubmit: (task: TaskFormInput) => Promise<void>;
}

const CreateTaskForm = ({ onSubmit }: CreateTaskFormProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sub_task: '',
      main_task: '',
      category: '',
      importance: 'Medium' as ImportanceLevel,
      bucket: 'Short-Term' as TaskBucketType,
    },
  });
  
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const taskInput: TaskFormInput = {
      sub_task: values.sub_task,
      main_task: values.main_task,
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
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="sub_task"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task</FormLabel>
                    <FormControl>
                      <Input placeholder="What needs to be done?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="main_task"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Task (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Part of which larger task?" {...field} />
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
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Work, Personal, Health..." {...field} />
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
                          <SelectTrigger>
                            <SelectValue placeholder="Select importance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
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
