import { GraduationCap, Users, BookOpen, IndianRupee } from "lucide-react";

import StatCard from "../../components/cards/StatCard";
import DashboardCard from "../../components/cards/DashboardCard";
import PageHeader from "../../components/layout/PageHeader";

const Dashboard = () => {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's an overview of your school."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Students" value="0" icon={GraduationCap} />

        <StatCard
          title="Teachers"
          value="0"
          icon={Users}
          color="bg-green-600"
        />

        <StatCard
          title="Subjects"
          value="0"
          icon={BookOpen}
          color="bg-orange-600"
        />

        <StatCard
          title="Fees Collected"
          value="₹0"
          icon={IndianRupee}
          color="bg-purple-600"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Recent Notifications">
          <div className="flex h-52 items-center justify-center text-slate-400">
            No Notifications
          </div>
        </DashboardCard>

        <DashboardCard title="Upcoming Events">
          <div className="flex h-52 items-center justify-center text-slate-400">
            No Events
          </div>
        </DashboardCard>
      </div>

      <div className="mt-6">
        <DashboardCard title="Recent Fee Payments">
          <div className="flex h-64 items-center justify-center text-slate-400">
            No Fee Payments
          </div>
        </DashboardCard>
      </div>
    </>
  );
};

export default Dashboard;
