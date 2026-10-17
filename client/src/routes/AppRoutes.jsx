import AssignmentsPage from '../pages/workflow/AssignmentsPage';
import FinancePage from '../pages/workflow/FinancePage';
import FinanceSetupPage from '../pages/admin/FinanceSetupPage';
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
import EnrollmentsPage from '../pages/admin/EnrollmentsPage';
import PromotionsPage from '../pages/admin/PromotionsPage';
import ResourcesPage from '../pages/workflow/ResourcesPage';
import CommunicationsPage from '../pages/workflow/CommunicationsPage';
import PortalDashboard from '../pages/workflow/PortalDashboard';
import PortalLayout from '../layouts/PortalLayout';
import TimetablePage from '../pages/workflow/TimetablePage';
import AttendancePage from '../pages/workflow/AttendancePage';
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import PeoplePage from '../pages/admin/PeoplePage';
import AccountPage, { ChangePassword } from '../pages/workflow/AccountPage';
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
      <Route element={<ProtectedRoute allowedRoles={["Admin", "Teacher", "Student"]} />}><Route path="/change-password" element={<ChangePassword />} /></Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
        <Route element={<AdminLayout />}>
          {['fee', 'salary'].map(kind => <Route key={kind} path={`/admin/${kind === 'fee' ? 'fees' : 'salaries'}`} element={<FinancePage key={kind} kind={kind} />} />)}
          {['fee', 'salary'].flatMap(kind => [<Route key={`${kind}-structures`} path={`/admin/${kind}-structures`} element={<FinanceSetupPage key={`${kind}-structures`} kind={kind} />} />, <Route key={`${kind}-issuance`} path={`/admin/${kind}-issuance`} element={<FinanceSetupPage key={`${kind}-issuance`} kind={kind} issuance />} />])}
          <Route path="/admin/assignments" element={<AssignmentsPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/enrollments" element={<EnrollmentsPage />} />
          <Route path="/admin/promotions" element={<PromotionsPage />} />
          <Route path="/admin/students" element={<PeoplePage kind="students" />} />
          <Route path="/admin/timetable" element={<TimetablePage />} />
          <Route path="/admin/resources" element={<ResourcesPage />} /><Route path="/admin/notices" element={<CommunicationsPage key="notices" kind="notices" />} /><Route path="/admin/calendar" element={<CommunicationsPage key="calendar" kind="calendar" />} />
          <Route path="/admin/attendance" element={<AttendancePage />} />
          {managementResources.map(resource => <Route key={resource} path={`/admin/${resource}`} element={resource === "teachers" ? <PeoplePage key={resource} kind="teachers" /> : <ManagementPage key={resource} resource={resource} />} />)}
        </Route>
      </Route>
      {['Teacher', 'Student'].map(role => <Route key={role} element={<ProtectedRoute allowedRoles={[role]} />}><Route element={<PortalLayout role={role} />}><Route path={`/${role.toLowerCase()}/${role === "Student" ? "fees" : "salary"}`} element={<FinancePage key={role} kind={role === "Student" ? "fee" : "salary"} />} /><Route path={`/${role.toLowerCase()}/assignments`} element={<AssignmentsPage />} /><Route path={`/${role.toLowerCase()}/dashboard`} element={<PortalDashboard />} /><Route path={`/${role.toLowerCase()}/timetable`} element={<TimetablePage />} /><Route path={`/${role.toLowerCase()}/resources`} element={<ResourcesPage />} /><Route path={`/${role.toLowerCase()}/notices`} element={<CommunicationsPage key="notices" kind="notices" />} /><Route path={`/${role.toLowerCase()}/calendar`} element={<CommunicationsPage key="calendar" kind="calendar" />} /><Route path={`/${role.toLowerCase()}/profile`} element={<AccountPage />} /><Route path={`/${role.toLowerCase()}/password`} element={<ChangePassword />} /><Route path={`/${role.toLowerCase()}/attendance`} element={<AttendancePage />} /></Route></Route>)}
    </Routes>
  );
};

export default AppRoutes;
