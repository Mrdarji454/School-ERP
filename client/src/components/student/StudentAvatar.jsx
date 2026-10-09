const StudentAvatar = ({ student, size = "md" }) => {
  const sizes = {
    sm: "h-10 w-10 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-xl",
  };

  const initials = student?.user?.fullname
    ?.split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (student?.profileImage) {
    return (
      <img
        src={student.profileImage}
        alt={student.user?.fullname}
        className={`${sizes[size]} rounded-full object-cover border border-slate-200`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-full bg-blue-600 font-semibold text-white`}
    >
      {initials || "S"}
    </div>
  );
};

export default StudentAvatar;
