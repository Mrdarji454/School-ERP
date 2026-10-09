import { useEffect, useState } from "react";
import { GraduationCap, Users, BookOpen, IndianRupee } from "lucide-react";
import StatCard from "../../components/cards/StatCard";
import DashboardCard from "../../components/cards/DashboardCard";
import PageHeader from "../../components/layout/PageHeader";
import api from "../../services/api";
const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
export default function Dashboard() {
 const [data, setData] = useState(null), [error, setError] = useState("");
 useEffect(() => { let active = true; api.get("/dashboard/admin").then(res => { if (active) setData(res.data.data); }).catch(err => { if (active) setError(err.response?.data?.message || "Dashboard could not be loaded"); }); return () => { active = false; }; }, []);
 return <>
  <PageHeader title="Dashboard" subtitle={data ? data.statistics.currentAcademicYear.name : "School overview"} />
  {error ? <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-700">{error}</p> : !data ? <p role="status">Loading dashboard...</p> : <>
   <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
    <StatCard title="Students" value={data.statistics.totalStudents} icon={GraduationCap} />
    <StatCard title="Teachers" value={data.statistics.totalTeachers} icon={Users} color="bg-green-600" />
    <StatCard title="Subjects" value={data.statistics.totalSubjects} icon={BookOpen} color="bg-orange-600" />
    <StatCard title="Fees Collected" value={money(data.statistics.feesCollected)} icon={IndianRupee} color="bg-purple-600" />
   </div>
   <div className="mt-6 grid gap-6 lg:grid-cols-2">
    <DashboardCard title="Recent Notifications">{data.notifications.length ? data.notifications.map(n => <article key={n._id} className="border-b py-3"><h3 className="font-semibold">{n.title}</h3><p>{n.message}</p></article>) : <p className="py-12 text-center text-slate-400">No Notifications</p>}</DashboardCard>
    <DashboardCard title="Upcoming Events">{data.upcomingEvents.length ? data.upcomingEvents.map(e => <article key={e._id} className="border-b py-3"><h3 className="font-semibold">{e.title}</h3><p>{e.startDate.slice(0, 10)} — {e.endDate.slice(0, 10)}</p></article>) : <p className="py-12 text-center text-slate-400">No Events</p>}</DashboardCard>
   </div>
   <div className="mt-6"><DashboardCard title="Recent Fee Payments">{data.recentPayments.length ? data.recentPayments.map(p => <p key={p._id} className="border-b py-3">{money(p.amount)} · {p.paymentMethod} · {new Date(p.paymentDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</p>) : <p className="py-12 text-center text-slate-400">No Fee Payments</p>}</DashboardCard></div>
  </>}
 </>;
}