import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { X, Copy, Check } from 'lucide-react';
import { isPast, parseISO, format } from 'date-fns';
import { WEEK_DAYS_SHORT, MONTHS_SHORT } from '../constants';
import { sortTasks } from '../lib/taskUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

export function ExportModal({ isOpen, onClose, tasks }: ExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [exportText, setExportText] = useState('');

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

  useEffect(() => {
    if (isOpen) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const header = ['Task Name', 'Repeat Unit', 'Repeat Count', 'Days of Week', 'Months', 'Preferred Time', 'Priority', 'Next Due Date'].join('\t');
      
      const sortedTasks = sortTasks(tasks);
      const rows = sortedTasks.map(task => {
        const nextDue = parseISO(task.nextDue);
        const effectiveNextDue = isPast(nextDue) ? today : task.nextDue.split('T')[0];
        
        return [
          task.title,
          task.frequency,
          task.interval,
          (task.weekDays || []).map(d => WEEK_DAYS_SHORT[d]).join(','),
          (task.months || []).map(m => MONTHS_SHORT[m]).join(','),
          task.preferredTime,
          task.priority,
          effectiveNextDue
        ].join('\t');
      });

      setExportText([header, ...rows].join('\n'));
    }
  }, [isOpen, tasks]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Export Tasks</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-auto">
          <p className="text-sm text-gray-500 mb-4">
            Copy the content below and paste it into Google Sheets.
          </p>
          
          <textarea
            readOnly
            value={exportText}
            className="w-full h-64 p-4 border border-gray-200 rounded-xl bg-gray-50 font-mono text-sm focus:outline-none"
          />
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
