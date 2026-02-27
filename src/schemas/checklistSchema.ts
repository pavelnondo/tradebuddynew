/**
 * Zod validation schemas for Checklists
 */

import { z } from 'zod';

export const checklistItemSchema = z.object({
  text: z.string().min(1, 'Item text is required').max(200, 'Item text must be less than 200 characters'),
  completed: z.boolean().default(false),
});

export const checklistSchema = z.object({
  name: z.string().min(1, 'Checklist name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  type: z.enum(['pre', 'during', 'post', 'rule']),
  items: z.array(checklistItemSchema).default([]),
});

export type ChecklistFormData = z.infer<typeof checklistSchema>;
export type ChecklistItemFormData = z.infer<typeof checklistItemSchema>;

