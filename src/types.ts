export type Frequency = 'day' | 'week' | 'month' | 'year';
export type Priority = 'low' | 'medium' | 'high';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'any';

export interface Task {
  id: string;
  title: string;
  frequency: Frequency;
  interval: number; // The 'N' in "Every N <time unit>"
  weekDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  months?: number[]; // 0 = January, 1 = February, etc.
  startDate?: string; // ISO date string for the anchor date
  preferredTime: TimeOfDay;
  priority: Priority;
  lastCompleted?: string; // ISO date string
  nextDue: string; // ISO date string
  streak: number;
  createdAt: string;
}

export type TaskDefinition = Omit<Task, 'nextDue' | 'streak' | 'lastCompleted'>;

export interface HistoryEntry {
  taskId: string;
  taskTitle: string;
  completedAt: string;
  nextDue: string;
  streak: number;
}
