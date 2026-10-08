import { motion } from "framer-motion";
import { schoolFacilities } from "../data/schoolData";

export default function FacilitiesSection({ 
  dark = false,
  title = "Smart Learning Infrastructure",
  subtitle = "Facilities" 
}) {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section className={`py-24 relative overflow-hidden ${dark ? "bg-[#062B78] text-white" : "bg-slate-50 text-slate-900"}`}>
      {/* Background graphics */}
      <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none opacity-30 ${dark ? "bg-yellow-400/10" : "bg-yellow-200/20"}`}></div>
      <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-30 ${dark ? "bg-blue-400/10" : "bg-blue-200/10"}`}></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
        <div className="text-center mb-16">
          <p className={`uppercase tracking-[4px] font-bold text-xs mb-3 ${dark ? "text-yellow-400" : "text-yellow-500"}`}>
            {subtitle}
          </p>
          <h2 className={`text-4xl lg:text-5xl font-black ${dark ? "text-white" : "text-[#062B78]"}`}>
            {title}
          </h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {schoolFacilities.map((facility, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`p-10 rounded-[32px] border backdrop-blur-md transition-all duration-500 ${
                dark 
                  ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-yellow-400/30 hover:shadow-[0_20px_50px_rgba(250,204,21,0.08)]" 
                  : "bg-white border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-yellow-400/30 hover:shadow-[0_20px_50px_rgba(6,43,120,0.04)]"
              }`}
            >
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-sm transition-all duration-300 ${
                dark ? "bg-yellow-400 text-black" : "bg-yellow-100 text-[#062B78]"
              }`}>
                {facility.icon}
              </div>

              <h3 className={`text-2xl font-bold ${dark ? "text-white" : "text-[#062B78]"}`}>
                {facility.title}
              </h3>

              <p className={`mt-4 leading-relaxed text-sm ${dark ? "text-slate-300" : "text-slate-500"}`}>
                {facility.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
