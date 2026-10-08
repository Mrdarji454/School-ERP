import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";
import {
  HiOutlineLocationMarker,
  HiOutlineMail,
  HiOutlinePhone,
} from "react-icons/hi";

function Footer() {
  return (
    <footer className="bg-slate-950 text-white mt-20 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#062B78]/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-400/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-[#062B78]">
                VEDANT
              </h2>
              <p className="text-yellow-400 font-bold text-xs tracking-widest uppercase mt-1">
                VIDHYA SANKUL
              </p>
            </div>

            <p className="text-gray-400 leading-relaxed text-sm">
              Empowering students in Bhabhar, Gujarat, with robust conceptual knowledge, high scientific innovation, and holistic leadership values for the future.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: <FaFacebookF />, url: "https://facebook.com" },
                { icon: <FaInstagram />, url: "https://instagram.com" },
                { icon: <FaYoutube />, url: "https://youtube.com" },
                { icon: <FaLinkedinIn />, url: "https://linkedin.com" }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center hover:bg-yellow-400 hover:text-black hover:border-yellow-400 transition-all duration-300 shadow-sm"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white border-b-2 border-yellow-400/50 pb-2 inline-block">
              Quick Links
            </h3>
            <div className="flex flex-col gap-3 text-gray-400 text-sm">
              <Link to="/" className="hover:text-yellow-400 transition-colors duration-200">
                Home Page
              </Link>
              <Link to="/about" className="hover:text-yellow-400 transition-colors duration-200">
                About Us
              </Link>
              <Link to="/academics" className="hover:text-yellow-400 transition-colors duration-200">
                Academics Structure
              </Link>
              <Link to="/admissions" className="hover:text-yellow-400 transition-colors duration-200">
                Admissions Open
              </Link>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white border-b-2 border-yellow-400/50 pb-2 inline-block">
              Explore Campus
            </h3>
            <div className="flex flex-col gap-3 text-gray-400 text-sm">
              <Link to="/gallery" className="hover:text-yellow-400 transition-colors duration-200">
                Photo Gallery
              </Link>
              <Link to="/events" className="hover:text-yellow-400 transition-colors duration-200">
                School Events
              </Link>
              <Link to="/blog" className="hover:text-yellow-400 transition-colors duration-200">
                Articles & Blogs
              </Link>
              <Link to="/contact" className="hover:text-yellow-400 transition-colors duration-200">
                Contact & Support
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white border-b-2 border-yellow-400/50 pb-2 inline-block">
              Contact Details
            </h3>
            <div className="flex flex-col gap-5 text-gray-400 text-sm">
              <div className="flex items-start gap-3">
                <HiOutlineLocationMarker className="text-xl text-yellow-400 mt-1 flex-shrink-0" />
                <p className="leading-relaxed">
                  Vedant Vidhya Sankul, Near Highway Crossing, Bhabhar, Gujarat, India.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <HiOutlinePhone className="text-xl text-yellow-400 flex-shrink-0" />
                <p>+91 98765 43210</p>
              </div>

              <div className="flex items-center gap-3">
                <HiOutlineMail className="text-xl text-yellow-400 flex-shrink-0" />
                <p>info@vedantschool.com</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="border-t border-slate-900 bg-slate-950/60 py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Vedant Vidhya Sankul School. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition duration-200">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition duration-200">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
