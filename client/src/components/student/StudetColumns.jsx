import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import StudentAvatar from "./StudentAvatar";
import StatusBadge from "../ui/StatusBadge";

const studentColumns = ({ onView, onEdit, onDelete }) => [

  {
    header: "Student",
    render: (row) => (
      <div className="flex items-center gap-3">
        <StudentAvatar name={row.user?.fullname} />
        <div>
          <p className="font-medium">{row.user?.fullname}</p>
          <p className="text-sm text-slate-500">{row.admissionNo}</p>
        </div>
      </div>
    ),
  },
  {
    header: "Email",
    render: (row) => row.user?.email || "-",
  },
  {
    header: "Class",
    render: (row) => row.schoolClass?.name || "-",
  },
  {
    header: "Section",
    render: (row) => row.section?.name || "-",
  },

  {
    header: "Status",
    render: (row) =>
      React.createElement(StatusBadge, {
        status: row.isActive ? "Active" : "Inactive",
      }),
  },

  {
    header: "Action",
    accessor: "action",

    render: (row) =>
      React.createElement(
        "div",
        { className: "flex gap-2" },

        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => onView?.(row),
            className:
              "rounded-lg bg-slate-100 p-2 hover:bg-slate-200",
          },
          React.createElement(Eye, { size: 18 })
        ),

        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => onEdit?.(row),
            className:
              "rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200",
          },
          React.createElement(Pencil, { size: 18 })
        ),

        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => onDelete?.(row),
            className:
              "rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200",
          },
          React.createElement(Trash2, { size: 18 }),

        ),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => onView?.(row),
            className:
              "rounded-lg bg-slate-100 p-2 hover:bg-slate-200",
          },
          React.createElement(Eye, { size: 18 })
        ),
      ),

  },
];

export default studentColumns;