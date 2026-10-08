import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { academicPrograms } from "../data/schoolData";

export default function ProgramsGrid({
  showHeader = true,
  title = "Academics That Inspire",
  subtitle = "Our Programs",
}) {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative blurred circles */}
      <div className="absolute top-0 right-0 w-100 h-100 bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-125 h-125 bg-[#062B78]/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
        {showHeader && (
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-6">
            <div>
              <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-3">
                {subtitle}
              </p>
              <h2 className="text-4xl lg:text-5xl font-black text-[#062B78] leading-tight">
                {title}
              </h2>
            </div>

            <Link
              to="/academics"
              className="inline-flex items-center gap-2 bg-[#062B78] text-white px-7 py-3.5 rounded-full font-semibold shadow-lg hover:bg-black transition duration-300 group hover:scale-105"
            >
              Explore Curriculum
              <span className="transform group-hover:translate-x-1 transition duration-200">
                →
              </span>
            </Link>
          </div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {academicPrograms.map((program, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -12, scale: 1.02 }}
              className="group bg-white rounded-4xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.05)] border border-slate-100/80 hover:border-yellow-400/30 hover:shadow-[0_20px_50px_rgba(6,43,120,0.08)] transition-all duration-500 flex flex-col h-full"
            >
              {/* Image Section */}
              <div className="overflow-hidden relative h-56">
                <img
                  src={program.img}
                  alt={program.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/45 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
              </div>

              {/* Content Section */}
              <div className="p-7 flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#062B78] group-hover:text-yellow-600 transition-colors duration-300">
                    {program.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-slate-700">
                    {program.desc}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100">
                  <Link
                    to={program.link}
                    className="inline-flex items-center gap-2 text-yellow-500 font-bold hover:text-yellow-600 transition-colors group-hover:translate-x-1.5 duration-300"
                  >
                    Learn More
                    <span className="transition duration-200">→</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
