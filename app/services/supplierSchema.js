import { STATUS } from "@/lib/status";
import z from "zod";

const supplierSchema = z.object({
  name: z
    .string("Supplier name is required")
    .min(1, "Supplier name cannot be empty")
    .max(255, "Supplier name too long"),

  contactPerson: z
    .string("Contact person is required")
    .min(1, "Contact person cannot be empty"),

  phone: z
    .string("Phone number is required")
    .min(10, "Phone number must be at least 10 digits.")
    .max(10, "Phone number must be exactly 10 digits."),

  email: z.string().email("Invalid email format").optional(),

  address: z
    .string("Address is required")
    .min(5, "Address must be at least 5 characters")
    .max(255, "Address too long"),
  status: z
    .enum(Object.values(STATUS), "Status is required")
    .default(STATUS.ACTIVE),
});

// Create schema (all fields required)
export const createSupplierSchema = supplierSchema;

// Update schema (all fields optional)
export const updateSupplierSchema = supplierSchema.partial();
