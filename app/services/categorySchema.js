import { STATUS } from "@/lib/status";
import z from "zod";

const categorySchema = z.object({
  name: z
    .string("Category name is required")
    .min(1, "Category name cannot be empty")
    .max(100, "Category name too long"),
  status: z.enum(Object.values(STATUS), "Status is required").default(STATUS.ACTIVE),
});

// Create schema (all fields required)
export const createCategorySchema = categorySchema;

// Create schema (all fields optional)
export const updateCategorySchema = categorySchema.partial();
