import { z } from "zod";
import { ROLES } from "@/lib/roles";
import { STATUS } from "@/lib/status";

const userSchema = z.object({
  username: z
    .string("Username is required")
    .min(2, "Username should at least be 2 characters")
    .max(100, "Username too long!"),

  password: z
    .string("Password is required")
    .min(6, "Password should have at least 6 characters")
    .max(100, "Password too long!"),

  fullName: z
    .string("Full name is required")
    .min(2, "Full name should at least be 2 characters")
    .max(100, "Full name too long!"),

  role: z.enum(
    Object.values(ROLES),
    `Role is required. Allowed: ${Object.values(ROLES).join(", ")}`
  ),

  status: z
    .enum(
      Object.keys(STATUS),
      `Status must be one of: ${Object.values(STATUS).join(", ")}`
    )
    .default("ACTIVE"),
});

// Create schema (all fields required)
export const createUserSchema = userSchema;

// Create schema (all fields optional)
export const updateUserSchema = userSchema.partial();
