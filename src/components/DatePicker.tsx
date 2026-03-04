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
  isToday,
  parse,
  isValid
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function DatePicker({ value, onChange, label, placeholder = 'YYYY/MM/DD', required }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync currentMonth with value when opened
  useEffect(() => {
    if (isOpen && value) {
      const parsed = parse(value, 'yyyy-MM-dd', new Date());
      if (isValid(parsed)) {
        setCurrentMonth(parsed);
      }
    }
  }, [isOpen, value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = (() => {
    if (!value) return '';
    try {
      const date = parse(value, 'yyyy-MM-dd', new Date());
      if (!isValid(date)) return value;
      return format(date, 'yyyy/MM/dd');
    } catch {
      return value;
    }
  })();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // If it matches YYYY/MM/DD, convert to YYYY-MM-DD for state
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(val)) {
      onChange(val.replace(/\//g, '-'));
    } else {
      onChange(val);
    }
  };

  const handleDateSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;

    return (
      <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-64 left-0 md:left-auto md:right-0">
        <div className="flex items-center justify-between mb-4">
          <button 
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-600 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-sm font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button 
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-600 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-[10px] font-medium text-gray-400 text-center uppercase">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const isSel = selectedDate && isValid(selectedDate) && isSameDay(day, selectedDate);
            const isCurrMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);

            return (
              <button
                key={day.toString()}
                type="button"
                onClick={() => handleDateSelect(day)}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer",
                  !isCurrMonth && "text-gray-300",
                  isCurrMonth && !isSel && "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600",
                  isSel && "bg-indigo-600 text-white font-semibold",
                  isDayToday && !isSel && "text-indigo-600 font-bold underline underline-offset-2"
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
          <button
            type="button"
            onClick={() => handleDateSelect(new Date())}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          required={required}
          className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
          title="Open calendar"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
      </div>
      {isOpen && renderCalendar()}
    </div>
  );
}
