import { z } from "zod";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

// Enums
export const CategoryEnum = z.enum(["TAX", "LICENSE", "PERMIT"]);
export const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const CaseStatusEnum = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
]);
export const RoleEnum = z.enum(["ADMIN", "OPERATOR"]);

// Helper for phone normalization
export const normalizePhone = (phone: string): string | null => {
  if (!phone || phone.trim() === "") return null;

  const cleaned = phone.trim();

  // Try parsing with default country (India)
  try {
    if (isValidPhoneNumber(cleaned, "IN")) {
      const parsed = parsePhoneNumber(cleaned, "IN");
      return parsed.format("E.164");
    }
    // Try parsing as international
    if (isValidPhoneNumber(cleaned)) {
      const parsed = parsePhoneNumber(cleaned);
      return parsed.format("E.164");
    }
  } catch {
    // Invalid phone number
  }

  return null;
};

// Helper for name normalization (title case)
export const titleCase = (name: string): string => {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Case validation schema
export const CaseSchema = z.object({
  caseId: z
    .string()
    .min(1, "Case ID is required")
    .regex(/^[A-Za-z0-9-]+$/, "Case ID must be alphanumeric with hyphens"),

  applicantName: z
    .string()
    .min(1, "Applicant name is required")
    .max(255, "Applicant name must be less than 255 characters"),

  dob: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Invalid date format")
    .refine((val) => {
      const date = new Date(val);
      const minDate = new Date("1900-01-01");
      const maxDate = new Date();
      return date >= minDate && date <= maxDate;
    }, "Date of birth must be between 1900 and today"),

  email: z
    .string()
    .email("Invalid email format")
    .optional()
    .nullable()
    .or(z.literal("")),

  phone: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val ? normalizePhone(val) : null)),

  category: CategoryEnum,

  priority: PriorityEnum.optional().default("LOW"),
});

export type CaseInput = z.infer<typeof CaseSchema>;

// Batch case schema
export const BatchCaseSchema = z.object({
  cases: z
    .array(CaseSchema)
    .min(1, "At least one case is required")
    .max(100, "Maximum 100 cases per batch"),
  importId: z.string().optional(),
});

export type BatchCaseInput = z.infer<typeof BatchCaseSchema>;

// User schemas
export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
  name: z.string().min(1, "Name is required").max(255),
  role: RoleEnum.optional().default("OPERATOR"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// Case update schema
export const CaseUpdateSchema = z.object({
  applicantName: z.string().min(1).max(255).optional(),
  dob: z
    .string()
    .refine((val) => !isNaN(new Date(val).getTime()))
    .optional(),
  email: z.string().email().optional().nullable(),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? normalizePhone(val) : null)),
  category: CategoryEnum.optional(),
  priority: PriorityEnum.optional(),
  status: CaseStatusEnum.optional(),
});

export type CaseUpdateInput = z.infer<typeof CaseUpdateSchema>;

// Case query schema
export const CaseQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: CaseStatusEnum.optional(),
  category: CategoryEnum.optional(),
  priority: PriorityEnum.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
});

export type CaseQuery = z.infer<typeof CaseQuerySchema>;

// Case note schema
export const CaseNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(5000),
});

export type CaseNoteInput = z.infer<typeof CaseNoteSchema>;

// Import schema
export const ImportCreateSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  totalRows: z.number().int().positive("Total rows must be positive"),
});

export type ImportCreateInput = z.infer<typeof ImportCreateSchema>;

// CSV Row validation (for client-side)
export const CSVRowSchema = z.object({
  case_id: z.string().min(1, "Case ID is required"),
  applicant_name: z.string().min(1, "Applicant name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  category: z.string().min(1, "Category is required"),
  priority: z.string().optional().nullable(),
});

export type CSVRow = z.infer<typeof CSVRowSchema>;

// Validation result type
export interface ValidationError {
  row: number;
  field: string;
  value: string | null | undefined;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data: CaseInput | null;
}
