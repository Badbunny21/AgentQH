import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { createTask, dispatchTask, fetchTasks, Task, toggleTaskDone } from '../lib/tasksApi';
import { fetchActivities, logActivity, Activity } from '../lib/activitiesApi';
import { useAgents } from './AgentsContext';

interface TasksContextType {
  tasks: Task[];
  activities: Activity[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addTask: (title: string, agentId: string | null, dispatch?: boolean) => Promise<{ error: string | null; limitReached?: boolean; taskId?: string }>;
  runTask: (taskId: string) => Promise<{ error: string | null; limitReached?: boolean }>;
  toggleTask: (taskId: string) => Promise<void>;
}

const TasksContext = createContext<TasksContextType | null>(null);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { agents } = useAgents();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session?.user.id) {
      setTasks([]);
      setActivities([]);
      return;
    }
    setIsLoading(true);
    const [taskList, activityList] = await Promise.all([
      fetchTasks(session.user.id),
      fetchActivities(session.user.id),
    ]);
    setTasks(taskList);
    setActivities(activityList);
    setIsLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTask = async (title: string, agentId: string | null, shouldDispatch = false) => {
    if (!session?.user.id) return { error: 'Not signed in' };
    const result = await createTask(session.user.id, title, agentId);
    if (result.error || !result.task) return { error: result.error || 'Could not create task' };

    if (shouldDispatch && agentId) {
      const dispatch = await dispatchTask(result.task.id);
      if (dispatch.error) {
        await refresh();
        return { error: dispatch.error, limitReached: dispatch.limitReached, taskId: result.task.id };
      }
      if (dispatch.executed && session?.user.id) {
        const agentName = agents.find(a => a.id === agentId)?.name ?? 'Agent';
        await logActivity(session.user.id, 'task_done', `${agentName} completed "${title.trim()}"`, {
          agentId,
          taskId: result.task.id,
        });
      }
    } else if (agentId && session?.user.id) {
      const agentName = agents.find(a => a.id === agentId)?.name ?? 'Agent';
      await logActivity(session.user.id, 'task_assigned', `Assigned "${title.trim()}" to ${agentName}`, {
        agentId,
        taskId: result.task.id,
      });
    }

    await refresh();
    return { error: null, taskId: result.task.id };
  };

  const runTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const dispatch = await dispatchTask(taskId);
    if (dispatch.error) {
      await refresh();
      return { error: dispatch.error, limitReached: dispatch.limitReached };
    }
    if (dispatch.executed && session?.user.id && task) {
      const agentName = agents.find(a => a.id === task.agentId)?.name ?? 'Agent';
      await logActivity(session.user.id, 'task_done', `${agentName} completed "${task.title}"`, {
        agentId: task.agentId,
        taskId: task.id,
      });
    }
    await refresh();
    return { error: null };
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const nextDone = !task.done;
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, done: nextDone, status: nextDone ? 'done' : 'open' } : t)));
    await toggleTaskDone(taskId, nextDone);
    await refresh();
  };

  return (
    <TasksContext.Provider value={{ tasks, activities, isLoading, refresh, addTask, runTask, toggleTask }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within TasksProvider');
  return ctx;
}

// Legacy alias for gradual migration
export type { Task };
