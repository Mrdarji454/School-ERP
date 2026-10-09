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
import PortalDashboard from '../pages/workflow/PortalDashboard';
import PortalLayout from '../layouts/PortalLayout';
import TimetablePage from '../pages/workflow/TimetablePage';
import AttendancePage from '../pages/workflow/AttendancePage';
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
          <Route path="/admin/timetable" element={<TimetablePage />} />
          <Route path="/admin/attendance" element={<AttendancePage />} />
          {managementResources.map(resource => <Route key={resource} path={`/admin/${resource}`} element={<ManagementPage key={resource} resource={resource} />} />)}
        </Route>
      </Route>
      {['Teacher', 'Student'].map(role => <Route key={role} element={<ProtectedRoute allowedRoles={[role]} />}><Route element={<PortalLayout role={role} />}><Route path={`/${role.toLowerCase()}/dashboard`} element={<PortalDashboard />} /><Route path={`/${role.toLowerCase()}/timetable`} element={<TimetablePage />} /><Route path={`/${role.toLowerCase()}/attendance`} element={<AttendancePage />} /></Route></Route>)}
    </Routes>
  );
};

export default AppRoutes;
