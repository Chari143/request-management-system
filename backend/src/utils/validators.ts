import { z } from "zod";

export const signupSchema = z
  .object({
    email: z.string().min(1, "email is required").email("email is invalid"),
    name: z.string().min(2, "name must be at least 2 characters"),
    password: z.string().min(6, "password must be at least 6 characters"),
    role: z.enum(["EMPLOYEE", "MANAGER"]),
    managerId: z.number().int().positive().optional(),
    managerName: z.string().min(2, "manager name must be at least 2 characters").optional(),
  })
  .superRefine((val, ctx) => {
    if (val.role === "EMPLOYEE") {
      const hasId = typeof val.managerId === "number" && Number.isFinite(val.managerId);
      const hasName = typeof val.managerName === "string" && val.managerName.trim().length > 0;
      if (!hasId && !hasName) {
        ctx.addIssue({ code: "custom", path: ["managerName"], message: "manager name is required" });
      }
    }
  });

export const loginSchema = z.object({
  email: z.string().min(1, "email is required").email("email is invalid"),
  password: z.string().min(6, "password must be at least 6 characters"),
});

export const createRequestSchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
  managerName: z.string().min(2, "manager name must be at least 2 characters"),
});

export const rejectSchema = z.object({
  reason: z.string().min(1, "reason must be at least 1 character").optional(),
});
