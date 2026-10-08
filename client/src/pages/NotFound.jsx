import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 relative overflow-hidden text-slate-900">
      
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#062B78]/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="text-center relative z-10 max-w-lg">
        {/* Floating Number */}
        <motion.div
          animate={{
            y: [0, -15, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-9xl md:text-[180px] font-black text-[#062B78] tracking-widest leading-none drop-shadow-sm select-none"
        >
          404
        </motion.div>

        {/* Logo Text */}
        <div className="mt-6 flex flex-col items-center">
          <span className="bg-yellow-400 text-black px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Page Not Found
          </span>
        </div>

        <h2 className="text-3xl font-black text-[#062B78] mt-8">
          Lost Your Way?
        </h2>

        <p className="text-slate-500 mt-4 leading-relaxed text-sm">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let's get you back to Vedant Vidhya Sankul home.
        </p>

        <div className="mt-10">
          <Link
            to="/"
            className="inline-block bg-[#062B78] hover:bg-black text-white px-9 py-4 rounded-full font-bold transition duration-300 shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
          >
            Back To Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
