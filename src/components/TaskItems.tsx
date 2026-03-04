import React from 'react';
import { Task } from '../types';
import { TaskCard } from './TaskCard';

interface TaskItemsProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onUndo?: (id: string) => void;
  onEdit: (task: Task) => void;
  emptyMessage?: string;
}

export function TaskItems({ tasks, onComplete, onUndo, onEdit, emptyMessage = "No tasks found." }: TaskItemsProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onComplete={onComplete}
          onUndo={onUndo}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
