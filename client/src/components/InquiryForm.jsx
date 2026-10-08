import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiCheckCircle } from "react-icons/hi";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export default function InquiryForm({ type = "admission" }) {
  const [formData, setFormData] = useState({
    studentName: "",
    parentName: "",
    email: "",
    phone: "",
    inquiryType: type === "admission" ? "Admission" : "General Inquiry",
    message: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.studentName || !formData.phone) {
      setError("Please fill in the student name and phone number.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await axios.post(`${API_URL}/inquiries`, formData);
      setIsSubmitted(true);
      setFormData({
        studentName: "",
        parentName: "",
        email: "",
        phone: "",
        inquiryType: type === "admission" ? "Admission" : "General Inquiry",
        message: "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to submit inquiry right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white rounded-4xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 p-8 md:p-10 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.form
            key="inquiry-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            onSubmit={handleSubmit}
            className="grid gap-5"
          >
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Student Name *
              </label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                placeholder="Enter full name"
                required
                className="w-full border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-[#062B78] focus:ring-2 focus:ring-[#062B78]/10 transition duration-200 text-slate-800"
              />
            </div>

            {type === "admission" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Parent/Guardian Name
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  placeholder="Enter parent/guardian name"
                  className="w-full border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-[#062B78] focus:ring-2 focus:ring-[#062B78]/10 transition duration-200 text-slate-800"
                />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-[#062B78] focus:ring-2 focus:ring-[#062B78]/10 transition duration-200 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  required
                  className="w-full border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-[#062B78] focus:ring-2 focus:ring-[#062B78]/10 transition duration-200 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Inquiry Type
              </label>
              <select
                name="inquiryType"
                value={formData.inquiryType}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-[#062B78] focus:ring-2 focus:ring-[#062B78]/10 transition duration-200 bg-white text-slate-800 cursor-pointer"
              >
                <option value="Admission">Admission Inquiry</option>
                <option value="Academics">Academic Details</option>
                <option value="Campus Tour">Book Campus Tour</option>
                <option value="General Inquiry">General Query</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Message / Notes
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="4"
                placeholder="Type your questions or queries here..."
                className="w-full border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-[#062B78] focus:ring-2 focus:ring-[#062B78]/10 transition duration-200 text-slate-800"
              ></textarea>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full bg-[#062B78] hover:bg-black text-white py-4 rounded-2xl font-bold transition duration-300 shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Submitting..." : "Submit Inquiry"}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="success-message"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="py-16 text-center flex flex-col items-center justify-center h-full min-h-100"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <HiCheckCircle className="text-8xl text-[#062B78] mb-6" />
            </motion.div>

            <h3 className="text-3xl font-black text-[#062B78]">Thank You!</h3>

            <p className="text-slate-500 mt-4 leading-relaxed max-w-sm">
              Your inquiry has been successfully submitted. Our admission team
              from Vedant Vidhya Sankul, Bhabhar will reach out to you shortly.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
