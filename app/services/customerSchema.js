import { z } from "zod";

const baseCustomerSchema = z.object({
  name: z
    .string("Name is required")
    .min(2, "Name should at least be 2 characters long")
    .max(100, "Name too long"),
  phone: z
  .string()
  .regex(
    /^(\d{10}|\+?[0-9 ]{10,15})$/,
    "Phone number must be 10 digits or a valid international format"
  )
  .optional(),
  email: z.string().email("Please enter a valid email").optional(),
  address: z
    .string()
    .min(10, "Invalid address")
    .max(255, "Address too long")
    .optional(),
});

//  For creation, name is required
export const createCustomerSchema = baseCustomerSchema;

//  For update, all fields are optional
export const updateCustomerSchema = baseCustomerSchema.partial();
