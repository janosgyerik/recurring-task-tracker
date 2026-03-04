import { Task, TimeOfDay, Priority, Frequency } from '../types';
import { parseISO } from 'date-fns';

const timeOfDayOrder: Record<TimeOfDay, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
  any: 3,
};

const priorityOrder: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const frequencyOrder: Record<Frequency, number> = {
  day: 0,
  week: 1,
  month: 2,
  year: 3,
};

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // 1. Due date (older first)
    const dateA = parseISO(a.nextDue).getTime();
    const dateB = parseISO(b.nextDue).getTime();
    if (dateA !== dateB) return dateA - dateB;

    // 2. Preferred time
    const timeA = timeOfDayOrder[a.preferredTime];
    const timeB = timeOfDayOrder[b.preferredTime];
    if (timeA !== timeB) return timeA - timeB;

    // 3. Priority
    const priorityA = priorityOrder[a.priority];
    const priorityB = priorityOrder[b.priority];
    if (priorityA !== priorityB) return priorityA - priorityB;

    // 4. Repeat unit
    const freqA = frequencyOrder[a.frequency];
    const freqB = frequencyOrder[b.frequency];
    if (freqA !== freqB) return freqA - freqB;

    // 5. Repeat count (ascending)
    return a.interval - b.interval;
  });
}
