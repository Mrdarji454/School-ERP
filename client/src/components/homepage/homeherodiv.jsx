import { Link } from "react-router-dom";
import mineImage from "../../assets/mine.jpg";
import { schoolStats } from "../../data/schoolData";

function HomeHerodiv() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#062B78] text-white flex items-center pt-20">
      {/* BACKGROUND IMAGE OVERLAY */}
      <div className="absolute inset-0 opacity-15 scale-110 animate-[slowZoom_25s_linear_infinite]">
        <img
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1600&auto=format&fit=crop"
          alt="school campus"
          className="w-full h-full object-cover"
        />
      </div>

      {/* GRADIENT GLOWS */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-yellow-400/10 blur-[130px] rounded-full animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-400/10 blur-[130px] rounded-full animate-pulse pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-16 grid lg:grid-cols-2 gap-14 items-center w-full">
        
        {/* LEFT PANEL */}
        <div className="animate-[fadeLeft_1.2s_ease-out]">
          <p className="uppercase tracking-[5px] text-yellow-400 mb-5 text-sm font-bold animate-pulse">
            Vedant Vidhya Sankul
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight">
            <span className="inline-block animate-[fadeUp_1s_ease-out]">
              Empowering Minds,
            </span>
            <span className="text-yellow-400 block mt-2 animate-[fadeUp_1.4s_ease-out]">
              Shaping Futures
            </span>
          </h1>

          <p className="mt-7 text-lg text-slate-200 leading-relaxed max-w-xl animate-[fadeUp_1.8s_ease-out]">
            Nurturing curiosity, personal confidence, technological innovation, and scientific excellence through cutting-edge smart education in Bhabhar, Gujarat.
          </p>

          <div className="flex flex-wrap gap-4 mt-10 animate-[fadeUp_2s_ease-out]">
            <Link 
              to="/admissions"
              className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-4 rounded-full font-bold transition duration-300 shadow-2xl hover:scale-105 inline-block text-center"
            >
              Admissions Open 2026
            </Link>

            <Link 
              to="/about"
              className="border-2 border-white hover:bg-white hover:text-black px-8 py-4 rounded-full font-bold transition duration-300 hover:scale-105 hover:shadow-2xl inline-block text-center"
            >
              Explore School
            </Link>
          </div>

          {/* QUICK STATS INSIDE HERO */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {schoolStats.map((item, index) => (
              <div
                key={index}
                className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 hover:bg-yellow-400 hover:text-black transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(250,204,21,0.2)] animate-[fadeUp_1s_ease-out]"
                style={{
                  animationDelay: `${index * 0.15}s`,
                }}
              >
                <h2 className="text-2xl sm:text-3xl font-black text-yellow-400 group-hover:text-black transition duration-300">
                  {item.value}
                </h2>
                <p className="text-xs text-slate-300 group-hover:text-black mt-1 transition duration-300">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL - IMAGE */}
        <div className="relative flex justify-center perspective-distant">
          <div className="absolute -inset-5 bg-yellow-400 blur-3xl opacity-15 rounded-full animate-pulse"></div>

          {/* ROTATING BORDER */}
          <div className="absolute w-full max-w-md h-[450px] rounded-[40px] border-2 border-dashed border-yellow-400/30 animate-spinSlow pointer-events-none"></div>

          <div
            className="group relative w-full max-w-md h-[450px] transition-all duration-300"
            onMouseMove={(e) => {
              const card = e.currentTarget;
              const rect = card.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const rotateY = (x / rect.width - 0.5) * 16;
              const rotateX = (y / rect.height - 0.5) * -16;
              card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
            }}
          >
            {/* GLOW OVERLAY */}
            <div className="absolute inset-0 rounded-[40px] bg-gradient-to-tr from-yellow-400/10 via-transparent to-blue-400/10 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>

            {/* LIGHT REFLECTION GLINT */}
            <div className="absolute inset-0 rounded-[40px] overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-[-120%] w-[80%] h-full bg-white/20 blur-2xl rotate-12 group-hover:left-[130%] transition-all duration-[1200ms]"></div>
            </div>

            <img
              src={mineImage}
              alt="Vedant School Students"
              className="relative rounded-[40px] border-4 border-yellow-400 shadow-2xl w-full h-full object-cover animate-[float_6s_ease-in-out_infinite]"
            />
          </div>
        </div>

      </div>
    </section>
  );
}

export default HomeHerodiv;
