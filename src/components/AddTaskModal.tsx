import React, { useState, useEffect } from 'react';
import { Frequency, Priority, TimeOfDay, TaskDefinition } from '../types';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { DatePicker } from './DatePicker';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: any) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState<Partial<TaskDefinition> & { firstDue: string }>({
    title: '',
    frequency: 'day',
    interval: 1,
    priority: 'medium',
    preferredTime: 'any',
    firstDue: format(new Date(), 'yyyy-MM-dd'),
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.firstDue) {
      onAdd(formData as TaskDefinition & { firstDue: string });
      onClose();
      // Reset form
      setFormData({
        title: '',
        frequency: 'day',
        interval: 1,
        priority: 'medium',
        preferredTime: 'any',
        firstDue: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  };

  const handleChange = (field: keyof TaskDefinition | 'firstDue', value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const frequencies: Frequency[] = ['day', 'week', 'month', 'year'];
  const priorities: Priority[] = ['low', 'medium', 'high'];
  const times: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'any'];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthsOfYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const toggleArrayItem = (field: 'weekDays' | 'months', item: number) => {
    const current = (formData[field] as number[]) || [];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    handleChange(field, updated.length > 0 ? updated : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">New Task</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Definition Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Task Definition</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={e => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="What needs to be done?"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repeats every</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={formData.interval || 1}
                    onChange={e => handleChange('interval', parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <select
                    value={formData.frequency || 'day'}
                    onChange={e => handleChange('frequency', e.target.value as Frequency)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="day">Day(s)</option>
                    <option value="week">Week(s)</option>
                    <option value="month">Month(s)</option>
                    <option value="year">Year(s)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specific Days of Week (Optional)</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleArrayItem('weekDays', index)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer ${
                      (formData.weekDays || []).includes(index)
                        ? 'bg-indigo-100 border-indigo-200 text-indigo-700 font-medium'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specific Months (Optional)</label>
              <div className="flex flex-wrap gap-2">
                {monthsOfYear.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => toggleArrayItem('months', index)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer ${
                      (formData.months || []).includes(index)
                        ? 'bg-indigo-100 border-indigo-200 text-indigo-700 font-medium'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                <select
                  value={formData.preferredTime || 'any'}
                  onChange={e => handleChange('preferredTime', e.target.value as TimeOfDay)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {times.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority || 'medium'}
                  onChange={e => handleChange('priority', e.target.value as Priority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {priorities.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* First Due Date Section */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <DatePicker
              label="First Due Date (YYYY/MM/DD)"
              value={formData.firstDue || ''}
              onChange={val => handleChange('firstDue', val)}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              The first time this task will appear in your schedule.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
