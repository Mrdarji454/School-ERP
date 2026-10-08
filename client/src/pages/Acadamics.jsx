import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ProgramsGrid from "../components/ProgramsGrid";
import FacilitiesSection from "../components/FacilitiesSection";
import CallToAction from "../components/CallToAction";
import { schoolEvents } from "../data/schoolData";

function AcademicsPage() {
  const academicEvents = schoolEvents
    .filter((e) => e.category === "Academic" || e.category === "Workshop")
    .slice(0, 3);

  return (
    <div className="bg-white overflow-hidden text-slate-900">
      {/* HERO SECTION */}
      <section className="relative pt-40 pb-32 bg-[#062B78] text-white">
        <div className="absolute inset-0 opacity-15">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop"
            alt="academics dashboard banner"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <p className="uppercase tracking-[5px] text-yellow-400 text-xs font-bold mb-4">
            Academics
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight tracking-tight">
            Excellence In
            <span className="text-yellow-400 block mt-2">
              Learning & Scientific Innovation
            </span>
          </h1>

          <p className="max-w-3xl mx-auto mt-8 text-base md:text-lg text-slate-200 leading-relaxed font-medium">
            Empowering students in Bhabhar, Gujarat with high-tech facilities,
            smart learning environments, and boards guidance.
          </p>
        </div>
      </section>

      {/* INTRO PHILOSOPHY */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-28 grid lg:grid-cols-2 gap-20 items-center">
        {/* LEFT COLUMN - IMAGE */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -bottom-5 -right-5 w-full h-full border-[6px] border-yellow-400 rounded-[30px] pointer-events-none"></div>
          <img
            src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop"
            alt="school learning activities"
            className="relative rounded-[30px] shadow-2xl object-cover w-full h-100 border border-slate-100"
          />
        </motion.div>

        {/* RIGHT COLUMN - CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-4">
            Academic Philosophy
          </p>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#062B78] leading-tight">
            Conceptual Study Beyond Standard Books
          </h2>

          <p className="mt-6 text-base leading-relaxed text-slate-700">
            Vedant Vidhya Sankul promotes conceptual inquiry, group project
            collaboration, science lab experimentation, and public presentation
            confidence to prepare children for board tests and career
            competitions.
          </p>

          <div className="grid sm:grid-cols-2 gap-5 mt-10">
            {[
              "Highly Interactive Lessons",
              "Coding & Arduino Workshops",
              "Project-Based Syllabus",
              "Hands-on Science Practical",
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

      {/* PROGRAMS STRUCTURE (REUSABLE GRID) */}
      <ProgramsGrid
        showHeader={true}
        title="Structured Programs Outline"
        subtitle="Educational Structure"
      />

      {/* DETAILED SUBJECTS OFFERED */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Glow Background shapes */}
        <div className="absolute top-1/2 left-10 w-64 h-64 bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
          <div className="text-center mb-16">
            <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-3">
              Subjects Offered
            </p>
            <h2 className="text-4xl lg:text-5xl font-black text-[#062B78]">
              Comprehensive Curriculum
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Mathematics",
                icon: "📐",
                desc: "Core conceptual math, geometry derivations, active algebra practices, and Olympiad mock testing.",
              },
              {
                title: "Sciences",
                icon: "🔬",
                desc: "Interactive Physics, Chemistry, and Biology experiments carried out in our state-of-the-art scientific labs.",
              },
              {
                title: "Computer Science",
                icon: "💻",
                desc: "Introduction to HTML, CSS, JavaScript, coding syntax, algorithms, database logic, and logic sheets.",
              },
              {
                title: "English Literature",
                icon: "📖",
                desc: "Developing strong grammar fundamentals, active communication, prose analysis, drama, and debate training.",
              },
              {
                title: "Social Studies",
                icon: "🌍",
                desc: "Understanding geography, world histories, state civil structures, economics, and environmental responsibilities.",
              },
              {
                title: "Artificial Intelligence",
                icon: "🤖",
                desc: "Advanced learning streams introducing machine learning concepts, AI frameworks, and automation ethics.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-4xl p-10 border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:shadow-2xl hover:border-yellow-400/40 transition-all duration-500"
              >
                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center text-3xl mb-6 text-[#062B78]">
                  {item.icon}
                </div>

                <h3 className="text-2xl font-bold text-[#062B78]">
                  {item.title}
                </h3>

                <p className="text-slate-500 mt-4 leading-relaxed text-sm">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FACILITIES (REUSABLE SECTION) */}
      <FacilitiesSection
        dark={true}
        title="Modern Infrastructure for Smart Learning"
        subtitle="Campus Facilities"
      />

      {/* ACADEMIC WORKSHOPS & EVENTS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16">
          <div>
            <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-3">
              Workshops & Seminars
            </p>
            <h2 className="text-4xl lg:text-5xl font-black text-[#062B78]">
              Academic Learning Events
            </h2>
          </div>

          <Link
            to="/events"
            className="bg-[#062B78] hover:bg-black text-white px-8 py-3.5 rounded-full font-bold transition duration-300 hover:scale-105 inline-block text-center shadow-md"
          >
            Explore All Events
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {academicEvents.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -8 }}
              className="group rounded-4xl overflow-hidden shadow-lg bg-white border border-slate-100 hover:border-yellow-400/30 transition-all duration-500 flex flex-col justify-between h-full"
            >
              <div>
                <div className="overflow-hidden relative h-64">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 bg-yellow-400 text-black text-[10px] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider">
                    {item.category}
                  </div>
                </div>

                <div className="p-8">
                  <span className="text-slate-400 text-xs font-semibold">
                    {item.date}
                  </span>
                  <h3 className="text-2xl font-bold text-[#062B78] mt-3 group-hover:text-yellow-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 mt-4 text-sm leading-relaxed line-clamp-3">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="p-8 pt-0">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 text-yellow-500 font-bold hover:text-yellow-600 transition-colors duration-200"
                >
                  View Seminar Details →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* bottom CTA */}
      <CallToAction
        title="Ready To Elevate Your"
        highlightedTitle="Academic Success?"
        description="Experience CBSE-aligned board syllabus education, robotics coding courses, and creative activities in Bhabhar, Gujarat."
      />
    </div>
  );
}

export default AcademicsPage;
