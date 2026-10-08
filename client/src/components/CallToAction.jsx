import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function CallToAction({
  title = "Ready To Build",
  highlightedTitle = "Your Child's Future?",
  description = "Join Vedant Vidhya Sankul and become part of an academic community dedicated to innovation, values, and global excellence.",
  primaryBtnText = "Apply For Admission",
  primaryBtnLink = "/admissions",
  secondaryBtnText = "Contact School",
  secondaryBtnLink = "/contact",
}) {
  return (
    <section className="py-24 bg-[#062B78] text-white text-center relative overflow-hidden">
      {/* Dynamic Animated Particles/Shapes */}
      <div className="absolute top-20 left-20 w-64 h-64 border border-white/5 rounded-full animate-bounce duration-[15s]"></div>
      <div className="absolute bottom-25 right-25 w-96 h-96 bg-yellow-400/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute top-1/2 left-10 w-4 h-4 bg-yellow-400/20 rounded-full animate-ping"></div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
            {title}
            <span className="text-yellow-400 block mt-2">
              {highlightedTitle}
            </span>
          </h2>

          <p className="mt-8 text-lg md:text-xl text-slate-200 leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>

          <div className="flex flex-wrap justify-center gap-5 mt-12">
            <Link
              to={primaryBtnLink}
              className="bg-yellow-400 hover:bg-yellow-300 text-black px-9 py-4 rounded-full font-bold transition duration-300 shadow-xl hover:scale-105 inline-block"
            >
              {primaryBtnText}
            </Link>

            <Link
              to={secondaryBtnLink}
              className="border-2 border-white/80 hover:bg-white hover:text-black px-9 py-4 rounded-full font-bold transition duration-300 hover:scale-105 inline-block"
            >
              {secondaryBtnText}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
