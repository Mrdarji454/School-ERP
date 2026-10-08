import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema } from "../../validations/authSchema";

import InputField from "../ui/InputField";
import PasswordField from "../ui/PasswordField";
import PrimaryButton from "../ui/PrimaryButton";

const LoginForm = ({ onSubmit, loading }) => {
  const {
    register,

    handleSubmit,

    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: "",

      password: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
      <InputField
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        error={errors.email?.message}
        {...register("email")}
      />

      <PasswordField
        label="Password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register("password")}
      />

      <PrimaryButton type="submit" loading={loading}>
        Login
      </PrimaryButton>
    </form>
  );
};

export default LoginForm;
