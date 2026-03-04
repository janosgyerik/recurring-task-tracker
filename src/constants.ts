import { TaskDefinition } from './types';
import { startOfDay, setYear } from 'date-fns';

const today = startOfDay(new Date()).toISOString();
const currentYear = new Date().getFullYear();

// Helper to create a date in the current year
const dateInYear = (month: number, day: number) => {
  return new Date(currentYear, month - 1, day).toISOString();
};

export const WEEK_DAYS_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export const INITIAL_TASKS: TaskDefinition[] = [
  {
    id: 'call-loved-one',
    title: 'Call a Loved One',
    frequency: 'week',
    interval: 1,
    preferredTime: 'morning',
    priority: 'high',
    weekDays: [0], // Sunday
    createdAt: today
  },
  {
    id: 'clean-coffee-machine',
    title: 'Deep Clean Coffee Machine',
    frequency: 'month',
    interval: 1,
    preferredTime: 'morning',
    priority: 'medium',
    weekDays: [6], // Saturday
    createdAt: today
  },
  {
    id: 'replace-toothbrush',
    title: 'Replace Toothbrush',
    frequency: 'month',
    interval: 3,
    preferredTime: 'any',
    priority: 'low',
    createdAt: today
  }
];
