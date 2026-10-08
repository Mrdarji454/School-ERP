import { X } from "lucide-react";
import StatusBadge from "../ui/StatusBadge";

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
      {label}
    </p>

    <p className="mt-1 text-sm font-medium text-slate-800">{value || "-"}</p>
  </div>
);

const StudentDetailsDrawer = ({ isOpen, onClose, student }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-xl text-black font-semibold">Student Details</h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}

        <div className="space-y-8 p-6">
          {/* Profile */}

          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white">
              {student?.fullname?.charAt(0)?.toUpperCase()}
            </div>

            <div>
              <h3 className="text-2xl font-bold">{student?.fullname}</h3>

              <p className="mt-1 text-slate-500">{student?.admissionNo}</p>

              <div className="mt-3">
                <StatusBadge
                  status={student?.isActive ? "Active" : "Inactive"}
                />
              </div>
            </div>
          </div>

          {/* Personal */}

          <div>
            <h4 className="mb-4 text-lg font-semibold">Personal Information</h4>

            <div className="grid grid-cols-2 gap-5">
              <DetailItem label="Email" value={student?.email} />

              <DetailItem label="Phone" value={student?.phone} />

              <DetailItem label="Gender" value={student?.gender} />

              <DetailItem label="DOB" value={student?.dob} />

              <DetailItem label="Blood Group" value={student?.bloodGroup} />

              <DetailItem label="Address" value={student?.address} />
            </div>
          </div>

          {/* Academic */}

          <div>
            <h4 className="mb-4 text-lg font-semibold">Academic Information</h4>

            <div className="grid grid-cols-2 gap-5">
              <DetailItem
                label="Academic Year"
                value={student?.academicYear?.name}
              />

              <DetailItem label="Class" value={student?.className?.name} />

              <DetailItem label="Section" value={student?.section?.name} />

              <DetailItem label="Roll Number" value={student?.rollNumber} />

              <DetailItem
                label="Admission Date"
                value={student?.admissionDate}
              />
            </div>
          </div>

          {/* Parent */}

          <div>
            <h4 className="mb-4 text-lg font-semibold">Parent Information</h4>

            <div className="grid grid-cols-2 gap-5">
              <DetailItem label="Father Name" value={student?.fatherName} />

              <DetailItem label="Father Phone" value={student?.fatherPhone} />

              <DetailItem label="Mother Name" value={student?.motherName} />

              <DetailItem label="Mother Phone" value={student?.motherPhone} />

              <DetailItem label="Guardian" value={student?.guardianName} />

              <DetailItem
                label="Guardian Phone"
                value={student?.guardianPhone}
              />
            </div>
          </div>

          {/* Remarks */}

          <div>
            <h4 className="mb-3 text-lg font-semibold">Remarks</h4>

            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
              {student?.remarks || "No Remarks"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDetailsDrawer;
