import express, { application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/adminRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import AcademicYearRoutes from './routes/AcademicYearRoutes.js';
import sectionRoutes from "./routes/sectionRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import periodRoutes from './routes/periodRoutes.js';
import teacherAssignmentRoutes from "./routes/teacherAssingmentRoutes.js";
import academicCalendarRoutes from "./routes/academicCalendarRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import feePaymentRoutes from "./routes/feePaymentRoutes.js";
import salaryPaymentRoutes from "./routes/salaryPaymentRoutes.js";

import { notFound, errotHandler } from './middleware/errorMIddleware.js';

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true, }));



app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/acadamic-years", AcademicYearRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/teacher-assignments", teacherAssignmentRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/periods", periodRoutes);
app.use("/api/academic-calendar", academicCalendarRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/fee-payments", feePaymentRoutes);
app.use("/api/salary-payments", salaryPaymentRoutes);

app.get("/", (req, res) => {
    res.send("school api running...")
});

app.use(notFound);
app.use(errotHandler);

export default app;