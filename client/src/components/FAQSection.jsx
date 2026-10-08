import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { schoolFAQs } from "../data/schoolData";
import { HiPlus, HiMinus } from "react-icons/hi";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-[#062B78]/5 blur-[160px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-3">
            FAQS
          </p>
          <h2 className="text-4xl lg:text-5xl font-black text-[#062B78]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {schoolFAQs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-7 text-left outline-none focus:outline-none"
                >
                  <span className="text-lg md:text-xl font-bold text-[#062B78] pr-4 select-none">
                    {faq.question}
                  </span>

                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                      isOpen
                        ? "bg-[#062B78] text-white"
                        : "bg-slate-100 text-[#062B78] hover:bg-slate-200"
                    }`}
                  >
                    {isOpen ? <HiMinus /> : <HiPlus />}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-7 pb-8 text-slate-700 text-sm leading-relaxed border-t border-slate-100 pt-5 select-none">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
