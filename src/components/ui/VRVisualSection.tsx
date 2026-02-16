import { useEffect, useRef } from "react";

export default function VRVisualSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      // Apply subtle parallax effect to elements
      const elements = containerRef.current.querySelectorAll("[data-parallax]");
      elements.forEach((el) => {
        const depth = parseFloat(el.getAttribute("data-parallax") || "1");
        const moveX = x * depth * 20;
        const moveY = y * depth * 20;
        (el as HTMLElement).style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-[#0a1f38] via-[#0d2a4a] to-[#001d3d] p-12 flex-col justify-between relative overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Glowing orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{
            background: "radial-gradient(circle, rgba(34, 211, 238, 0.4), transparent)",
            animation: "glow-pulse 4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15 animate-pulse"
          style={{
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent)",
            animation: "glow-pulse 6s ease-in-out infinite 1s",
          }}
        />
      </div>

      {/* Logo and branding */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <img
              src="/favicon.ico"
              alt="Logo"
              className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 rounded-lg bg-cyan-500/0 group-hover:bg-cyan-500/20 transition-colors duration-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Pure Homecare</h1>
            <p className="text-sm text-cyan-300/70 tracking-wide">VR Training Platform</p>
          </div>
        </div>
      </div>

      {/* Main content with parallax */}
      <div className="relative z-10 space-y-8">
        {/* Animated heading */}
        <div data-parallax="0.5">
          <div className="relative mb-4">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-1000" />
            <h2 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 leading-tight">
              Step Into Immersive <span className="block">Training</span>
            </h2>
          </div>
          <p className="text-lg text-blue-200/80 max-w-lg leading-relaxed">
            Transform healthcare education with real-time VR device management and
            immersive training experiences designed for healthcare professionals.
          </p>
        </div>

        {/* Stats section with glassmorphism */}
        <div
          data-parallax="0.3"
          className="flex items-center gap-6 pt-6"
          style={{
            background: "rgba(34, 211, 238, 0.05)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(34, 211, 238, 0.1)",
            borderRadius: "0.75rem",
            padding: "1.5rem",
          }}
        >
          <div className="text-center group">
            <p className="text-3xl font-bold text-cyan-300 group-hover:text-cyan-200 transition-colors">
              50+
            </p>
            <p className="text-sm text-blue-300/60">VR Devices</p>
          </div>
          <div className="w-px h-12 bg-gradient-to-b from-cyan-500/30 to-transparent" />
          <div className="text-center group">
            <p className="text-3xl font-bold text-cyan-300 group-hover:text-cyan-200 transition-colors">
              1.2k
            </p>
            <p className="text-sm text-blue-300/60">Sessions</p>
          </div>
          <div className="w-px h-12 bg-gradient-to-b from-cyan-500/30 to-transparent" />
          <div className="text-center group">
            <p className="text-3xl font-bold text-cyan-300 group-hover:text-cyan-200 transition-colors">
              98%
            </p>
            <p className="text-sm text-blue-300/60">Success Rate</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-sm text-blue-400/50">
        © 2026 Pure Homecare. All rights reserved.
      </div>

      {/* Animated floating elements */}
      <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-cyan-400" data-parallax="0.2">
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-20px) translateX(10px); }
          }
        `}</style>
        <div className="animate-[float_3s_ease-in-out_infinite]" />
      </div>

      <style>{`
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.1); }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 1;
          }
          50% {
            transform: translateY(-30px) translateX(15px);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
