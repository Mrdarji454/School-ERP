import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ProgramsGrid from "../components/ProgramsGrid";
import StatsSection from "../components/StatsSection";
import FacilitiesSection from "../components/FacilitiesSection";
import CallToAction from "../components/CallToAction";
import { schoolEvents } from "../data/schoolData";

function AboutPage() {
  // Take upcoming events
  const featuredEvents = schoolEvents.filter((e) => e.upcoming).slice(0, 3);

  return (
    <div className="bg-white overflow-hidden text-slate-900">
      {/* HERO SECTION */}
      <section className="relative pt-40 pb-32 bg-[#062B78] text-white">
        <div className="absolute inset-0 opacity-15">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1600&auto=format&fit=crop"
            alt="about school banner"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <p className="uppercase tracking-[5px] text-yellow-400 text-xs font-bold mb-4">
            About Vedant Vidhya Sankul
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight tracking-tight">
            Shaping Future Leaders
            <span className="text-yellow-400 block mt-2">
              With Values & Excellence
            </span>
          </h1>

          <p className="max-w-3xl mx-auto mt-8 text-base md:text-lg text-slate-200 leading-relaxed">
            Empowering students in Bhabhar, Gujarat through academic quality,
            scientific robotics labs, sports coaching, and strong ethical
            values.
          </p>
        </div>
      </section>

      {/* ABOUT SCHOOL VALUES */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-28 grid lg:grid-cols-2 gap-20 items-center">
        {/* LEFT COLUMN - IMAGE */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -top-5 -left-5 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <img
            src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop"
            alt="students learning together"
            className="relative rounded-[40px] shadow-2xl border border-slate-100 object-cover w-full h-112.5"
          />
        </motion.div>

        {/* RIGHT COLUMN - TEXT */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-4">
            Our Core Vision
          </p>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#062B78] leading-tight">
            Creating Thinkers, Leaders & Innovators
          </h2>

          <p className="mt-6 text-base leading-relaxed text-slate-700">
            At Vedant Vidhya Sankul, we believe learning should extend beyond
            classrooms. We offer hands-on practical experiments, robotic
            automation tasks, and physical athletics to prepare students for
            real-world contributions.
          </p>

          <div className="grid sm:grid-cols-2 gap-5 mt-10">
            {[
              "Smart Classroom Study",
              "Creative Cultural Arts",
              "Advanced Sports Complexes",
              "Future Ready AI Skills",
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-yellow-400/30 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-xl text-[#062B78]">
                  ✦
                </div>
                <h3 className="font-bold text-sm text-[#062B78]">{item}</h3>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* PROGRAMS DYNAMIC GRID (REUSABLE COMPONENT) */}
      <ProgramsGrid
        showHeader={true}
        title="Academic Streams Offered"
        subtitle="School Levels"
      />

      {/* STATS SECTION (REUSABLE COMPONENT) */}
      <StatsSection dark={false} />

      {/* EVENTS SUMMARY / PREVIEW */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16">
          <div>
            <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-3">
              School Events
            </p>
            <h2 className="text-4xl lg:text-5xl font-black text-[#062B78]">
              Experiences Beyond Classrooms
            </h2>
          </div>

          <Link
            to="/events"
            className="bg-[#062B78] hover:bg-black text-white px-8 py-3.5 rounded-full font-bold transition duration-300 hover:scale-105 inline-block text-center shadow-md"
          >
            View All Events
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {featuredEvents.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -8 }}
              className="group rounded-4xl overflow-hidden shadow-lg bg-white border border-slate-100 hover:border-yellow-400/30 transition-all duration-500 flex flex-col h-full justify-between"
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
                  Explore Event Details →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FACILITIES GRID (REUSABLE COMPONENT) */}
      <FacilitiesSection
        dark={true}
        title="Modern Facilities & Learning Infrastructure"
        subtitle="Smart Campus"
      />

      {/* CTA BOTTOM PANELS */}
      <CallToAction
        title="Ready To Prepare Your"
        highlightedTitle="Child For The Future?"
        description="Enrollment at Vedant Vidhya Sankul, Bhabhar is open for primary, secondary and senior secondary students. Download the guidelines or submit a request."
      />
    </div>
  );
}

export default AboutPage;
