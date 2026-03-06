import { Task, TimeOfDay, Priority, Frequency } from '../types';
import { parseISO, addDays, addWeeks, addMonths, addYears, startOfDay, getDay, nextDay, getMonth, setMonth, setDate, format, startOfWeek, isSameDay, subDays } from 'date-fns';

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

export function calculateNextDue(lastCompleted: Date, frequency: Frequency, weekDays?: number[], months?: number[], interval: number = 1): Date {
  const baseDate = startOfDay(lastCompleted);

  // 1. Specific Months (e.g. "April, October")
  if (months && months.length > 0) {
    const currentMonth = getMonth(baseDate);
    const sortedMonths = [...months].sort((a, b) => a - b);
    
    // Find next month strictly after current month
    const nextMonthIndex = sortedMonths.findIndex(m => m > currentMonth);
    
    let targetDate;
    if (nextMonthIndex !== -1) {
      // Found later this year
      targetDate = setMonth(setDate(baseDate, 1), sortedMonths[nextMonthIndex]);
    } else {
      // Wrap to next interval of years
      const yearIncrement = frequency === 'year' ? interval : 1;
      targetDate = addYears(setMonth(setDate(baseDate, 1), sortedMonths[0]), yearIncrement);
    }

    // Now apply weekday constraint if exists
    if (weekDays && weekDays.length > 0) {
       const sortedDays = [...weekDays].sort((a, b) => a - b);
       // Find first occurrence of weekday in that month
       let d = setDate(targetDate, 1);
       while (!sortedDays.includes(getDay(d))) {
         d = addDays(d, 1);
       }
       return d;
    }
    
    return targetDate;
  }
  
  // 2. Weekdays (e.g. "Mon, Wed, Fri")
  if (weekDays && weekDays.length > 0) {
    const sortedDays = [...weekDays].sort((a, b) => a - b);
    const currentDay = getDay(baseDate);
    
    // Find next day in the list for the current week
    const nextDayIndex = sortedDays.findIndex(d => d > currentDay);
    
    if (nextDayIndex !== -1) {
      // Found a day later in the current week
      return nextDay(baseDate, sortedDays[nextDayIndex] as 0|1|2|3|4|5|6);
    } else {
      // Wrap around to the next interval
      const firstPreferredDay = sortedDays[0] as 0|1|2|3|4|5|6;
      let nextIntervalStart = baseDate;

      switch (frequency) {
        case 'day':
          nextIntervalStart = addDays(baseDate, interval);
          break;
        case 'week':
          nextIntervalStart = addWeeks(startOfWeek(baseDate), interval);
          break;
        case 'month':
          nextIntervalStart = addMonths(baseDate, interval);
          break;
        case 'year':
          nextIntervalStart = addYears(baseDate, interval);
          break;
      }

      // If the start of the next interval is the preferred day, return it.
      // Otherwise, find the next occurrence of that day.
      if (getDay(nextIntervalStart) === firstPreferredDay) {
        return nextIntervalStart;
      } else {
        return nextDay(nextIntervalStart, firstPreferredDay);
      }
    }
  }

  // 3. Standard Frequency
  switch (frequency) {
    case 'day':
      return addDays(baseDate, interval);
    case 'week':
      return addWeeks(baseDate, interval);
    case 'month':
      return addMonths(baseDate, interval);
    case 'year':
      return addYears(baseDate, interval);
    default:
      return addDays(baseDate, interval);
  }
}

export function formatRecurrence(task: Task): string {
  if (task.months && task.months.length > 0) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return task.months.map(m => monthNames[m]).join(', ');
  }

  if (task.weekDays && task.weekDays.length > 0) {
    const dayNames = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    return task.weekDays.map(d => dayNames[d]).join(', ');
  }

  const interval = task.interval || 1;
  if (interval === 1) {
    switch (task.frequency) {
      case 'day': return 'Daily';
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case 'year': return 'Annually';
      default: return 'Daily';
    }
  }

  return `Every ${interval} ${task.frequency}${interval > 1 ? 's' : ''}`;
}
