
import { Task, ChartData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface VisualSummaryProps {
  tasks: Task[];
}

const VisualSummary = ({ tasks }: VisualSummaryProps) => {
  // Skip rendering if no tasks with time estimates
  if (!tasks.some(task => task.time_estimate)) {
    return (
      <Card className="col-span-3 animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg">Visual Summary</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">
            Add time estimates to tasks to see visualizations here
          </p>
        </CardContent>
      </Card>
    );
  }

  // Helper function to prepare data for charts
  const prepareChartData = (
    groupingFn: (task: Task) => string,
    colorMap: Record<string, string>
  ) => {
    const groupedData: Record<string, number> = {};
    
    tasks.forEach(task => {
      if (!task.time_estimate) return;
      
      const key = groupingFn(task);
      groupedData[key] = (groupedData[key] || 0) + task.time_estimate;
    });
    
    return Object.entries(groupedData).map(([name, value]) => ({
      name,
      value,
      color: colorMap[name] || '#9ca3af',
    }));
  };
  
  // Prepare data by category
  const categoryData = prepareChartData(
    (task) => task.category,
    {
      Work: '#3b82f6',
      Personal: '#ec4899',
      Health: '#10b981',
      Study: '#8b5cf6',
      Finance: '#f59e0b',
    }
  );
  
  // Prepare data by importance
  const importanceData = prepareChartData(
    (task) => task.importance,
    {
      Low: '#22c55e',
      Medium: '#f97316',
      High: '#ef4444',
    }
  );
  
  // Prepare data by timeframe
  const timeframeData = prepareChartData(
    (task) => task.bucket,
    {
      Today: '#3b82f6',
      Tomorrow: '#8b5cf6',
      'This Week': '#ec4899',
      'Short-Term': '#10b981',
      'Mid-Term': '#f59e0b',
      'Long-Term': '#ef4444',
    }
  );
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Category Chart */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-base">Time by Category</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => 
                  `${name}: ${Math.round(percent * 100)}%`
                }
                labelLine={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} min`, 'Time']} 
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Importance Chart */}
      <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="text-base">Time by Importance</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={importanceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => 
                  `${name}: ${Math.round(percent * 100)}%`
                }
                labelLine={false}
              >
                {importanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} min`, 'Time']} 
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Timeframe Chart */}
      <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <CardHeader>
          <CardTitle className="text-base">Time by Timeframe</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timeframeData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip formatter={(value: number) => [`${value} min`, 'Time']} />
              <Bar dataKey="value" barSize={20}>
                {timeframeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisualSummary;
