# Task Organizer App - Migration Guide

This guide explains the changes made to the Task Organizer app to implement the new task organization system that groups tasks by main task/project.

## Database Changes

The application now has a new field in the `tasks` table:

- `completed` (boolean): Indicates whether a subtask has been completed

To add this field to your existing Supabase database:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Paste the contents of the `src/migrations/add_completed_field.sql` file
4. Click "Run" to execute the migration

## New Features

### 1. Tasks Organized by Project/Main Task

Tasks are now organized hierarchically:

- **Main Tasks/Projects**: These are the parent tasks that group related subtasks
- **Subtasks**: These are individual actionable items that belong to a main task

In the task buckets, subtasks are now grouped under their parent main task for better organization.

### 2. Task Completion Status

You can now mark subtasks as completed by clicking the circle icon next to them. Completed tasks are visually distinguished with strikethrough text and reduced opacity.

### 3. Editable Importance Levels

Task importance can now be edited after creation through the dropdown menu. Importance levels are visually distinguished by both color and border styling:

- **Low**: Green
- **Medium**: Orange
- **High**: Red

### 4. Improved UI and User Experience

- More intuitive task creation form with clearer hierarchy
- Collapsible task groups for better organization
- Visual cues for task status and importance
- Improved drag and drop between buckets
- Better color coding and visual hierarchy

## How to Use

1. **Creating Tasks**:

   - Click "Create New Task"
   - Enter a main task/project name
   - Add a specific subtask
   - Choose category, importance, and initial bucket
   - Click "Create Task"

2. **Managing Tasks**:

   - **Mark as Complete**: Click the circle icon next to a subtask
   - **Change Importance**: Use the dropdown menu and select "Set Importance"
   - **Move to Bucket**: Drag and drop tasks to a different bucket
   - **Set Time Estimate**: For time-sensitive buckets, set time estimates
   - **View Details**: Click "View Details" from the dropdown menu
   - **Delete/Archive**: Options available in the dropdown menu

3. **Organizing by Main Task**:
   - Tasks with the same main task will automatically be grouped
