import React, { useState, useEffect } from 'react';
import { TaskDefinition, Frequency, Priority, TimeOfDay } from '../types';
import { startOfDay, parseISO, format } from 'date-fns';
import { X } from 'lucide-react';
import { WEEK_DAYS_SHORT, MONTHS_SHORT } from '../constants';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tasks: TaskDefinition[]) => void;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const parseTasks = () => {
    try {
      const lines = input.trim().split('\n');
      const tasks: TaskDefinition[] = [];
      const today = startOfDay(new Date());
      const todayDate = format(today, 'yyyy-MM-dd');
      const todayISO = today.toISOString(); // Keep for createdAt if needed, but maybe date-only is better? User said "when scheduling a task, do not use time part, only date". createdAt is not a due date.

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Skip header if present
        if (i === 0 && (line.toLowerCase().startsWith('task') || line.toLowerCase().startsWith('name'))) continue;

        const parts = line.split('\t');
        if (parts.length < 2) continue;

        // New Format:
        // 0: Task Name
        // 1: Repeat Unit (Frequency)
        // 2: Repeat Count (Interval)
        // 3: Days of Week (comma separated)
        // 4: Months (comma separated)
        // 5: Preferred Time
        // 6: Priority
        // 7: Next Due Date (optional)

        const title = parts[0].trim();
        const frequency = (parts[1]?.trim().toLowerCase() || 'day') as Frequency;
        const interval = parseInt(parts[2]?.trim() || '1') || 1;
        
        const weekDaysRaw = parts[3]?.trim();
        const weekDays = weekDaysRaw ? weekDaysRaw.split(',').map(d => {
          const val = d.trim().toLowerCase();
          const index = WEEK_DAYS_SHORT.indexOf(val);
          if (index !== -1) return index;
          const num = parseInt(val);
          return isNaN(num) ? null : num;
        }).filter((d): d is number => d !== null) : undefined;
        
        const monthsRaw = parts[4]?.trim();
        const months = monthsRaw ? monthsRaw.split(',').map(m => {
          const val = m.trim().toLowerCase();
          const index = MONTHS_SHORT.indexOf(val);
          if (index !== -1) return index;
          const num = parseInt(val);
          return isNaN(num) ? null : num;
        }).filter((m): m is number => m !== null) : undefined;

        const preferredTimeRaw = parts[5]?.trim().toLowerCase() || 'any';
        const priorityRaw = parts[6]?.trim().toLowerCase() || 'medium';
        const nextDueDateRaw = parts[7]?.trim();

        let preferredTime: TimeOfDay = 'any';
        if (['morning', 'afternoon', 'evening', 'any'].includes(preferredTimeRaw)) {
          preferredTime = preferredTimeRaw as TimeOfDay;
        }

        let priority: Priority = 'medium';
        if (['low', 'medium', 'high'].includes(priorityRaw)) {
          priority = priorityRaw as Priority;
        }

        let startDate = nextDueDateRaw;
        if (!startDate) {
          // If not provided, it will be calculated by useTasks based on today
          // But we can set it to today to ensure it starts "now"
          startDate = todayDate;
        } else {
          // Validate date
          try {
            const parsed = parseISO(startDate);
            startDate = format(parsed, 'yyyy-MM-dd');
          } catch {
            startDate = todayDate;
          }
        }

        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        tasks.push({
          id: id || `task-${i}-${Date.now()}`,
          title,
          frequency,
          interval,
          weekDays: weekDays && weekDays.length > 0 ? weekDays : undefined,
          months: months && months.length > 0 ? months : undefined,
          startDate,
          preferredTime,
          priority,
          createdAt: todayDate
        });
      }

      onImport(tasks);
      onClose();
    } catch (e) {
      console.error(e);
      setError('Failed to parse input. Please check the format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Import Tasks</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-auto">
          <p className="text-sm text-gray-500 mb-4">
            Paste your tasks from Google Sheets (TSV format). Expected columns: Task Name, Repeat Unit, Repeat Count, Days of Week (e.g. mon,wed), Months (e.g. jan,apr), Preferred Time, Priority, Next Due Date.
          </p>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            placeholder={`Task Name\tRepeat Unit\tRepeat Count\tDays of Week\tMonths\tPreferred Time\tPriority\tNext Due Date\nHaircut\tmonth\t3\tthu\t\tmorning\thigh\t2026-06-04`}
          />
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={parseTasks}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium cursor-pointer"
          >
            Import Tasks
          </button>
        </div>
      </div>
    </div>
  );
}
