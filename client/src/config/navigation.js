import {
    LayoutDashboard,
    GraduationCap,
    Users,
    CalendarDays,
    BookOpen,
    ClipboardCheck,
    IndianRupee,
    Bell,
    Settings,
    LogOut,
    UserCheck,
    Calendar,
    Layers3,
    Building2,
    BookCopy,
} from "lucide-react";

export const adminNavigation = [

    {
        title: "Dashboard",
        items: [
            {
                name: "Dashboard",
                path: "/admin/dashboard",
                icon: LayoutDashboard,
            },
        ],
    },

    {
        title: "Academic",
        items: [
            {
                name: "Academic Year",
                path: "/admin/academic-years",
                icon: Calendar,
            },
            {
                name: "Classes",
                path: "/admin/classes",
                icon: Building2,
            },
            {
                name: "Sections",
                path: "/admin/sections",
                icon: Layers3,
            },
            {
                name: "Subjects",
                path: "/admin/subjects",
                icon: BookCopy,
            },
        ],
    },

    {
        title: "People",
        items: [
            {
                name: "Students",
                path: "/admin/students",
                icon: GraduationCap,
            },
            {
                name: "Teachers",
                path: "/admin/teachers",
                icon: Users,
            },
            {
                name: "Teacher Assignment",
                path: "/admin/teacher-assignments",
                icon: UserCheck,
            },
        ],
    },

    {
        title: "Management",
        items: [
            {
                name: "Timetable",
                path: "/admin/timetable",
                icon: CalendarDays,
            },
            {
                name: "Attendance",
                path: "/admin/attendance",
                icon: ClipboardCheck,
            },
            {
                name: "Academic Calendar",
                path: "/admin/calendar",
                icon: Calendar,
            },
        ],
    },

    {
        title: "Finance",
        items: [
            {
                name: "Student Fees",
                path: "/admin/student-fees",
                icon: IndianRupee,
            },
            {
                name: "Salary",
                path: "/admin/teacher-salary",
                icon: IndianRupee,
            },
        ],
    },

    {
        title: "Communication",
        items: [
            {
                name: "Notifications",
                path: "/admin/notifications",
                icon: Bell,
            },
        ],
    },

    {
        title: "Account",
        items: [
            {
                name: "Settings",
                path: "/admin/settings",
                icon: Settings,
            },
            {
                name: "Logout",
                path: "/logout",
                icon: LogOut,
            },
        ],
    },

];