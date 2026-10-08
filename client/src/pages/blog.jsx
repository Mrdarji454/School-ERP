import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { schoolBlogs } from "../data/schoolData";
import CallToAction from "../components/CallToAction";

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const categories = ["All", "School News", "Achievements", "Technology", "Sports", "Education"];

  const filteredBlogs = selectedCategory === "All"
    ? schoolBlogs
    : schoolBlogs.filter(blog => blog.category === selectedCategory);

  // Take the first blog as the Featured Story
  const featuredBlog = schoolBlogs[0];

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!emailInput) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmailInput("");
    }, 4000);
  };

  return (
    <div className="bg-white overflow-hidden text-slate-900">
      
      {/* HERO SECTION */}
      <section className="relative pt-40 pb-32 bg-[#062B78] text-white">
        <div className="absolute inset-0 opacity-15">
          <img
            src="https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1600&auto=format&fit=crop"
            alt="school blogs banner"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <p className="uppercase tracking-[5px] text-yellow-400 text-xs font-bold mb-4">
            School Blog & Updates
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight tracking-tight">
            Stories, Research &
            <span className="text-yellow-400 block mt-2">Student Accomplishments</span>
          </h1>

          <p className="max-w-3xl mx-auto mt-8 text-base md:text-lg text-slate-200 leading-relaxed font-medium">
            Discover student research projects, campus activities, technology bootcamp summaries, and announcements from Bhabhar.
          </p>
        </div>
      </section>

      {/* FEATURED STORY */}
      {featuredBlog && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* IMAGE */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative group overflow-hidden rounded-[40px] border border-slate-100 shadow-md h-[400px]"
            >
              <img
                src={featuredBlog.img}
                alt="featured blog thumbnail"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                loading="lazy"
              />
              <div className="absolute top-6 left-6 bg-yellow-400 text-black px-5 py-2 rounded-full text-xs font-bold shadow-md">
                Featured Story
              </div>
            </motion.div>

            {/* CONTENT */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-4">
                Featured Article
              </p>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#062B78] leading-tight">
                {featuredBlog.title}
              </h2>

              <p className="mt-6 text-slate-600 text-base leading-relaxed">
                {featuredBlog.desc}
              </p>

              <div className="flex items-center gap-4 mt-8 border-t border-slate-100 pt-6">
                <img
                  src={featuredBlog.authorImg}
                  alt="author portrait"
                  className="w-12 h-12 rounded-full border border-slate-100 shadow-sm"
                  loading="lazy"
                />
                <div>
                  <h4 className="font-bold text-sm text-[#062B78]">{featuredBlog.author}</h4>
                  <p className="text-slate-400 text-xs">{featuredBlog.date} • {featuredBlog.category}</p>
                </div>
              </div>
            </motion.div>

          </div>
        </section>
      )}

      {/* CATEGORIES NAVIGATION */}
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

      {/* BLOG DYNAMIC GRID */}
      <section className="pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <motion.div 
            layout
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredBlogs.map((blog) => (
                <motion.div
                  key={blog.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -8 }}
                  className="group bg-white rounded-[32px] overflow-hidden shadow-md border border-slate-100 hover:border-yellow-400/30 hover:shadow-[0_20px_50px_rgba(6,43,120,0.06)] transition-all duration-500 flex flex-col justify-between h-full"
                >
                  <div>
                    {/* Image thumbnail */}
                    <div className="overflow-hidden relative h-56">
                      <img
                        src={blog.img}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4 bg-yellow-400 text-black text-[10px] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-xs">
                        {blog.category}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="p-7">
                      <span className="text-slate-400 text-xs font-semibold">{blog.date}</span>
                      <h3 className="text-xl font-bold text-[#062B78] mt-3 group-hover:text-yellow-600 transition-colors leading-snug">
                        {blog.title}
                      </h3>
                      <p className="text-slate-500 mt-4 text-xs leading-relaxed line-clamp-3">
                        {blog.desc}
                      </p>
                    </div>
                  </div>

                  {/* Author / Read More Footer */}
                  <div className="p-7 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={blog.authorImg}
                        alt={blog.author}
                        className="w-8 h-8 rounded-full border border-slate-100"
                        loading="lazy"
                      />
                      <span className="text-xs font-semibold text-slate-500 truncate max-w-[120px]">
                        {blog.author.split(" ")[0] + " " + (blog.author.split(" ")[1] || "")}
                      </span>
                    </div>

                    <button 
                      onClick={() => alert(`"${blog.title}" full article content is under development. Please check back soon!`)}
                      className="text-[#062B78] font-bold text-xs hover:text-yellow-600 transition-colors duration-200 inline-flex items-center gap-1 group-hover:translate-x-1 cursor-pointer"
                    >
                      Read Story →
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* DYNAMIC ANNOUNCEMENT BOXES */}
      <section className="bg-[#062B78] py-24 text-white relative overflow-hidden">
        {/* decor elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/5 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
          <div className="text-center mb-16">
            <p className="uppercase tracking-[4px] text-yellow-400 font-bold text-xs mb-3">
              Announcements
            </p>
            <h2 className="text-4xl md:text-5xl font-black">
              Official School Board News
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { title: "Admissions Open For 2026-27", desc: "Grade allocation seats are filled based on basic parent interaction. Submitting inquiry early is advised.", link: "/admissions" },
              { title: "Robotics STEM Labs Launching", desc: "A brand new science and engineering coding laboratory room is now open for students starting middle school classes.", link: "/academics" },
              { title: "Sports Athletic Registration", desc: "Coaching classes registration for cricket league nets, inter-state track races, and table tennis divisions starts soon.", link: "/events" }
            ].map((news, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -6 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] p-8 hover:bg-white/10 hover:border-yellow-400/30 transition-all duration-300 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="w-14 h-14 bg-yellow-400 text-black rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm">
                    📰
                  </div>
                  <h3 className="text-xl font-bold text-white leading-snug">
                    {news.title}
                  </h3>
                  <p className="text-slate-300 mt-4 text-xs leading-relaxed">
                    {news.desc}
                  </p>
                </div>

                <div className="mt-8 pt-5 border-t border-white/10">
                  <a
                    href={news.link}
                    className="text-yellow-400 font-bold text-sm hover:text-yellow-300 transition-colors inline-block"
                  >
                    Check Details →
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DYNAMIC NEWSLETTER SUBSCRIPTION */}
      <section className="py-24 bg-white relative">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-4">
            Newsletter
          </p>

          <h2 className="text-3xl md:text-5xl font-black text-[#062B78] leading-tight">
            Subscribe For Educational Insights
          </h2>

          <p className="mt-6 text-slate-500 text-base leading-relaxed max-w-xl mx-auto">
            Stay updated with student achievements, upcoming events highlights, coding workshops calendars, and science practical blogs.
          </p>

          <AnimatePresence mode="wait">
            {!subscribed ? (
              <motion.form
                key="sub-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-4 mt-10 max-w-xl mx-auto"
              >
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter parent or guardian email"
                  required
                  className="flex-1 border border-slate-200 rounded-full px-7 py-5 outline-none focus:border-[#062B78] focus:ring-2 focus:ring-[#062B78]/10 transition text-slate-800 text-sm shadow-xs"
                />

                <button
                  type="submit"
                  className="bg-[#062B78] hover:bg-black text-white px-8 py-5 rounded-full font-bold text-sm transition duration-300 shadow-md cursor-pointer"
                >
                  Subscribe
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="sub-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-10 p-6 bg-slate-50 border border-slate-100 rounded-3xl max-w-md mx-auto"
              >
                <p className="font-bold text-[#062B78] text-lg">✓ Successfully Subscribed!</p>
                <p className="text-slate-500 text-xs mt-2">You will now receive weekly newsletters and announcements from Vedant Bhabhar office.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* bottom CTA */}
      <CallToAction 
        title="Want To Share A Story"
        highlightedTitle="Or Inquire About Academics?"
        description="Connect with our editorial office in Bhabhar. Learn more about scholarship programs, athletic achievements, and student projects."
      />
    </div>
  );
}
