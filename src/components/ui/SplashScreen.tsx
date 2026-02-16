import { FC, useEffect, useRef } from "react";

const SplashScreen: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Optional: Add subtle parallax or animation triggers
    const container = containerRef.current;
    if (!container) return;

    // Add fade-in animation on mount
    container.style.animation = "fadeInSplash 0.8s ease-out";
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0a1f38 0%, #0d2a4a 50%, #001d3d 100%)",
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        {/* Glowing orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(34, 211, 238, 0.3), transparent)",
            animation: "glow-pulse-splash 4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.2), transparent)",
            animation: "glow-pulse-splash 6s ease-in-out infinite 1s",
          }}
        />
      </div>

      {/* Main content */}
      <div
        ref={containerRef}
        className="relative flex flex-col items-center gap-8 z-10"
      >
        {/* Animated Logo with glow */}
        <div className="relative group animate-fade-in">
          {/* Glowing background circle */}
          <div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              width: "144px",
              height: "144px",
              margin: "auto",
              background:
                "radial-gradient(circle, rgba(34, 211, 238, 0.2), transparent)",
              filter: "blur(20px)",
            }}
          />

          {/* Logo container with neon glow */}
          <div
            className="relative w-36 h-36 md:w-40 md:h-40 flex items-center justify-center rounded-full"
            style={{
              boxShadow:
                "0 0 30px rgba(34, 211, 238, 0.4), inset 0 0 30px rgba(34, 211, 238, 0.1)",
              animation: "pulse-neon 2s ease-in-out infinite",
            }}
          >
            <img
              src="/favicon.ico"
              alt="Pure Homecare Logo"
              className="w-24 h-24 md:w-32 md:h-32 object-contain relative z-10"
            />
          </div>
        </div>

        {/* Branding text */}
        <div className="text-center space-y-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
            Pure Homecare
          </h1>
          <p className="text-sm md:text-base text-cyan-300/80 font-medium uppercase tracking-[0.15em]">
            VR Training Platform
          </p>
        </div>

        {/* Status text */}
        <p
          className="text-cyan-200/60 text-sm md:text-base font-medium animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          Initializing Training Environment...
        </p>

        {/* Advanced loader */}
        <div
          className="mt-8 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          {/* Circular progress ring */}
          <div className="relative w-16 h-16">
            {/* Outer rotating ring */}
            <svg
              className="absolute inset-0 w-full h-full"
              style={{
                animation: "spin-smooth 3s linear infinite",
              }}
              viewBox="0 0 64 64"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="url(#gradientCyan)"
                strokeWidth="2"
                strokeDasharray="87.96"
                strokeDashoffset="0"
                opacity="0.8"
              />
              <defs>
                <linearGradient
                  id="gradientCyan"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Middle rotating ring (counter-clockwise) */}
            <svg
              className="absolute inset-2 w-12 h-12"
              style={{
                animation: "spin-smooth-reverse 2.5s linear infinite",
                margin: "auto",
              }}
              viewBox="0 0 48 48"
            >
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="url(#gradientPurple)"
                strokeWidth="1.5"
                strokeDasharray="62.83"
                strokeDashoffset="20"
                opacity="0.6"
              />
              <defs>
                <linearGradient
                  id="gradientPurple"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center dot */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
              style={{
                background: "#22d3ee",
                boxShadow: "0 0 10px rgba(34, 211, 238, 0.8)",
              }}
            />
          </div>
        </div>

        {/* Loading dots */}
        <div
          className="flex gap-2 mt-6 animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: "#22d3ee",
                boxShadow: "0 0 8px rgba(34, 211, 238, 0.6)",
                animation: "pulse-dot 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        {/* Progress text */}
        <p
          className="text-center text-blue-300/60 text-xs md:text-sm mt-6 animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          Loading VR devices and training modules...
        </p>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeInSplash {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes glow-pulse-splash {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        @keyframes pulse-neon {
          0%, 100% {
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.4), inset 0 0 20px rgba(34, 211, 238, 0.05);
          }
          50% {
            box-shadow: 0 0 40px rgba(34, 211, 238, 0.6), inset 0 0 30px rgba(34, 211, 238, 0.1);
          }
        }

        @keyframes spin-smooth {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-smooth-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes pulse-dot {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
