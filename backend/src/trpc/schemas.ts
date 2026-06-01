import { z } from 'zod';

export const CreateJobSchema = z.object({
  case_name: z.string().min(1),
  duration_minutes: z.number().int().positive(),
  location_type: z.enum(['physical', 'remote']),
  city: z.string().optional(),
});

export const AssignReporterSchema = z.object({
  id: z.number().int().positive(),
  reporter_id: z.number().int().positive(),
});

export const AssignEditorSchema = z.object({
  id: z.number().int().positive(),
  editor_id: z.number().int().positive(),
});

export const JobIdSchema = z.object({
  id: z.number().int().positive(),
});

export const ListReportersSchema = z.object({
  jobCity: z.string().optional(),
});
