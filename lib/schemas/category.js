import { STATUS } from "@/lib/status";
import z from "zod";

const categorySchema = z.object({
  name: z
    .string("Category name is required")
    .min(1, "Category name cannot be empty")
    .max(100, "Category name too long"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const createCategorySchema = categorySchema;
export const updateCategorySchema = categorySchema.partial();
