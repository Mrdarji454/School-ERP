import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { schoolEvents } from "../data/schoolData";
import CallToAction from "../components/CallToAction";

export default function EventsPage() {
  const [viewUpcoming, setViewUpcoming] = useState(true);

  // Filter events based on active tab state
  const displayedEvents = schoolEvents.filter(e => e.upcoming === viewUpcoming);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="bg-white overflow-hidden text-slate-900">
      
      {/* HERO SECTION */}
      <section className="relative pt-40 pb-32 bg-[#062B78] text-white">
        <div className="absolute inset-0 opacity-15">
          <img
            src="https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop"
            alt="school events banner"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <p className="uppercase tracking-[5px] text-yellow-400 text-xs font-bold mb-4">
            Vedant Events
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight tracking-tight">
            Academic Expo, Sports
            <span className="text-yellow-400 block mt-2">& Cultural Celebrations</span>
          </h1>

          <p className="max-w-3xl mx-auto mt-8 text-base md:text-lg text-slate-200 leading-relaxed font-medium">
            Keep track of science fairs, programming workshops, house athletics meets, and parent-teacher assemblies in Bhabhar.
          </p>
        </div>
      </section>

      {/* FILTER BUTTONS / TAB SWITCHER */}
      <section className="pt-20 pb-6 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex justify-center">
          <div className="bg-slate-100 p-1.5 rounded-full inline-flex border border-slate-200 shadow-sm relative">
            {/* Sliding backdrop decoration */}
            <div className="relative flex items-center">
              <button
                onClick={() => setViewUpcoming(true)}
                className={`relative px-8 py-3.5 rounded-full font-bold text-sm transition-all duration-300 cursor-pointer ${
                  viewUpcoming 
                    ? "bg-[#062B78] text-white shadow-md scale-105" 
                    : "text-slate-600 hover:text-[#062B78]"
                }`}
              >
                Upcoming Events
              </button>
              
              <button
                onClick={() => setViewUpcoming(false)}
                className={`relative px-8 py-3.5 rounded-full font-bold text-sm transition-all duration-300 cursor-pointer ${
                  !viewUpcoming 
                    ? "bg-[#062B78] text-white shadow-md scale-105" 
                    : "text-slate-600 hover:text-[#062B78]"
                }`}
              >
                Past Highlights
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* EVENTS CARD GRID */}
      <section className="pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewUpcoming ? "upcoming-list" : "past-list"}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12"
            >
              {displayedEvents.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                  className="group bg-white rounded-[32px] overflow-hidden shadow-lg border border-slate-100 hover:border-yellow-400/30 hover:shadow-[0_20px_50px_rgba(6,43,120,0.06)] transition-all duration-500 flex flex-col justify-between h-full"
                >
                  <div>
                    {/* Image Box */}
                    <div className="overflow-hidden relative h-64">
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4 bg-yellow-400 text-black text-[10px] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-xs">
                        {item.category}
                      </div>
                      
                      {/* Badge indicator */}
                      <div className={`absolute bottom-4 right-4 text-[10px] px-3 py-1 rounded-full font-bold uppercase ${
                        viewUpcoming ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-100"
                      }`}>
                        {viewUpcoming ? "Upcoming" : "Completed"}
                      </div>
                    </div>

                    {/* Meta info / Details */}
                    <div className="p-8">
                      <span className="text-slate-400 text-xs font-semibold">{item.date}</span>
                      <h3 className="text-xl font-bold text-[#062B78] mt-3 group-hover:text-yellow-600 transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-slate-500 mt-4 text-xs leading-relaxed line-clamp-4">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* Register/Details link footer */}
                  <div className="p-8 pt-0 border-t border-slate-50 mt-4">
                    {viewUpcoming ? (
                      <button 
                        onClick={() => alert(`Registration details for "${item.title}" will open 2 weeks prior. Feel free to contact our Bhabhar office for information.`)}
                        className="w-full bg-[#062B78]/5 hover:bg-[#062B78] text-[#062B78] hover:text-white py-3.5 rounded-2xl text-xs font-bold text-center transition duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                      >
                        Register To Attend
                      </button>
                    ) : (
                      <button 
                        onClick={() => alert(`Photo album and recordings for "${item.title}" will be uploaded to our gallery shortly.`)}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-2xl text-xs font-bold text-center transition duration-300 cursor-pointer"
                      >
                        View Photo Album
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {displayedEvents.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400">
                  <p className="text-lg font-semibold">No events listed for this category currently.</p>
                  <p className="text-sm mt-1">Please check back soon for updates from our academic calendar.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* bottom CTA */}
      <CallToAction 
        title="Check Out Our Complete"
        highlightedTitle="Academic Calendar?"
        description="For terms dates, holiday lists, and semester exam timetables, download our complete prospectus or get in touch."
        primaryBtnText="Go to Contact Page"
        primaryBtnLink="/contact"
        secondaryBtnText="Download Prospectus"
        secondaryBtnLink="/admissions"
      />
    </div>
  );
}
