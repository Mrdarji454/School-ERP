import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import vidhyabharti from "../assets/vidhyabharti.png";
import HomeHerodiv from "../components/homepage/homeherodiv";
import ProgramsGrid from "../components/ProgramsGrid";
import StatsSection from "../components/StatsSection";
import CallToAction from "../components/CallToAction";
import { schoolBlogs, galleryItems } from "../data/schoolData";

function Home() {
  // Take first 3 blogs for homepage display
  const featuredBlogs = schoolBlogs.slice(0, 3);

  // Take first 4 gallery items for homepage display
  const featuredGallery = galleryItems.slice(0, 4);

  return (
    <div className="bg-white text-slate-900 overflow-hidden">
      {/* HERO SECTION */}
      <HomeHerodiv />

      {/* CORE STRENGTHS / FEATURES */}
      <section className="relative -mt-10 z-20 px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto bg-white/95 backdrop-blur-xl rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 p-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {[
            {
              icon: "🎓",
              title: "Quality Education",
              desc: "Rigorous standards developing sound academic foundations and life skills.",
            },
            {
              icon: "🏆",
              title: "Achievements",
              desc: "Consistently winning state level olympiads, sports tournaments, and arts prizes.",
            },
            {
              icon: "💻",
              title: "Smart Classrooms",
              desc: "Conceptual visual learning aided by touchscreens, audio systems, and digital boards.",
            },
            {
              icon: "⚽",
              title: "Sports & Activities",
              desc: "Dedicated sports coaching complex for cricket, football, basketball, and indoor gymnastics.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -6 }}
              className="group relative flex flex-col gap-4 p-5 rounded-3xl hover:bg-slate-50 transition-all duration-300 border border-transparent hover:border-slate-100"
            >
              <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center text-2xl group-hover:bg-yellow-400 group-hover:text-black transition-all duration-500 shadow-xs">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 group-hover:text-[#062B78] transition duration-300">
                  {item.title}
                </h3>
                <p className="text-slate-500 mt-2 text-xs leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ABOUT US PREVIEW SECTION */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-28 grid lg:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -bottom-6 -right-6 w-full h-full border-[6px] border-yellow-400 rounded-[40px] pointer-events-none"></div>
          <img
            src={vidhyabharti}
            alt="Vedant School Campus Activity"
            className="relative rounded-[40px] shadow-xl object-cover w-full h-[400px] border border-slate-100"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-4">
            About Our School
          </p>

          <h2 className="text-4xl md:text-5xl font-black leading-tight text-[#062B78]">
            Nurturing Excellence, Inspiring Leadership
          </h2>

          <p className="mt-6 leading-relaxed text-base text-slate-700">
            Vedant Vidhya Sankul in Bhabhar, Gujarat provides a highly
            supportive, tech-enabled study environment. We focus on personal
            character development, creative capability, and advanced board exam
            preparation.
          </p>

          <p className="mt-4 leading-relaxed text-sm text-slate-700">
            Our campus brings together smart science labs, expert instruction,
            competitive athletics, and coding curriculums to prepare students
            for the demands of the modern world.
          </p>

          <Link
            to="/about"
            className="mt-8 inline-block bg-[#062B78] hover:bg-black text-white px-8 py-4 rounded-full font-bold transition duration-300 shadow-md hover:scale-105 active:scale-95"
          >
            Know More About Us
          </Link>
        </motion.div>
      </section>

      {/* PROGRAMS GRIDS (REUSABLE COMPONENT) */}
      <ProgramsGrid
        showHeader={true}
        title="Academics That Inspire"
        subtitle="Our Programs"
      />

      {/* STATS COUNT (REUSABLE COMPONENT) */}
      <StatsSection dark={true} />

      {/* GALLERY HIGHLIGHTS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-16">
            <div>
              <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-3">
                Campus Life
              </p>
              <h2 className="text-4xl lg:text-5xl font-black text-[#062B78]">
                Moments That Inspire
              </h2>
            </div>

            <Link
              to="/gallery"
              className="border-2 border-[#062B78] text-[#062B78] hover:bg-[#062B78] hover:text-white px-8 py-3.5 rounded-full font-bold transition duration-300 hover:scale-105 inline-block text-center"
            >
              View Full Gallery
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGallery.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -8 }}
                className="group overflow-hidden rounded-[30px] relative shadow-md h-80"
              >
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-750"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                  <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-[10px] font-bold self-start mb-2">
                    {item.category}
                  </span>
                  <h3 className="text-white text-lg font-bold">{item.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWS & BLOG FEED */}
      <section className="bg-[#062B78] py-24 text-white relative overflow-hidden">
        {/* Glow decorative circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-400/5 blur-[160px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
          <div className="text-center mb-16">
            <p className="uppercase tracking-[4px] text-yellow-400 font-bold text-xs mb-3">
              Latest Updates
            </p>
            <h2 className="text-4xl md:text-5xl font-black">News & Insights</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredBlogs.map((blog) => (
              <motion.div
                key={blog.id}
                whileHover={{ y: -10 }}
                className="bg-white text-black rounded-[32px] overflow-hidden group shadow-2xl flex flex-col justify-between h-full border border-slate-100"
              >
                <div>
                  <div className="overflow-hidden relative h-56">
                    <img
                      src={blog.img}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 bg-yellow-400 text-black text-[10px] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider">
                      {blog.category}
                    </div>
                  </div>

                  <div className="p-7">
                    <span className="text-slate-400 text-xs font-semibold">
                      {blog.date}
                    </span>
                    <h3 className="text-xl font-bold mt-3 text-[#062B78] leading-snug group-hover:text-yellow-600 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-slate-500 text-xs mt-3 leading-relaxed line-clamp-3">
                      {blog.desc}
                    </p>
                  </div>
                </div>

                <div className="px-7 pb-7 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    By {blog.author.split(" ")[0]}
                  </span>

                  <Link
                    to="/blog"
                    className="text-[#062B78] font-bold text-sm hover:text-yellow-600 transition duration-300 inline-flex items-center gap-1 group-hover:translate-x-1"
                  >
                    Read Article →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FOOTER COMPONENT */}
      <CallToAction
        title="Ready To Start Your"
        highlightedTitle="Academic Journey?"
        description="Begin admissions for the 2026 school year. Speak with our Bhabhar office counselors, explore study programs, and register today."
      />
    </div>
  );
}

export default Home;
