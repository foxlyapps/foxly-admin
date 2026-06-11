import * as z from "zod";

/** Login form validation schema (shared client + server). */
export const LoginSchema = z.object({
  email: z.email({ error: "Please enter a valid email address." }).trim(),
  password: z
    .string()
    .min(1, { error: "Password is required." })
    .min(8, { error: "Password must be at least 8 characters." }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export type LoginState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
