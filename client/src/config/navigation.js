import { LayoutDashboard, GraduationCap, Users, Calendar, Layers3, Building2, BookCopy, UserCheck, Clock } from "lucide-react";
export const adminNavigation = [
 { title: "Overview", items: [{ name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }] },
 { title: "Academic", items: [
  { name: "Academic Years", path: "/admin/academic-years", icon: Calendar },
  { name: "Classes", path: "/admin/classes", icon: Building2 },
  { name: "Sections", path: "/admin/sections", icon: Layers3 },
  { name: "Subjects", path: "/admin/subjects", icon: BookCopy },
  { name: "Periods", path: "/admin/periods", icon: Clock },
  { name: "Teacher Assignments", path: "/admin/teacher-assignments", icon: UserCheck },
 ] },
 { title: "Daily operations", items: [
  { name: "Timetable", path: "/admin/timetable", icon: Calendar },
  { name: "Attendance review", path: "/admin/attendance", icon: UserCheck },
 ] },
 { title: "Learning and communication", items: [{ name: "Report cards", path: "/admin/report-cards", icon: BookCopy }, { name: "Exams", path: "/admin/exams", icon: BookCopy }, { name: "Published results", path: "/admin/results", icon: BookCopy }, { name: "Assignments", path: "/admin/assignments", icon: BookCopy }, { name: "Learning resources", path: "/admin/resources", icon: BookCopy }, { name: "Notices", path: "/admin/notices", icon: Layers3 }, { name: "Academic calendar", path: "/admin/calendar", icon: Calendar }] },
 { title: "Finance", items: [{ name: "Student fees", path: "/admin/fees", icon: BookCopy }, { name: "Teacher salaries", path: "/admin/salaries", icon: Users }] },
 { title: "People", items: [
  { name: "Students", path: "/admin/students", icon: GraduationCap },
  { name: "Enrollments", path: "/admin/enrollments", icon: BookCopy },
  { name: "Promotion / rollover", path: "/admin/promotions", icon: Layers3 },
  { name: "Teachers", path: "/admin/teachers", icon: Users },
 ] },
];
