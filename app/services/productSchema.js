import { STATUS } from "@/lib/status";
import { z } from "zod";

const productSchema = z.object({
  name: z
    .string("Product name is required")
    .min(1, "Product name cannot be empty")
    .max(255, "Product name too long"),

  barcode: z
    .string("Barcode is required")
    .min(1, "Barcode cannot be empty")
    .max(255, "Barcode too long").optional(),

  categoryId: z
    .number("Category is required")
    .int()
    .positive("Category ID must be a positive number"),

  supplierId: z
    .number("Supplier is required")
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

  stockQuantity: z
    .number("Stock quantity is required")
    .int()
    .nonnegative("Stock quantity cannot be negative"),

  expiryDate: z.coerce.date("Expiry date must be a valid date"),

  status: z.enum(Object.values(STATUS), "Status is required").default(STATUS.ACTIVE),
});

// Create schema (all fields required)
export const createProductSchema = productSchema;

// Create schema (all fields optional)
export const updateProductSchema = productSchema.partial();
