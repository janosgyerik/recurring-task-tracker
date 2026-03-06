import React from 'react';
import { Task } from '../types';
import { cn } from '../lib/utils';
import { CheckCircle2, Circle, Pencil } from 'lucide-react';
import { isToday, isPast, isFuture, differenceInCalendarDays, format } from 'date-fns';
import { calculateNextDue } from '../lib/taskUtils';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onUndo?: (id: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, onUndo, onEdit }) => {
  const nextDue = new Date(task.nextDue);
  const isOverdue = isPast(nextDue) && !isToday(nextDue);
  const overdueDays = isOverdue ? differenceInCalendarDays(new Date(), nextDue) : 0;
  const isCompletedToday = task.lastCompleted && isToday(new Date(task.lastCompleted));

  const hypotheticalNextDue = calculateNextDue(
    new Date(), 
    task.frequency, 
    task.weekDays, 
    task.months, 
    task.interval
  );

  const handleToggle = () => {
    if (isCompletedToday) {
      onUndo?.(task.id);
    } else {
      onComplete(task.id);
    }
  };

  return (
    <div className={cn(
      "group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
      isCompletedToday 
        ? "bg-gray-50 border-gray-100 opacity-75" 
        : cn(
            "bg-white hover:shadow-sm",
            task.priority === 'high' ? "border-red-200/70 hover:border-red-300" :
            task.priority === 'medium' ? "border-yellow-200/70 hover:border-yellow-300" :
            "border-blue-200/70 hover:border-blue-300"
          )
    )}>
      <div className="flex items-start gap-3 flex-grow">
        <button
          onClick={handleToggle}
          className={cn(
            "mt-1 flex-shrink-0 transition-colors duration-200 cursor-pointer",
            isCompletedToday ? "text-green-500 hover:text-green-600" : "text-gray-300 hover:text-indigo-600"
          )}
          title={isCompletedToday ? "Undo completion" : "Mark as complete"}
        >
          {isCompletedToday ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>
        
        <div className="flex flex-col gap-1 w-full">
          <div className="flex justify-between items-start w-full">
            <h3 className={cn(
              "font-medium text-gray-900 transition-all pr-2",
              isCompletedToday && "line-through text-gray-500"
            )}>
              {task.title}
            </h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {isOverdue && !isCompletedToday && (
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                Overdue {overdueDays} day{overdueDays !== 1 ? 's' : ''}
              </span>
            )}

            {task.streak > 0 && (
              <span className="text-orange-500 font-medium">
                🔥 {task.streak} streak
              </span>
            )}

            {!isCompletedToday && (
              <span className="bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full font-medium border border-gray-100/50">
                next: {format(hypotheticalNextDue, 'MMMM d')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 ml-2">
        <button
          onClick={() => onEdit(task)}
          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors duration-200 cursor-pointer"
          title="Edit task"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
