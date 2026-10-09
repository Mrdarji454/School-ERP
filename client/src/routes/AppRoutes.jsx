import { Routes, Route, Navigate } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import Login from "../pages/auth/Login";
import Home from "../pages/Home";
import About from "../pages/About";
import Academics from "../pages/Acadamics";
import Admission from "../pages/Admissions";
import Events from "../pages/Events";
import Gallary from "../pages/Gallary";
import Contact from "../pages/Contact";
import Blog from "../pages/blog";

import AdminDashboard from "../pages/admin/Dashboard";
import TeacherDashboard from "../pages/teacher/Dashboard";
import StudentDashboard from "../pages/student/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import Students from "../pages/admin/students/Students";
import ManagementPage from "../pages/admin/ManagementPage";
import { managementResources } from "../config/management";

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/academics" element={<Academics />} />
      <Route path="/admissions" element={<Admission />} />
      <Route path="/events" element={<Events />} />
      <Route path="/gallery" element={<Gallary />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<Students />} />
          {managementResources.map(resource => <Route key={resource} path={`/admin/${resource}`} element={<ManagementPage key={resource} resource={resource} />} />)}
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["Teacher"]} />}><Route path="/teacher/dashboard" element={<TeacherDashboard />} /></Route>
      <Route element={<ProtectedRoute allowedRoles={["Student"]} />}><Route path="/student/dashboard" element={<StudentDashboard />} /></Route>
    </Routes>
  );
};

export default AppRoutes;
