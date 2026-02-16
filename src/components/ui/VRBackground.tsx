import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  opacity: number;
}

export default function VRBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    const particleCount = 40;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 1000,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      vz: Math.random() * 2 - 1,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    }));

    // Animation loop
    let animationId: number;
    const animate = () => {
      // Clear canvas with semi-transparent dark background for trail effect
      ctx.fillStyle = "rgba(13, 42, 74, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.z < 0 || particle.z > 1000) {
          particle.z = particle.z < 500 ? 1000 : 0;
        }

        // Calculate scale based on depth (perspective)
        const scale = particle.z / 1000;
        const size = particle.size * scale;

        // Draw particle with gradient glow
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          size * 2
        );
        gradient.addColorStop(0, `rgba(34, 211, 238, ${particle.opacity * scale * 0.8})`);
        gradient.addColorStop(1, `rgba(34, 211, 238, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          particle.x - size,
          particle.y - size,
          size * 2,
          size * 2
        );

        // Draw particle core
        ctx.fillStyle = `rgba(34, 211, 238, ${particle.opacity * scale})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw animated grid lines
      const gridSize = 100;
      const waveAmplitude = 10;
      const waveSpeed = Date.now() * 0.0002;

      ctx.strokeStyle = "rgba(34, 211, 238, 0.05)";
      ctx.lineWidth = 0.5;

      // Vertical lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        for (let y = 0; y < canvas.height; y += 10) {
          const wave = Math.sin(y * 0.01 + waveSpeed) * waveAmplitude;
          ctx.lineTo(x + wave, y);
        }
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < canvas.width; x += 10) {
          const wave = Math.sin(x * 0.01 + waveSpeed) * waveAmplitude;
          ctx.lineTo(x, y + wave);
        }
        ctx.stroke();
      }

      // Draw holographic circles
      const circles = [
        { x: 0.2, y: 0.3, radius: 150, color: "22, 211, 238" },
        { x: 0.8, y: 0.7, radius: 200, color: "139, 92, 246" },
      ];

      circles.forEach(({ x, y, radius, color }) => {
        const screenX = canvas.width * x;
        const screenY = canvas.height * y;
        const pulse = Math.sin(waveSpeed * 2) * 0.3 + 0.7;

        ctx.strokeStyle = `rgba(${color}, ${0.08 * pulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(${color}, ${0.15 * pulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 bg-gradient-to-b from-[#0a1f38] via-[#0d2a4a] to-[#001d3d]"
    />
  );
}
