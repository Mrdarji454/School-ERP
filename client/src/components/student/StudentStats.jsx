import { GraduationCap, UserCheck, UserX, School } from "lucide-react";

import StatCard from "../cards/StatCard";

const StudentStats = ({
  totalStudents = 0,
  activeStudents = 0,
  inactiveStudents = 0,
  totalClasses = 0,
}) => {
  return (
    <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Students"
        value={totalStudents}
        icon={GraduationCap}
        color="bg-blue-600"
      />

      <StatCard
        title="Active Students"
        value={activeStudents}
        icon={UserCheck}
        color="bg-green-600"
      />

      <StatCard
        title="Inactive Students"
        value={inactiveStudents}
        icon={UserX}
        color="bg-red-600"
      />

      <StatCard
        title="Total Classes"
        value={totalClasses}
        icon={School}
        color="bg-orange-600"
      />
    </div>
  );
};

export default StudentStats;
