import { z } from "zod";

export const studentSchema = z.object({
    fullname: z.string().min(1, "Full name is required"),

    email: z.string().email("Invalid email"),

    password: z.string().min(8, "Password must be at least 8 characters"),

    rollNumber: z.string().min(1, "Roll Number is required").regex(/^\d+$/, "Roll Number must contain only numbers"),

    schoolClass: z.string().min(1, "Class is required"),

    section: z.string().min(1, "Section is required"),

    fatherName: z.string().min(1, "Father Name is required"),

    motherName: z.string().min(1, "Mother Name is required"),

    dob: z.string().min(1, "Date of birth is required"),

    gender: z.string().min(1, "Gender is required"),

    bloodGroup: z.string().optional(),

    phone: z
        .string()
        .min(10, "Phone must be 10 digits")
        .max(10, "Phone must be 10 digits"),

    address: z.string().optional(),
});
export const editStudentSchema = studentSchema.extend({ password: z.string().min(8).optional().or(z.literal("")) });
