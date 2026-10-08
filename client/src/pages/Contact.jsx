import { motion } from "framer-motion";
import FAQSection from "../components/FAQSection";
import InquiryForm from "../components/InquiryForm";
import CallToAction from "../components/CallToAction";

function ContactPage() {
  const contactDetails = [
    {
      icon: "📍",
      title: "School Address",
      desc: "Vedant Vidhya Sankul, Near Highway Crossing, Bhabhar, Gujarat, India",
    },
    { icon: "📞", title: "Phone Number", desc: "+91 98765 43210" },
    { icon: "✉️", title: "Email Address", desc: "info@vedantschool.com" },
    {
      icon: "🕒",
      title: "Office Hours",
      desc: "Mon - Sat : 8:00 AM - 5:00 PM",
    },
  ];

  return (
    <div className="bg-white overflow-hidden text-slate-900">
      {/* HERO SECTION */}
      <section className="relative pt-40 pb-32 bg-[#062B78] text-white">
        <div className="absolute inset-0 opacity-15">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1600&auto=format&fit=crop"
            alt="contact page banner"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <p className="uppercase tracking-[5px] text-yellow-400 text-xs font-bold mb-4">
            Contact Us
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight tracking-tight">
            Connect With
            <span className="text-yellow-400 block mt-2">
              Vedant Vidhya Sankul
            </span>
          </h1>

          <p className="max-w-3xl mx-auto mt-8 text-base md:text-lg text-slate-200 leading-relaxed font-medium">
            Reach out to our campus office for admissions, student status
            inquiries, career orientations, or scheduled visits.
          </p>
        </div>
      </section>

      {/* CONTACT INFO GRID */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {contactDetails.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -6, scale: 1.02 }}
              className="bg-white rounded-4xl shadow-[0_10px_35px_rgba(0,0,0,0.02)] p-8 text-center border border-slate-100 hover:border-yellow-400/30 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 text-[#062B78]">
                {item.icon}
              </div>

              <h3 className="text-xl font-bold text-[#062B78]">{item.title}</h3>

              <p className="text-slate-500 mt-4 leading-relaxed text-sm">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CONTACT FORM + CAMPUS TOUR INFO */}
      <section className="pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* LEFT SIDE - FORM */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-4">
                Get In Touch
              </p>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#062B78] leading-tight">
                Send Us Your Message
              </h2>

              <p className="mt-6 text-base leading-relaxed mb-10 text-slate-700">
                Have specific concerns, suggestions, or doubts about curriculum
                modules? Drop us a line below, and we will route it to the
                appropriate HOD.
              </p>

              {/* Inquiry Form Reusable Component */}
              <InquiryForm type="general" />
            </motion.div>

            {/* RIGHT SIDE - CAMPUS TOUR PREVIEW CARD */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -top-5 -left-5 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative overflow-hidden rounded-[40px] shadow-2xl group border border-slate-100 h-150">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
                  alt="school labs visit"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                  loading="lazy"
                />

                {/* OVERLAY CARD */}
                <div className="absolute bottom-8 left-8 right-8 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-4xl p-8 text-white">
                  <h3 className="text-2xl font-black text-white">
                    Book A Campus Tour
                  </h3>

                  <p className="mt-4 text-slate-300 leading-relaxed text-sm">
                    Inspect our high-speed robotics labs, physics workstations,
                    sports fields, and smart classrooms in Bhabhar firsthand.
                  </p>

                  <button
                    onClick={() => {
                      const el = document.getElementsByName("inquiryType")[0];
                      if (el) {
                        el.value = "Campus Tour";
                        el.dispatchEvent(
                          new Event("change", { bubbles: true }),
                        );
                        window.scrollTo({
                          top:
                            el.getBoundingClientRect().top +
                            window.scrollY -
                            150,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="mt-6 bg-yellow-400 hover:bg-yellow-300 text-black px-7 py-3.5 rounded-full font-bold transition duration-300 shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Select Tour Form
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* GOOGLE MAP */}
      <section className="bg-slate-50 py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
          <div className="text-center mb-16">
            <p className="uppercase tracking-[4px] text-yellow-500 font-bold text-xs mb-3">
              Find Us
            </p>
            <h2 className="text-4xl lg:text-5xl font-black text-[#062B78]">
              School Location Map
            </h2>
          </div>

          <div className="overflow-hidden rounded-[40px] shadow-xl border border-slate-100">
            <iframe
              title="map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3642.494892801601!2d71.59584527457388!3d24.084085775885615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395b6beb4c4c0bf5%3A0xe23ca02b2c9f6bdc!2sVEDANT%20SCHOOL%20OF%20SCIENCE!5e0!3m2!1sen!2sin!4v1779382281073!5m2!1sen!2sin"
              className="w-full h-125"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      {/* FAQ SECTION (REUSABLE ACCORDION) */}
      <FAQSection />

      {/* bottom CTA */}
      <CallToAction
        title="Ready To Start Your"
        highlightedTitle="Child's Education?"
        description="Connect with our Bhabhar team. We assist you through admissions processes, document validation, and school transport mapping."
      />
    </div>
  );
}

export default ContactPage;
