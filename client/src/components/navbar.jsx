import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiMenuAlt3, HiX } from "react-icons/hi";
import vedatLogo from "../assets/vedantLogo.png";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Academics", path: "/academics" },
    { name: "Admissions", path: "/admissions" },
    { name: "Events", path: "/events" },
    { name: "Gallery", path: "/gallery" },
    { name: "Blog", path: "/blog" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      {/* Blur Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-xs"></div>

      <nav className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-20">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={vedatLogo}
              alt="Vedant Logo"
              className="w-12 h-12 md:w-14 md:h-14 object-contain group-hover:scale-105 transition-transform duration-300"
            />
            <div className="leading-tight">
              <h1 className="text-xl md:text-2xl font-black text-[#062B78] tracking-tight group-hover:text-yellow-600 transition-colors duration-300">
                VEDANT
              </h1>
              <p className="text-yellow-500 font-bold text-xs tracking-widest uppercase">
                VIDHYA SANKUL
              </p>
            </div>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link, index) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={index}
                  to={link.path}
                  className={`relative font-bold text-sm tracking-wide transition duration-300 group py-2 ${
                    active
                      ? "text-[#062B78]"
                      : "text-slate-600 hover:text-[#062B78]"
                  }`}
                >
                  {link.name}
                  {/* Underline Indicator */}
                  <span
                    className={`absolute left-0 bottom-0 h-0.75 bg-yellow-400 rounded-full transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </Link>
              );
            })}
          </div>

          {/* RIGHT ACTION BUTTON */}
          <div className="hidden lg:flex items-center">
            <Link
              to="/admissions"
              className="bg-[#062B78] hover:bg-black text-white px-7 py-3 rounded-full font-bold transition duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            >
              Admission Open
            </Link>
          </div>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-3xl text-[#062B78] hover:text-yellow-600 transition-colors cursor-pointer"
          >
            {isOpen ? <HiX /> : <HiMenuAlt3 />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU DRAWER */}
      <div
        className={`lg:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-2xl transition-all duration-500 overflow-hidden border-b border-slate-100 ${
          isOpen ? "max-h-112.5 opacity-100 shadow-xl" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-8 flex flex-col gap-5">
          {navLinks.map((link, index) => {
            const active = isActive(link.path);
            return (
              <Link
                key={index}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`text-base font-bold transition duration-300 border-b border-slate-50 pb-2 ${
                  active
                    ? "text-[#062B78] border-[#062B78]/25 pl-1"
                    : "text-slate-600 hover:text-[#062B78]"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <Link
            to="/admissions"
            onClick={() => setIsOpen(false)}
            className="mt-4 bg-[#062B78] hover:bg-black text-white text-center py-4 rounded-full font-bold transition duration-300 shadow-md"
          >
            Admission Open
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
