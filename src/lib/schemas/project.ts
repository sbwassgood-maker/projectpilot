import { z } from "zod";

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))
  .refine((v) => v === undefined || /^\d{4}-\d{2}-\d{2}$/u.test(v), {
    message: "Enter a valid date",
  });

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(200),
  clientName: z.string().trim().max(200).optional(),
  address: z.string().trim().max(400).optional(),
  startDate: optionalDate,
  targetEndDate: optionalDate,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
