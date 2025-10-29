import { STATUS } from "@/lib/status";
import { z } from "zod";

const productSchema = z.object({
  name: z
    .string("Product name is required")
    .min(1, "Product name cannot be empty")
    .max(255, "Product name too long"),

  barcode: z
    .string("Barcode is required")
    .max(255, "Barcode too long").optional(),

  categoryId: z
    .number("A valid Category is required")
    .int()
    .positive("Category ID must be a positive number"),

  supplierId: z
    .number("A valid Supplier is required")
    .int()
    .positive("Supplier ID must be a positive number"),

  price: z
    .number("Price is required")
    .int()
    .nonnegative("Price cannot be negative"),

  costPrice: z
    .number("Cost price is required")
    .int()
    .nonnegative("Cost price cannot be negative"),

  stockQuantity: z.any("Stock quantity is required"),

  // Make expiry date optional and nullable
  expiryDate: z.coerce
    .date("Expiry date must be a valid date")
    .optional()
    .nullable(),

  status: z
    .enum(Object.values(STATUS), "Status is required")
    .default(STATUS.ACTIVE),

  unit: z.enum(["pcs", "kg"]),
});

// Create schema (all fields required)
export const createProductSchema = productSchema;

// Create schema (all fields optional)
export const updateProductSchema = productSchema.partial();
