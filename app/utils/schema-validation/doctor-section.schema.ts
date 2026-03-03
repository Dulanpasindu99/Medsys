import { z } from 'zod';

export const NIC_REGEX = /^\d+$/;
export const NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
export const POSITIVE_NUMBER_REGEX = /^\d+(\.\d+)?$/;

export const doctorFormSchema = z.object({
    nicNumber: z
        .string()
        .regex(NIC_REGEX, 'NIC must contain numbers only')
        .min(10, 'NIC must be at least 10 digits')
        .max(15, 'NIC must be at most 15 digits'),
    patientName: z
        .string()
        .trim()
        .min(1, 'Name is required')
        .regex(NAME_REGEX, 'Name must contain letters only'),
    patientAge: z
        .string()
        .regex(/^\d+$/, 'Age must be a number')
        .refine((v) => Number(v) >= 1 && Number(v) <= 100, 'Age must be between 1 and 100'),
    selectedDiseases: z.array(z.string()).min(1, 'Diagnosis is required'),
});

export const addDrugSchema = z.object({
    name: z.string().trim().min(1, 'Drug name is required'),
    doseValue: z.string().trim().regex(POSITIVE_NUMBER_REGEX, 'Dose is required'),
    termsValue: z.string().trim().min(1, 'Frequency is required'),
    amount: z.string().trim().regex(POSITIVE_NUMBER_REGEX, 'Qty is required'),
});

export const rxRowSchema = z.object({
    drug: z.string().trim().min(1),
    dose: z.string().trim().min(1),
    terms: z.string().trim().min(1),
    amount: z.string().trim().regex(POSITIVE_NUMBER_REGEX),
});
