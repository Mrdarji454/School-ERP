import { motion } from "framer-motion";
import { schoolStats } from "../data/schoolData";

export default function StatsSection({ dark = false }) {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section
      className={`py-20 relative overflow-hidden ${dark ? "bg-[#062B78] text-white" : "bg-slate-50 text-slate-900"}`}
    >
      {/* Background glow graphics */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none opacity-40 transition-all ${dark ? "bg-yellow-400/10" : "bg-[#062B78]/5"}`}
      ></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {schoolStats.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`p-8 rounded-[30px] border backdrop-blur-md text-center transition-all duration-300 ${
                dark
                  ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-yellow-400/30 hover:shadow-[0_20px_50px_rgba(250,204,21,0.1)]"
                  : "bg-white border-slate-100 shadow-xl hover:shadow-2xl hover:border-yellow-400/40"
              }`}
            >
              <div
                className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-all duration-300 ${
                  dark
                    ? "bg-white/10 text-yellow-400"
                    : "bg-yellow-100 text-[#062B78]"
                }`}
              >
                {item.icon}
              </div>

              <h3
                className={`text-4xl lg:text-5xl font-black ${dark ? "text-yellow-400" : "text-[#062B78]"}`}
              >
                {item.value}
              </h3>

              <p
                className={`mt-3 font-semibold text-sm tracking-wide uppercase ${dark ? "text-slate-300" : "text-slate-700"}`}
              >
                {item.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
