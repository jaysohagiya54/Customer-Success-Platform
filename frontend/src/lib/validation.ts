import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/\d/, "Password must contain at least one digit")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter"),
});

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  company: z.string().trim().min(1, "Company is required").max(120),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(30).optional().or(z.literal("")),
  status: z.enum(["prospect", "active", "at_risk", "churned"]),
});

export const interactionSchema = z.object({
  customer_id: z.string().uuid("Select a customer"),
  type: z.enum(["meeting", "call", "email", "note"]),
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  notes: z.string().trim().min(10, "Notes must be at least 10 characters").max(20000),
  occurred_at: z.string().min(1, "Date is required"),
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least one digit")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .optional()
    .or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type InteractionInput = z.infer<typeof interactionSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
