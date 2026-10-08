import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { galleryItems, schoolEvents } from "../data/schoolData";
import StatsSection from "../components/StatsSection";
import CallToAction from "../components/CallToAction";
import { HiX } from "react-icons/hi";

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activePhoto, setActivePhoto] = useState(null);

  const categories = [
    "All",
    "Events",
    "Sports",
    "Campus",
    "Activities",
    "Workshops",
  ];

  const filteredItems =
    selectedCategory === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === selectedCategory);

  const highlightedEvents = schoolEvents.slice(0, 3);

  return (
    <div className="bg-white overflow-hidden text-slate-900">
      {/* HERO SECTION */}
      <section className="relative pt-40 pb-32 bg-[#062B78] text-white">
        <div className="absolute inset-0 opacity-15">
          <img
            src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop"
            alt="gallery banner"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <p className="uppercase tracking-[5px] text-yellow-400 text-xs font-bold mb-4">
            School Gallery
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight tracking-tight">
            Capturing Moments
            <span className="text-yellow-400 block mt-2">
              Creating Memories
            </span>
          </h1>

          <p className="max-w-3xl mx-auto mt-8 text-base md:text-lg text-slate-200 leading-relaxed font-medium">
            Explore active moments of learning, laboratory experiments, sports
            championships, and cultural celebrations at Bhabhar.
          </p>
        </div>
      </section>

      {/* INTRO SECTION */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 grid lg:grid-cols-2 gap-20 items-center">
        {/* LEFT COLUMN - TEXT */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-4">
            Campus Life
          </p>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#062B78] leading-tight">
            Vibrant Experiences Beyond Books
          </h2>

          <p className="mt-6 text-slate-600 text-base leading-relaxed">
            At Vedant Vidhya Sankul, education is active and multi-dimensional.
            Our campus hosts regular sports meets, coding competitions,
            classical/modern music festivals, and interactive workshops.
          </p>

          <div className="grid sm:grid-cols-2 gap-5 mt-10">
            {[
              "Annual Functions",
              "Inter-school Sports",
              "Science & STEM Fairs",
              "Skills Coding Camps",
            ].map((item, index) => (
              <div
                key={index}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center gap-4 hover:border-yellow-400/30 transition duration-300"
              >
                <div className="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center text-xl text-[#062B78]">
                  ✦
                </div>
                <h3 className="font-bold text-sm text-[#062B78]">{item}</h3>
              </div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT COLUMN - IMAGE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -top-5 -left-5 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
            alt="students project"
            className="relative rounded-[40px] shadow-2xl object-cover w-full h-100 border border-slate-100"
          />
        </motion.div>
      </section>

      {/* FILTER BUTTONS */}
      <section className="pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(cat)}
                className={`px-7 py-3 rounded-full font-bold text-sm transition-all duration-300 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#062B78] text-white shadow-lg scale-105"
                    : "bg-slate-100 text-slate-600 hover:bg-[#062B78] hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTO MASONRY GRID */}
      <section className="pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <motion.div
            layout
            className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
          >
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -6 }}
                  onClick={() => setActivePhoto(item)}
                  className="group relative overflow-hidden rounded-4xl border border-slate-100 shadow-md cursor-zoom-in break-inside-avoid"
                >
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full object-cover rounded-4xl group-hover:scale-105 transition duration-700"
                    loading="lazy"
                  />

                  {/* Overlay text */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                    <span className="bg-yellow-400 text-black px-4 py-2 rounded-full text-xs font-bold self-start mb-3">
                      {item.category}
                    </span>
                    <h3 className="text-white text-2xl font-bold">
                      {item.title}
                    </h3>
                    <p className="text-slate-200 mt-2 text-xs leading-relaxed">
                      Click to expand image
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* VIDEO TOUR SECTION */}
      <section className="bg-[#062B78] py-28 text-white relative overflow-hidden">
        {/* glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-yellow-400/5 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-20 items-center relative z-10">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="uppercase tracking-[4px] text-yellow-400 font-bold text-xs mb-4">
              Virtual Campus Tour
            </p>
            <h2 className="text-3xl md:text-5xl font-black leading-tight">
              Take A Tour Around Our Dynamic Campus
            </h2>
            <p className="mt-6 text-slate-200 text-base leading-relaxed">
              Explore smart science experiment workstations, high-speed robotics
              coding tables, multi-media digital libraries, athletic tracks, and
              assembly halls.
            </p>
            <Link
              to="/contact"
              className="mt-8 bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-4 rounded-full font-bold transition duration-300 shadow-xl hover:scale-105 inline-block text-center cursor-pointer"
            >
              Book Physical Visit
            </Link>
          </motion.div>

          {/* RIGHT - VIDEO EMBED WRAPPER */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative group overflow-hidden rounded-[40px] shadow-2xl border border-white/10"
          >
            <img
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop"
              alt="campus visual preview"
              className="w-full h-87.5 object-cover group-hover:scale-105 transition duration-700"
              loading="lazy"
            />
            {/* Play overlay button */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <button
                onClick={() =>
                  alert(
                    "Virtual Video Tour coming soon! Please visit our Bhabhar campus for a physical tour.",
                  )
                }
                className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full border border-white/30 flex items-center justify-center text-3xl hover:scale-115 hover:bg-[#062B78] hover:text-white transition duration-300 shadow-2xl cursor-pointer"
              >
                ▶
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HIGHLIGHTED FEATURED EVENTS */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16">
            <div>
              <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-3">
                Featured Highlights
              </p>
              <h2 className="text-4xl lg:text-5xl font-black text-[#062B78]">
                Featured School Events
              </h2>
            </div>
            <Link
              to="/events"
              className="border-2 border-[#062B78] text-[#062B78] hover:bg-[#062B78] hover:text-white px-8 py-3.5 rounded-full font-bold transition duration-300 hover:scale-105 inline-block text-center shadow-xs"
            >
              View All Events
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {highlightedEvents.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -8 }}
                className="group bg-white rounded-4xl overflow-hidden shadow-lg border border-slate-100 hover:border-yellow-400/30 transition duration-500 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="overflow-hidden relative h-60">
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
                    <h3 className="text-xl font-bold text-[#062B78] mt-3 group-hover:text-yellow-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 mt-4 text-xs leading-relaxed line-clamp-3">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="p-8 pt-0 border-t border-slate-50 mt-4 flex items-center">
                  <Link
                    to="/events"
                    className="text-yellow-500 font-bold text-sm hover:text-yellow-600 transition duration-200"
                  >
                    View Album Details →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS COUNT GRID (REUSABLE) */}
      <StatsSection dark={false} />

      {/* bottom CTA */}
      <CallToAction
        title="Witness The Vibrant Spirit"
        highlightedTitle="Of Vedant Vidhya Sankul"
        description="Become part of an academic community dedicated to innovation, values, and global excellence. Schedule a meeting with our counselors today."
      />

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            {/* Close trigger overlay */}
            <div
              className="absolute inset-0 cursor-zoom-out"
              onClick={() => setActivePhoto(null)}
            ></div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-4xl overflow-hidden shadow-2xl z-10"
            >
              {/* Close Button */}
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-2xl transition duration-200 z-20 cursor-pointer"
              >
                <HiX />
              </button>

              <div className="relative h-1125 md:h-137.5 w-full">
                <img
                  src={activePhoto.img}
                  alt={activePhoto.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-8 text-white relative bg-slate-900 border-t border-slate-800">
                <span className="bg-yellow-400 text-black text-[10px] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider">
                  {activePhoto.category}
                </span>
                <h3 className="text-2xl md:text-3xl font-black mt-4 text-white">
                  {activePhoto.title}
                </h3>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  Moments captured live during school events at Vedant Vidhya
                  Sankul campus.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
