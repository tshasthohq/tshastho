import { z } from "zod";

export const testSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(2),
  shortName: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  sampleType: z.string().nullable().optional(),
  price: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0).optional(),
  reportingHours: z.coerce.number().int().min(0).optional(),
  fastingRequired: z.boolean().optional(),
  instructions: z.string().nullable().optional(),
  commissionType: z.enum(["PERCENT", "FIXED"]).optional(),
  commissionValue: z.coerce.number().min(0).optional(),
  homeCollection: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
