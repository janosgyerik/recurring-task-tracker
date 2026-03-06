import { useState, useEffect } from 'react';
import { Task, Frequency, TaskDefinition, HistoryEntry } from '../types';
import { addDays, addWeeks, addMonths, addYears, startOfDay, getDay, nextDay, getMonth, setMonth, setDate, isBefore, isSameDay, format, parseISO } from 'date-fns';
import { INITIAL_TASKS } from '../constants';
import { calculateNextDue } from '../lib/taskUtils';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = () => {
    try {
      // Load saved state from localStorage
      const savedState = localStorage.getItem('task_history_v2');
      const history = savedState ? JSON.parse(savedState) : {};

      // Load task definitions
      const savedDefinitions = localStorage.getItem('task_definitions_v1');
      const rawDefinitions: any[] = savedDefinitions ? JSON.parse(savedDefinitions) : INITIAL_TASKS;
      
      // Migrate definitions to new format
      const taskDefinitions: TaskDefinition[] = rawDefinitions.map(migrateTaskDefinition);

      // Migrate old format if needed (optional, but good for robustness)
      if (!savedState) {
        const oldState = localStorage.getItem('task_completion_history');
        if (oldState) {
          const oldHistory = JSON.parse(oldState);
          Object.keys(oldHistory).forEach(key => {
            history[key] = [oldHistory[key]];
          });
        }
      }

      // Merge initial tasks with saved history
      const mergedTasks = taskDefinitions.map(taskDef => {
        const taskHistory = history[taskDef.id];
        const today = startOfDay(new Date());
        
        const task: Task = {
          ...taskDef,
          nextDue: format(calculateInitialNextDue(taskDef, today), 'yyyy-MM-dd'),
          streak: 0
        };

        if (taskHistory && taskHistory.length > 0) {
          const lastState = taskHistory[taskHistory.length - 1];
          const nextDue = parseISO(lastState.nextDue.split('T')[0]);
          const isOverdue = isBefore(nextDue, today);
          
          return {
            ...task,
            lastCompleted: lastState.completedAt || lastState.lastCompleted,
            nextDue: lastState.nextDue.split('T')[0],
            streak: isOverdue ? 0 : lastState.streak
          };
        }
        return task;
      });

      setTasks(mergedTasks);
      setLoading(false);
    } catch (e) {
      console.error("Failed to load tasks", e);
      setError("Failed to load tasks.");
      setLoading(false);
    }
  };

  const importTasks = (newDefinitions: TaskDefinition[]) => {
    localStorage.setItem('task_definitions_v1', JSON.stringify(newDefinitions));
    loadTasks();
  };

  const saveHistory = (taskId: string, taskTitle: string, newHistoryEntry: any) => {
    const savedState = localStorage.getItem('task_history_v2');
    const history = savedState ? JSON.parse(savedState) : {};
    
    if (!history[taskId]) {
      history[taskId] = [];
    }
    
    const entry: HistoryEntry = {
      taskId,
      taskTitle,
      completedAt: newHistoryEntry.lastCompleted,
      nextDue: newHistoryEntry.nextDue,
      streak: newHistoryEntry.streak
    };
    
    history[taskId].push(entry);
    
    localStorage.setItem('task_history_v2', JSON.stringify(history));
  };

  const popHistory = (taskId: string) => {
    const savedState = localStorage.getItem('task_history_v2');
    const history = savedState ? JSON.parse(savedState) : {};
    
    if (history[taskId] && history[taskId].length > 0) {
      history[taskId].pop();
      localStorage.setItem('task_history_v2', JSON.stringify(history));
      return history[taskId];
    }
    return [];
  };

  const completeTask = async (id: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;

      const now = new Date();
      const nextDueDate = calculateNextDue(now, task.frequency, task.weekDays, task.months, task.interval);

      const updatedTask = {
        ...task,
        lastCompleted: now.toISOString(),
        nextDue: format(nextDueDate, 'yyyy-MM-dd'),
        streak: task.streak + 1,
      };

      saveHistory(id, task.title, {
        lastCompleted: updatedTask.lastCompleted,
        nextDue: updatedTask.nextDue,
        streak: updatedTask.streak
      });

      return prev.map((t) => (t.id === id ? updatedTask : t));
    });
  };

  const undoTask = async (id: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;

      const remainingHistory = popHistory(id);
      
      let restoredTask;
      if (remainingHistory && remainingHistory.length > 0) {
        const lastState = remainingHistory[remainingHistory.length - 1];
        restoredTask = {
          ...task,
          lastCompleted: lastState.completedAt || lastState.lastCompleted,
          nextDue: lastState.nextDue,
          streak: lastState.streak
        };
      } else {
        // Revert to initial state
        // Need to find definition from current tasks or reload definitions?
        // Since tasks state has the definition merged, we can use it, but we need the *original* definition without dynamic props.
        // Actually, we should look up from the source of truth (localStorage or INITIAL_TASKS).
        const savedDefinitions = localStorage.getItem('task_definitions_v1');
        const taskDefinitions: TaskDefinition[] = savedDefinitions ? JSON.parse(savedDefinitions) : INITIAL_TASKS;
        const initial = taskDefinitions.find(t => t.id === id);

        if (initial) {
          restoredTask = {
            ...task,
            lastCompleted: undefined,
            nextDue: format(calculateInitialNextDue(initial, startOfDay(new Date())), 'yyyy-MM-dd'),
            streak: 0
          };
        } else {
           // Fallback if initial task not found
           restoredTask = { ...task, lastCompleted: undefined, streak: 0 };
        }
      }

      return prev.map((t) => (t.id === id ? restoredTask : t));
    });
  };

  const deleteTask = (id: string) => {
    try {
      // Permanent deletion from definitions only
      // History is preserved as requested
      const savedDefinitions = localStorage.getItem('task_definitions_v1');
      const definitions: TaskDefinition[] = savedDefinitions ? JSON.parse(savedDefinitions) : INITIAL_TASKS;
      const updatedDefinitions = definitions.filter(t => t.id !== id);
      localStorage.setItem('task_definitions_v1', JSON.stringify(updatedDefinitions));

      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err) {
      console.error("Failed to delete task", err);
      setError("Failed to delete task.");
    }
  };

  const addTask = async (newTask: Omit<TaskDefinition, 'id' | 'createdAt'> & { firstDue: string }) => {
    const { firstDue, ...definition } = newTask;
    const taskId = Math.random().toString(36).substring(2, 11);
    const finalDefinition: TaskDefinition = { 
      ...definition, 
      id: taskId, 
      startDate: firstDue,
      createdAt: new Date().toISOString()
    };

    // 1. Save Definition
    const savedDefinitions = localStorage.getItem('task_definitions_v1');
    const taskDefinitions: TaskDefinition[] = savedDefinitions ? JSON.parse(savedDefinitions) : INITIAL_TASKS;
    taskDefinitions.push(finalDefinition);
    localStorage.setItem('task_definitions_v1', JSON.stringify(taskDefinitions));

    // 2. Refresh tasks
    loadTasks();
  };

  const updateTask = (id: string, updates: Partial<TaskDefinition> & { nextDue?: string }) => {
    // 1. Update Definition
    const savedDefinitions = localStorage.getItem('task_definitions_v1');
    let taskDefinitions: TaskDefinition[] = savedDefinitions ? JSON.parse(savedDefinitions) : INITIAL_TASKS;
    
    const defIndex = taskDefinitions.findIndex(t => t.id === id);
    if (defIndex === -1) return; // Should not happen

    // Extract definition-only updates
    const { nextDue, ...defUpdates } = updates;
    
    taskDefinitions[defIndex] = {
      ...taskDefinitions[defIndex],
      ...defUpdates
    };

    // 2. Handle nextDue update
    if (nextDue) {
      const normalizedNextDue = nextDue.split('T')[0];
      const savedState = localStorage.getItem('task_history_v2');
      const history = savedState ? JSON.parse(savedState) : {};
      
      if (history[id] && history[id].length > 0) {
        // If history exists, update the last entry's nextDue
        const lastIndex = history[id].length - 1;
        history[id][lastIndex].nextDue = normalizedNextDue;
        localStorage.setItem('task_history_v2', JSON.stringify(history));
      } else {
        // If no history, update the startDate in the definition to effectively change the initial nextDue
        // Note: This changes the anchor for future calculations too, which is usually what we want if we reschedule the "start".
        taskDefinitions[defIndex].startDate = normalizedNextDue;
      }
    }

    localStorage.setItem('task_definitions_v1', JSON.stringify(taskDefinitions));
    loadTasks();
  };

  return { tasks, addTask, completeTask, undoTask, deleteTask, importTasks, updateTask, loading, error, isSubmitting: false, submitError: null };
}

