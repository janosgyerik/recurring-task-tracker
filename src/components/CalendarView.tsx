import React, { useState, useRef, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
  isToday,
  startOfDay,
  isAfter
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, LayoutGrid, Columns, Pencil } from 'lucide-react';
import { Task } from '../types';
import { cn } from '../lib/utils';
import { sortTasks, formatRecurrence } from '../lib/taskUtils';

interface CalendarViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
}

type ViewMode = 'schedule' | '3day' | 'week' | 'month';

export function CalendarView({ tasks, onEdit }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewMode === 'schedule' && targetDate && scrollRef.current) {
      const dateId = `date-${format(targetDate, 'yyyy-MM-dd')}`;
      const element = document.getElementById(dateId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setTargetDate(null);
    }
  }, [viewMode, targetDate]);

  const handleDayClick = (day: Date) => {
    setTargetDate(day);
    setViewMode('schedule');
  };

  const next = () => {
    switch (viewMode) {
      case 'month': setCurrentDate(addMonths(currentDate, 1)); break;
      case 'week': setCurrentDate(addWeeks(currentDate, 1)); break;
      case '3day': setCurrentDate(addDays(currentDate, 3)); break;
      case 'schedule': break; // No navigation for simple schedule view
    }
  };

  const prev = () => {
    switch (viewMode) {
      case 'month': setCurrentDate(subMonths(currentDate, 1)); break;
      case 'week': setCurrentDate(subWeeks(currentDate, 1)); break;
      case '3day': setCurrentDate(subDays(currentDate, 3)); break;
      case 'schedule': break;
    }
  };

  const getDaysToRender = () => {
    switch (viewMode) {
      case 'month': {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: startDate, end: endDate });
      }
      case 'week': {
        const startDate = startOfWeek(currentDate);
        const endDate = endOfWeek(currentDate);
        return eachDayOfInterval({ start: startDate, end: endDate });
      }
      case '3day': {
        return eachDayOfInterval({ start: currentDate, end: addDays(currentDate, 2) });
      }
      default:
        return [];
    }
  };

  const getTasksForDay = (date: Date) => {
    const filtered = tasks.filter(task => {
      if (!task.nextDue) return false;
      return isSameDay(parseISO(task.nextDue), date);
    });
    return sortTasks(filtered);
  };

  const renderHeader = () => (
    <div className="flex flex-col gap-4 p-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1">
          {viewMode !== 'schedule' && (
            <>
              <button onClick={prev} className="p-1 hover:bg-gray-100 rounded-full text-gray-600 cursor-pointer">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="text-xs font-medium px-2 py-1 hover:bg-gray-100 rounded text-gray-600 cursor-pointer">
                Today
              </button>
              <button onClick={next} className="p-1 hover:bg-gray-100 rounded-full text-gray-600 cursor-pointer">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* View Mode Selector - Scrollable on mobile */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
        {(['schedule', '3day', 'week', 'month'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
              viewMode === mode 
                ? "bg-indigo-100 text-indigo-700" 
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {mode === '3day' ? '3 Days' : mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );

  const renderScheduleView = () => {
    const filteredTasks = tasks.filter(t => t.nextDue && (isToday(parseISO(t.nextDue)) || isAfter(parseISO(t.nextDue), startOfDay(new Date()))));
    const sortedTasks = sortTasks(filteredTasks).slice(0, 100); // Show next 100 tasks

    if (sortedTasks.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500 text-sm">
          No upcoming tasks scheduled.
        </div>
      );
    }

    let lastDate = '';

    return (
      <div ref={scrollRef} className="p-4 space-y-4 scroll-smooth">
        {sortedTasks.map(task => {
          const dateStr = format(parseISO(task.nextDue), 'EEEE, MMMM d');
          const dateId = `date-${format(parseISO(task.nextDue), 'yyyy-MM-dd')}`;
          const showHeader = dateStr !== lastDate;
          lastDate = dateStr;

          return (
            <div key={task.id}>
              {showHeader && (
                <h3 
                  id={dateId}
                  className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4 first:mt-0 scroll-mt-20"
                >
                  {dateStr}
                </h3>
              )}
              <div className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-1 h-8 rounded-full",
                    task.priority === 'high' ? "bg-red-400" :
                    task.priority === 'medium' ? "bg-yellow-400" :
                    "bg-blue-400"
                  )} />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{task.title}</div>
                    <div className="text-xs text-gray-500">
                      {task.preferredTime !== 'any' && (
                        <span className="capitalize">{task.preferredTime} • </span>
                      )}
                      {formatRecurrence(task)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onEdit(task)}
                  className="p-2 text-gray-400 hover:text-indigo-600 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all cursor-pointer"
                  title="Edit task"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderGridView = () => {
    const days = getDaysToRender();
    const isMonth = viewMode === 'month';
    const gridCols = viewMode === '3day' ? 'grid-cols-3' : 
                     'grid-cols-7';

    return (
      <>
        <div className={cn("grid text-center text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200", gridCols)}>
          {days.slice(0, viewMode === '3day' ? 3 : 7).map(day => (
            <div key={day.toString()} className="py-2">
              {format(day, 'EEE')}
            </div>
          ))}
        </div>

        <div className={cn("grid text-sm", gridCols)}>
          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);

            return (
              <div
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "border-b border-r border-gray-100 relative group transition-colors hover:bg-gray-50 cursor-pointer",
                  viewMode === 'month' ? "min-h-[80px] p-2" : "min-h-[150px] p-3",
                  isMonth && !isCurrentMonth && "bg-gray-50/50 text-gray-400",
                  isDayToday && "bg-indigo-50/30"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-2",
                  isDayToday ? "bg-indigo-600 text-white" : "text-gray-700"
                )}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1.5">
                  {dayTasks.map(task => (
                    <div 
                      key={task.id}
                      className={cn(
                        "text-[10px] px-2 py-1 rounded truncate border",
                        task.priority === 'high' ? "bg-red-50 text-red-700 border-red-100" :
                        task.priority === 'medium' ? "bg-yellow-50 text-yellow-700 border-yellow-100" :
                        "bg-blue-50 text-blue-700 border-blue-100"
                      )}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {renderHeader()}
      <div>
        {viewMode === 'schedule' ? renderScheduleView() : renderGridView()}
      </div>
    </div>
  );
}
