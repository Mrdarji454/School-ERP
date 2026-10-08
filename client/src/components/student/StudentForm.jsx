import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import InputField from "../ui/InputField";
import PrimaryButton from "../ui/PrimaryButton";
import SelectField from "../ui/SelectField";

import { studentSchema } from "../../validations/studentSchema";

const StudentForm = ({
  initialData = null,
  onSubmit,
  loading = false,
  classes = [],
  sections = [],
}) => {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      fullname: "",
      email: "",
      password: "",
      rollNumber: "",
      schoolClass: "",
      section: "",
      fathername: "",
      mothername: "",
      gender: "",
      phone: "",
      address: "",
      bloodGroup: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        fullname: initialData.fullname,
        email: initialData.email,
        password: "",
        rollNumber: initialData.rollNumber,
        schoolClass: initialData.schoolClass?._id,
        section: initialData.section?._id,
        gender: initialData.gender,
        phone: initialData.phone,
        address: initialData.address,
        fathername: initialData.fathername,
        mothername: initialData.mothername,
        bloodGroup: initialData.bloodGroup,
      });
    }
  }, [initialData, reset]);

  return (
    <form
      onSubmit={handleSubmit(
        (data) => {
          console.log("SUCCESS", data);
          onSubmit(data);
        },
        (errors) => {
          console.log("VALIDATION ERRORS", errors);
        },
      )}
    >
      {/* Student Information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 border-b pb-3 text-lg font-semibold text-slate-800">
          Student Information
        </h3>

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Full Name"
            {...register("fullname")}
            error={errors.fullname?.message}
          />

          <InputField
            label="Email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
          />

          {!isEdit && (
            <InputField
              label="Password"
              type="password"
              {...register("password")}
              error={errors.password?.message}
            />
          )}

          <InputField
            label="Date of Birth"
            type="date"
            {...register("dob")}
            error={errors.dob?.message}
          />

          <SelectField
            label="Gender"
            {...register("gender")}
            error={errors.gender?.message}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </SelectField>

          <SelectField label="Blood Group" {...register("bloodGroup")}>
            <option value="">Select Blood Group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </SelectField>
        </div>
      </div>

      {/* Parent Information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 border-b pb-3 text-lg font-semibold text-slate-800">
          Parent Information
        </h3>

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Father Name"
            {...register("fathername")}
            error={errors.fathername?.message}
          />

          <InputField
            label="Mother Name"
            {...register("mothername")}
            error={errors.mothername?.message}
          />

          <InputField
            label="Phone Number"
            {...register("phone")}
            error={errors.phone?.message}
          />
        </div>
      </div>

      {/* Academic Information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 border-b pb-3 text-lg font-semibold text-slate-800">
          Academic Information
        </h3>

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Roll Number"
            type="number"
            placeholder="e.g. 1"
            {...register("rollNumber")}
            error={errors.rollNumber?.message}
          />

          <SelectField
            label="Class"
            {...register("schoolClass")}
            error={errors.schoolClass?.message}
          >
            <option value="">Select Class</option>

            {classes.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Section"
            {...register("section")}
            error={errors.section?.message}
          >
            <option value="">Select Section</option>

            {sections.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 border-b pb-3 text-lg font-semibold text-slate-800">
          Address
        </h3>

        <InputField
          label="Full Address"
          {...register("address")}
          error={errors.address?.message}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t pt-5">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl border text-black border-slate-300 px-6 py-2 font-medium hover:bg-slate-100"
        >
          Reset
        </button>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white"
        >
          Test Submit
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
