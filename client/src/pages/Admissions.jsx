import { motion } from "framer-motion";
import FAQSection from "../components/FAQSection";
import InquiryForm from "../components/InquiryForm";
import CallToAction from "../components/CallToAction";

export default function AdmissionsPage() {
  const processSteps = [
    {
      title: "Submit Inquiry",
      desc: "Fill out the quick online Admission Inquiry form below or visit our Bhabhar campus.",
    },
    {
      title: "Interaction",
      desc: "A casual friendly discussion with the counselor and faculty to understand the child's strengths.",
    },
    {
      title: "Basic Assessment",
      desc: "A short, simple evaluation to gauge the student's foundation level in mathematics and language.",
    },
    {
      title: "Verification",
      desc: "Reviewing basic documents such as birth certificate, previous school records, and transfer letters.",
    },
    {
      title: "Confirmation",
      desc: "Securing student placement, allocating batch sections, uniform measurements, and fee clearance.",
    },
  ];

  const requiredDocuments = [
    {
      title: "Birth Certificate",
      desc: "Government issued certificate for age registration validation.",
    },
    {
      title: "Passport Photos",
      desc: "4 recent color passport-sized photos of the student and parents.",
    },
    {
      title: "Previous Report Card",
      desc: "Academic transcripts/grades sheets from the candidate's last school.",
    },
    {
      title: "Transfer Certificate",
      desc: "School Leaving Certificate (LC) signed by authorized authorities.",
    },
  ];

  return (
    <div className="bg-white overflow-hidden text-slate-900">
      {/* HERO SECTION */}
      <section className="relative pt-40 pb-32 bg-[#062B78] text-white">
        <div className="absolute inset-0 opacity-15">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1600&auto=format&fit=crop"
            alt="admission banner"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <p className="uppercase tracking-[5px] text-yellow-400 text-xs font-bold mb-4">
            Admissions Open 2026-2027
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight tracking-tight">
            Begin Your Child's
            <span className="text-yellow-400 block mt-2">
              Journey of Excellence
            </span>
          </h1>

          <p className="max-w-3xl mx-auto mt-8 text-base md:text-lg text-slate-200 leading-relaxed font-medium">
            Join a future-focused educational ecosystem that nurtures talent,
            robotics innovation, sportsmanship, and board success.
          </p>
        </div>
      </section>

      {/* INTRO SECTION */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-28 grid lg:grid-cols-2 gap-20 items-center">
        {/* LEFT IMAGE */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -bottom-5 -right-5 w-full h-full border-[6px] border-yellow-400 rounded-[30px] pointer-events-none"></div>
          <img
            src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop"
            alt="students smiling"
            className="relative rounded-[30px] shadow-2xl object-cover w-full h-100 border border-slate-100"
          />
        </motion.div>

        {/* RIGHT CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-4">
            Why Choose Us
          </p>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#062B78] leading-tight">
            A Supportive Space Where Futures Take Shape
          </h2>

          <p className="mt-6 text-base leading-relaxed text-slate-700">
            At Vedant Vidhya Sankul, we merge board preparation with practical
            robotic/AI workshops, sports leagues, and public-speaking contests
            to make your child future-ready.
          </p>

          <div className="grid sm:grid-cols-2 gap-5 mt-10">
            {[
              "Highly Trained Mentors",
              "Smart Digital Screens",
              "Robotics & Coding Labs",
              "Holistic Value System",
            ].map((item, index) => (
              <div
                key={index}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center gap-4 hover:border-yellow-400/30 transition duration-300"
              >
                <div className="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center text-xl text-[#062B78]">
                  ✓
                </div>
                <h3 className="font-bold text-sm text-[#062B78]">{item}</h3>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ADMISSION JOURNEY PROCESS */}
      <section className="bg-slate-50 py-24 relative overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/5 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
          <div className="text-center mb-20">
            <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-3">
              Journey Outline
            </p>
            <h2 className="text-4xl lg:text-5xl font-black text-[#062B78]">
              Transparent Admission Process
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -8 }}
                className="bg-white rounded-4xl p-7 shadow-[0_10px_35px_rgba(0,0,0,0.02)] border border-slate-100 hover:border-yellow-400/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 bg-yellow-400 text-black rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-[#062B78]">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 mt-3 text-xs leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCUMENTS REQUIRED */}
      <section className="bg-[#062B78] py-24 text-white relative overflow-hidden">
        {/* background glow */}
        <div className="absolute -bottom-25 left-10 w-96 h-96 bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
          <div className="text-center mb-16">
            <p className="uppercase tracking-[4px] text-yellow-400 font-bold text-xs mb-3">
              Required Documents
            </p>
            <h2 className="text-4xl lg:text-5xl font-black">
              Documents Checklist For Verification
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {requiredDocuments.map((doc, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-4xl p-8 hover:bg-white/10 hover:border-yellow-400/30 transition-all duration-300 text-center"
              >
                <div className="text-5xl mb-6 select-none">📄</div>
                <h3 className="text-2xl font-bold text-white">{doc.title}</h3>
                <p className="text-slate-300 mt-3 text-xs leading-relaxed">
                  {doc.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQS (REUSABLE ACCORDION SECTION) */}
      <FAQSection />

      {/* INQUIRY FORM */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center animate-[fadeUp_1s_ease-out]">
            {/* LEFT */}
            <div>
              <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-4">
                Admission Inquiry
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-[#062B78] leading-tight">
                Submit Your Admission Inquiry
              </h2>
              <p className="mt-6 text-slate-600 text-base leading-relaxed">
                Please fill out this form to contact our counseling office. Our
                admissions staff will verify open slots for the requested grade
                and contact you within 24 hours.
              </p>
              <div className="mt-8 flex flex-col gap-4 text-sm text-slate-500 font-medium">
                <p>📞 Bhabhar Office: +91 98765 43210</p>
                <p>✉️ Email: info@vedantschool.com</p>
                <p>🕒 Hours: Monday - Saturday (8:00 AM - 5:00 PM)</p>
              </div>
            </div>

            {/* FORM */}
            <InquiryForm type="admission" />
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <CallToAction
        title="Secure Your Child's Placement"
        highlightedTitle="For The Academic Year"
        description="Connect with Vedant Vidhya Sankul today. Meet our teachers, inspect our smart digital libraries, and register your admissions inquiry."
      />
    </div>
  );
}