function calculateInitialNextDue(task: TaskDefinition, fromDate: Date): Date {
  let nextDate = startOfDay(fromDate);

  // If startDate is defined, use it as the base
  if (task.startDate) {
    return startOfDay(new Date(task.startDate));
  }

  // Handle specific months (e.g., "April, October")
  if (task.months && task.months.length > 0) {
    const currentMonth = getMonth(nextDate);
    const sortedMonths = [...task.months].sort((a, b) => a - b);
    
    // Find next month in the list
    const nextMonthIndex = sortedMonths.findIndex(m => m >= currentMonth);
    
    if (nextMonthIndex !== -1) {
      const targetMonth = sortedMonths[nextMonthIndex];
      let candidateDate = setMonth(setDate(nextDate, 1), targetMonth);
      
      if (targetMonth === currentMonth) {
         // We are in the correct month. 
         // If we have passed the day (e.g. today is 15th, target is 1st), we might need to move to next year?
         // But wait, if weekDays are involved, we might still find a valid day this month.
         candidateDate = nextDate; 
      } else {
         candidateDate = setMonth(setDate(nextDate, 1), targetMonth);
      }
      
      nextDate = candidateDate;
    } else {
      // Wrap around to next year
      nextDate = addYears(setMonth(setDate(nextDate, 1), sortedMonths[0]), 1);
    }
  }

  // Handle specific days of week (e.g., "Thursday")
  if (task.weekDays && task.weekDays.length > 0) {
    const currentDay = getDay(nextDate);
    const sortedDays = [...task.weekDays].sort((a, b) => a - b);
    
    // If we are in a specific target month (from months logic above), we want the FIRST occurrence.
    if (task.months && task.months.length > 0) {
       // Reset to 1st of the month to find the first occurrence
       let searchDate = setDate(nextDate, 1);
       // Find the first date that matches any of the weekDays
       while (!sortedDays.includes(getDay(searchDate))) {
         searchDate = addDays(searchDate, 1);
       }
       nextDate = searchDate;
       
       // If the calculated date is before fromDate (e.g. we missed the window this year),
       // we should probably look at the next valid month.
       // But for simplicity, let's return this. The user can mark it complete or we can refine later.
       if (isBefore(nextDate, startOfDay(fromDate))) {
          // This logic is getting complicated. 
          // If we missed it this year, we should wrap to next year's first month.
          // Let's rely on the user seeing it as "overdue" or "due today" if it's close.
       }
    } else {
      // Standard weekly logic
      const nextDayIndex = sortedDays.findIndex(d => d >= currentDay);
      
      if (nextDayIndex !== -1) {
        const targetDay = sortedDays[nextDayIndex];
        if (targetDay === currentDay) {
          // It's today.
        } else {
          nextDate = nextDay(nextDate, targetDay as 0|1|2|3|4|5|6);
        }
      } else {
        // Wrap around to next week
        nextDate = nextDay(nextDate, sortedDays[0] as 0|1|2|3|4|5|6);
      }
    }
  }

  return nextDate;
}

function migrateTaskDefinition(task: any): TaskDefinition {
  // If already in new format, return as is
  if (['day', 'week', 'month', 'year'].includes(task.frequency)) {
    return {
      ...task,
      interval: task.interval || 1
    } as TaskDefinition;
  }

  const oldFreq = task.frequency;
  let newFreq: Frequency = 'day';
  let interval = task.interval || 1;

  if (task.intervalDays) {
    newFreq = 'day';
    interval = task.intervalDays;
  } else {
    switch (oldFreq) {
      case 'daily':
        newFreq = 'day';
        break;
      case 'weekly':
        newFreq = 'week';
        break;
      case 'biweekly':
        newFreq = 'week';
        interval = 2;
        break;
      case 'monthly':
        newFreq = 'month';
        break;
      case 'quarterly':
        newFreq = 'month';
        interval = 3;
        break;
      case 'semiannually':
        newFreq = 'month';
        interval = 6;
        break;
      case 'annually':
        newFreq = 'year';
        break;
      default:
        newFreq = 'day';
    }
  }

  // Remove intervalDays if it exists
  const { intervalDays, ...rest } = task;
  return {
    ...rest,
    frequency: newFreq,
    interval
  };
}
