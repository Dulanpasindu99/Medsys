import { z } from "zod";

export const sriLankanNicRegex = /^(?:\d{12}|\d{9}[VvXx])$/;

export function mapZodFieldErrors(
  error: z.ZodError
): Record<string, string> {
  const flattened = error.flatten().fieldErrors;
  const next: Record<string, string> = {};

  for (const [key, messages] of Object.entries(flattened)) {
    if (Array.isArray(messages) && messages[0]) {
      next[key] = messages[0];
    }
  }

  return next;
}

export const createStaffFormSchema = z.object({
  role: z.enum(["Doctor", "Assistant"]),
  doctorWorkflowMode: z
    .enum(["self_service", "clinic_supported"])
    .optional(),
  name: z.string().trim().min(2, "Full name is required."),
  username: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
}).superRefine((value, context) => {
  if (value.role === "Doctor" && !value.doctorWorkflowMode) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["doctorWorkflowMode"],
      message: "Doctor workflow mode is required for doctor accounts.",
    });
  }
});

export const assistantPatientFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    dateOfBirth: z.string().trim().min(1, "Date of birth is required."),
    nic: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || sriLankanNicRegex.test(value), {
        message: "NIC must be 12 digits or 9 digits followed by V/X.",
      }),
    guardianNic: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || sriLankanNicRegex.test(value), {
        message: "Guardian NIC must be 12 digits or 9 digits followed by V/X.",
      }),
    isMinor: z.boolean(),
    hasGuardianLink: z.boolean(),
    guardianName: z.string().trim().optional(),
    guardianContact: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (!value.isMinor) return;
    if (!value.hasGuardianLink && !value.guardianName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guardianName"],
        message: "Child registration needs guardian name or guardian link.",
      });
    }
    if (!value.hasGuardianLink && !value.guardianContact) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guardianContact"],
        message: "Child registration needs guardian NIC or guardian phone.",
      });
    }
  });

export const assistantScheduleFormSchema = z.object({
  patientId: z.coerce.number().int().positive("Select a patient."),
  doctorId: z.coerce.number().int().positive("Select a doctor."),
  scheduledAt: z.string().trim().min(1, "Select a date and time."),
  reason: z.string().trim().min(1, "Consultation reason is required."),
});

export const inventoryItemFormSchema = z.object({
  name: z.string().trim().min(1, "Item name is required."),
  category: z.enum(["medicine", "consumable", "equipment", "other"]),
  unit: z.string().trim().min(1, "Base unit is required."),
  stock: z.coerce.number().min(0, "Current stock cannot be negative."),
  reorderLevel: z.coerce.number().min(0, "Minimum stock cannot be negative."),
  dispenseUnitSize: z.coerce.number().positive("Dispense unit size must be greater than zero."),
  purchaseUnitSize: z.coerce.number().positive("Purchase unit size must be greater than zero."),
});

export const inventoryMovementFormSchema = z.object({
  quantity: z.coerce.number().positive("Movement quantity must be greater than zero."),
  movementType: z.enum(["in", "out", "adjustment"]),
});

export const inventoryBatchFormSchema = z.object({
  batchNo: z.string().trim().min(1, "Batch number is required."),
  quantity: z.coerce.number().positive("Batch quantity must be greater than zero."),
});
