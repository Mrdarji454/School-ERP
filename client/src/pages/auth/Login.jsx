import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import LoginForm from "../../components/forms/LoginForm";
import { login } from "../../services/authService";
import { useAuth } from "../../context/AuthState";

const Login = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (formData) => {
    try {
      setLoading(true);
      const response = await login(formData);

      loginUser(response.data.token, response.data.user);

      toast.success(response.message);

      switch (response.data.user.role) {
        case "Admin":
          navigate("/admin/dashboard");
          break;

        case "Teacher":
          navigate("/teacher/dashboard");
          break;

        case "Student":
          navigate("/student/dashboard");
          break;

        default:
          navigate("/login");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10">
      <h2 className="text-3xl font-bold text-slate-900">Welcome Back 👋</h2>
      <p className="text-slate-500 mt-2">Login to continue</p>
      <LoginForm onSubmit={handleLogin} loading={loading} />
    </div>
  );
};

export default Login;
