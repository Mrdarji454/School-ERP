import { LayoutDashboard, GraduationCap, Users, Calendar, Layers3, Building2, BookCopy, UserCheck, Clock } from "lucide-react";
export const adminNavigation = [
 { title: "Overview", items: [{ name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }] },
 { title: "Academic", items: [
  { name: "Academic Years", path: "/admin/academic-years", icon: Calendar },
  { name: "Classes", path: "/admin/classes", icon: Building2 },
  { name: "Sections", path: "/admin/sections", icon: Layers3 },
  { name: "Subjects", path: "/admin/subjects", icon: BookCopy },
  { name: "Periods", path: "/admin/periods", icon: Clock },
  { name: "Timetable", path: "/admin/timetable", icon: Calendar },
  { name: "Attendance review", path: "/admin/attendance", icon: UserCheck },
 ] },
 { title: "Learning and communication", items: [{ name: "Resources", path: "/admin/resources", icon: BookCopy }, { name: "Notices", path: "/admin/notices", icon: Layers3 }, { name: "Calendar", path: "/admin/calendar", icon: Calendar }] },
 { title: "People", items: [
  { name: "Students", path: "/admin/students", icon: GraduationCap },
  { name: "Teachers", path: "/admin/teachers", icon: Users },
  { name: "Teacher Assignments", path: "/admin/teacher-assignments", icon: UserCheck },
 ] },
];
