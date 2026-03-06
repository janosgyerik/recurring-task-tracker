/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { CalendarView } from './components/CalendarView';
import { TaskItems } from './components/TaskItems';
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
import { EditTaskModal } from './components/EditTaskModal';
import { AddTaskModal } from './components/AddTaskModal';
import { Celebration } from './components/Celebration';
import { CheckSquare, Calendar as CalendarIcon, ListChecks, History, ChevronDown, ChevronRight, Upload, Download, Plus, MoreVertical } from 'lucide-react';
import { isToday, isPast, parseISO, startOfDay, format } from 'date-fns';
import { Task, TaskDefinition, Priority } from './types';
import { sortTasks } from './lib/taskUtils';

export default function App() {
  const { tasks, addTask, completeTask, undoTask, deleteTask, importTasks, updateTask, loading, error } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [lastCompletedPriority, setLastCompletedPriority] = useState<Priority>('low');

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleSaveTask = (id: string, updates: Partial<TaskDefinition> & { nextDue?: string }) => {
    updateTask(id, updates);
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleCompleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setLastCompletedPriority(task.priority);
      completeTask(id);
      setIsCelebrating(true);
    }
  };

  // Filter tasks
  const today = startOfDay(new Date());
  
  const dueTasks = sortTasks(tasks.filter(task => {
    if (task.lastCompleted && isToday(parseISO(task.lastCompleted))) return false;
    const nextDue = parseISO(task.nextDue);
    return isToday(nextDue) || isPast(nextDue);
  }));

  const completedToday = sortTasks(tasks.filter(task => 
    task.lastCompleted && isToday(parseISO(task.lastCompleted))
  ));

  const upcomingTasks = sortTasks(tasks.filter(task => {
    if (task.lastCompleted && isToday(parseISO(task.lastCompleted))) return false;
    const nextDue = parseISO(task.nextDue);
    return !isToday(nextDue) && !isPast(nextDue);
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-md text-center">
          <div className="text-red-500 text-xl font-semibold mb-2">Error Loading Tasks</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
            title="Reload page"
          >
            <div className="bg-indigo-600 p-2 rounded-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">
                Recurring Task Tracker
              </h1>
              <div className="sm:hidden">
                <span className="text-lg font-semibold text-gray-900">
                  {format(new Date(), 'EEEE, MMMM d')}
                </span>
              </div>
            </div>
          </button>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAddTaskModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>
            
            {/* Desktop Import/Export Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                title="Import tasks"
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </button>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                title="Export tasks"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
            
            {/* Mobile Triple Dot Menu */}
            <div className="relative md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                title="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        setIsImportModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Upload className="w-4 h-4 text-gray-400" />
                      Import Tasks
                    </button>
                    <button
                      onClick={() => {
                        setIsExportModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Download className="w-4 h-4 text-gray-400" />
                      Export Tasks
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="text-sm text-gray-500 hidden sm:block">
              {format(new Date(), 'EEEE, MMMM d')}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Today's Tasks & Completed */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Today's Tasks Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-indigo-600" />
                  Today's Tasks
                </h2>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {dueTasks.length}
                </span>
              </div>
              <TaskItems 
                tasks={dueTasks} 
                onComplete={handleCompleteTask} 
                onUndo={undoTask}
                onEdit={handleEditTask}
                emptyMessage="All caught up for today! 🎉"
                hideStreak={true}
              />
            </section>

            {/* Completed Tasks Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button 
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Completed Today</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {completedToday.length}
                  </span>
                  {showCompleted ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>
              
              {showCompleted && (
                <div className="px-6 pb-6 opacity-75 border-t border-gray-100 pt-4">
                  <TaskItems 
                    tasks={completedToday} 
                    onComplete={handleCompleteTask} 
                    onUndo={undoTask}
                    onEdit={handleEditTask}
                    emptyMessage="No tasks completed yet today."
                    showDetails={true}
                  />
                </div>
              )}
            </section>

          </div>

          {/* Right Column: Calendar View */}
          <div className="lg:col-span-2">
            <CalendarView tasks={tasks} onEdit={handleEditTask} />
          </div>

        </div>
      </main>

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImport={importTasks} 
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tasks={tasks}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={editingTask}
        onSave={handleSaveTask}
        onDelete={deleteTask}
      />

      <Celebration 
        isVisible={isCelebrating} 
        priority={lastCompletedPriority}
        onComplete={() => setIsCelebrating(false)} 
      />

      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onAdd={addTask}
      />
    </div>
  );
}
