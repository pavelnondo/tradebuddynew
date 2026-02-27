/**
 * Zustand store for Goals and Habits
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Habit {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target: number; // Target per period
  streak: number;
  bestStreak: number;
  lastCompleted?: string;
  status: 'active' | 'paused';
  createdAt: string;
  completedDates: string[]; // ISO date strings
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  goalType: 'profit' | 'trades' | 'winrate' | 'consistency' | 'learning';
  target: number;
  current: number;
  unit: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
  journalId?: string;
}

interface GoalStore {
  // Goals
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  
  // Habits
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  completeHabit: (id: string, date?: string) => void;
  
  // Computed
  getGoalProgress: (goalId: string) => number;
  getDaysRemaining: (goalId: string) => number;
  getHabitStreak: (habitId: string) => number;
}

export const useGoalStore = create<GoalStore>()(
  persist(
    (set, get) => ({
      // Initial state
      goals: [],
      habits: [],

      // Set goals
      setGoals: (goals) => set({ goals }),

      // Add goal
      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),

      // Update goal
      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, ...updates, updatedAt: new Date().toISOString() } : goal
          ),
        })),

      // Delete goal
      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id),
        })),

      // Set habits
      setHabits: (habits) => set({ habits }),

      // Add habit
      addHabit: (habit) => set((state) => ({ habits: [...state.habits, habit] })),

      // Update habit
      updateHabit: (id, updates) =>
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id ? { ...habit, ...updates } : habit
          ),
        })),

      // Delete habit
      deleteHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((habit) => habit.id !== id),
        })),

      // Complete habit
      completeHabit: (id, date) => {
        const today = date || new Date().toISOString().split('T')[0];
        const habit = get().habits.find((h) => h.id === id);
        if (!habit) return;

        const completedDates = habit.completedDates || [];
        if (completedDates.includes(today)) return; // Already completed today

        // Calculate streak
        const sortedDates = [...completedDates, today].sort();
        let streak = 1;
        for (let i = sortedDates.length - 2; i >= 0; i--) {
          const current = new Date(sortedDates[i + 1]);
          const previous = new Date(sortedDates[i]);
          const diffDays = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }

        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id
              ? {
                  ...h,
                  completedDates: [...completedDates, today],
                  streak,
                  bestStreak: Math.max(h.bestStreak, streak),
                  lastCompleted: today,
                }
              : h
          ),
        }));
      },

      // Get goal progress
      getGoalProgress: (goalId) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal || goal.target === 0) return 0;
        return Math.min((goal.current / goal.target) * 100, 100);
      },

      // Get days remaining
      getDaysRemaining: (goalId) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal || !goal.deadline) return 0;
        const deadline = new Date(goal.deadline);
        const today = new Date();
        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
      },

      // Get habit streak
      getHabitStreak: (habitId) => {
        const habit = get().habits.find((h) => h.id === habitId);
        return habit?.streak || 0;
      },
    }),
    {
      name: 'goal-storage',
    }
  )
);


