import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Section */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 p-12">
        <h1 className="text-5xl font-bold text-white">School ERP</h1>

        <p className="mt-6 text-slate-300 text-lg text-center max-w-md leading-8">
          Smart. Secure. Modern.
          <br />
          Manage your entire school from one place.
        </p>

        <div className="mt-16 w-72 h-72 rounded-full bg-blue-600/20 blur-3xl"></div>
      </div>

      {/* Right Section */}
      <div className="w-full lg:w-1/2 flex justify-center items-center px-6 py-10">
        <Outlet />
      </div>
    </div>
  );
};
export default AuthLayout;
