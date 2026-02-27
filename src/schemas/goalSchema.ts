/**
 * Zod validation schemas for Goals
 */

import { z } from 'zod';

export const goalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  goalType: z.enum(['profit', 'trades_count', 'win_rate', 'risk_management', 'learning']),
  targetValue: z.number().positive('Target value must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.string().optional(),
  endDate: z.string().min(1, 'End date is required').refine((date) => {
    if (!date) return false;
    const endDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate >= today;
  }, {
    message: 'End date must be today or in the future',
  }),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const habitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  target: z.number().int().positive('Target must be a positive number'),
});

export type GoalFormData = z.infer<typeof goalSchema>;
export type HabitFormData = z.infer<typeof habitSchema>;

