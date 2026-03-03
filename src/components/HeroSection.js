"use client";
import { memo, useEffect, useRef } from "react";

// ─── Default Hero Section (Backup) ──────────────────────────────────────────
/*
<section className="relative z-10 text-center py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
  <div className="max-w-4xl mx-auto relative z-10">
    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 sm:mb-6 animate-fade-in-up leading-tight drop-shadow-2xl">
      Discover Amazing Events Near You
    </h1>
    <p className="text-base sm:text-lg md:text-xl text-gray-100 mb-6 sm:mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-300 px-4 drop-shadow-lg">
      Join thousands of people experiencing the best events in music, food,
      technology, and community. Book your next adventure today!
    </p>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto mb-8 sm:mb-12 animate-fade-in-up animation-delay-600 px-4">
      <div className="relative flex-1 w-full">
        <input
          type="text"
          placeholder="Search events, artists, venues..."
          className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </div>
      </div>
      <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-semibold text-sm sm:text-base w-full sm:w-auto">
        Search
      </button>
    </div>
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up animation-delay-900 px-4">
      <button
        onClick={() => router.push("/events")}
        className="bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl text-sm sm:text-base"
      >
        Browse Events
      </button>
      <button
        onClick={() => router.push("/about")}
        className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base backdrop-blur-sm"
      >
        Learn More
      </button>
    </div>
  </div>
</section>
*/

// ─── Particle canvas for floating gulal dust ───────────────────────────────
const GulalCanvas = memo(() => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = [
      "#ff0080", "#ff6600", "#ffee00", "#00cc44",
      "#00aaff", "#cc00ff", "#ff44aa", "#ffbb00", "#33ff99",
    ];

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3.5 + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      alpha: Math.random() * 0.6 + 0.3,
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.pulse += 0.04;
        p.alpha = 0.3 + 0.35 * Math.abs(Math.sin(p.pulse));
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = p.r * 4;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 3,
      }}
    />
  );
});
GulalCanvas.displayName = "GulalCanvas";

// ─── Marigold Garland SVG ───────────────────────────────────────────────────
const MarigoldGarland = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "90px",
      zIndex: 10,
      pointerEvents: "none",
      overflow: "hidden",
    }}
  >
    <svg
      viewBox="0 0 1200 90"
      preserveAspectRatio="none"
      style={{ width: "100%", height: "100%" }}
    >
      {/* Garland rope */}
      <path
        d="M0,30 Q150,70 300,30 Q450,70 600,30 Q750,70 900,30 Q1050,70 1200,30"
        fill="none"
        stroke="#8B6914"
        strokeWidth="2"
        opacity="0.7"
      />
      {/* Marigold flowers along the garland */}
      {[0, 150, 300, 450, 600, 750, 900, 1050, 1200].map((x, i) => {
        const y = i % 2 === 0 ? 28 : 68;
        const isOrange = i % 3 !== 2;
        const color = isOrange ? "#FF8C00" : "#FFD700";
        const inner = isOrange ? "#FF6600" : "#FFA500";
        return (
          <g key={i} transform={`translate(${x},${y})`}>
            {/* Petals */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <ellipse
                key={deg}
                cx={Math.cos((deg * Math.PI) / 180) * 9}
                cy={Math.sin((deg * Math.PI) / 180) * 9}
                rx="5"
                ry="3.5"
                fill={color}
                transform={`rotate(${deg} ${Math.cos((deg * Math.PI) / 180) * 9} ${Math.sin((deg * Math.PI) / 180) * 9})`}
                opacity="0.95"
              />
            ))}
            {/* Center */}
            <circle cx="0" cy="0" r="5" fill={inner} />
            <circle cx="0" cy="0" r="2.5" fill="#5C3317" />
            {/* Leaves on rope */}
            <ellipse cx="0" cy="-15" rx="3" ry="7" fill="#228B22" opacity="0.8" transform={`rotate(${i % 2 === 0 ? -20 : 20})`} />
          </g>
        );
      })}
    </svg>
  </div>
);

// ─── EventHubX Big Logo (actual image, circular crop) ──────────────────────
const BigELogo = () => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: "clamp(260px, 36vw, 460px)",
      height: "clamp(260px, 36vw, 460px)",
      zIndex: 1,
      pointerEvents: "none",
    }}
  >
    {/* Spinning rainbow halo */}
    <div
      style={{
        position: "absolute",
        inset: "-6px",
        borderRadius: "50%",
        background:
          "conic-gradient(from 0deg, #ff0080, #ff6600, #ffee00, #00cc44, #00aaff, #cc00ff, #ff0080)",
        opacity: 0.3,
        filter: "blur(10px)",
        animation: "spinSlow 8s linear infinite",
      }}
    />
    {/* Outer glow ring */}
    <div
      style={{
        position: "absolute",
        inset: "-2px",
        borderRadius: "50%",
        background:
          "conic-gradient(from 0deg, #ff0080, #ff6600, #ffee00, #00cc44, #00aaff, #cc00ff, #ff0080)",
        opacity: 0.55,
        animation: "spinSlow 8s linear infinite",
      }}
    />
    {/* The actual logo image, cropped in a circle */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/eventhubx-holi-logo.jpg"
      alt="EventHubX Holi Logo"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        objectFit: "cover",
        objectPosition: "center 20%",
        display: "block",
        position: "relative",
        zIndex: 2,
        boxShadow:
          "0 0 50px rgba(139,92,246,0.5), 0 0 100px rgba(255,0,128,0.25), 0 20px 60px rgba(0,0,0,0.6)",
        border: "3px solid rgba(255,255,255,0.12)",
        animation: "logoFloat 4s ease-in-out infinite",
      }}
    />
  </div>
);

// ─── Diya SVG ───────────────────────────────────────────────────────────────
const Diya = ({ x, scale = 1, flip = false }) => (
  <div
    style={{
      position: "absolute",
      bottom: "6%",
      left: x,
      transform: `scaleX(${flip ? -1 : 1}) scale(${scale})`,
      zIndex: 8,
      pointerEvents: "none",
      animation: "diyaFlicker 2s ease-in-out infinite alternate",
    }}
  >
    <svg width="60" height="70" viewBox="0 0 60 70">
      {/* Flame glow */}
      <ellipse cx="30" cy="18" rx="10" ry="12" fill="rgba(255,140,0,0.18)" />
      {/* Flame */}
      <path
        d="M30,28 Q24,20 27,10 Q30,4 33,10 Q36,20 30,28Z"
        fill="url(#flameGrad)"
      />
      <defs>
        <radialGradient id="flameGrad" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="40%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FF4500" />
        </radialGradient>
      </defs>
      {/* Wick */}
      <line x1="30" y1="28" x2="30" y2="35" stroke="#5C3D11" strokeWidth="2" />
      {/* Diya bowl */}
      <path
        d="M12,38 Q15,30 30,30 Q45,30 48,38 L44,50 Q38,56 30,57 Q22,56 16,50Z"
        fill="url(#diyaBowl)"
      />
      <defs>
        <linearGradient id="diyaBowl" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CD7F32" />
          <stop offset="50%" stopColor="#B87333" />
          <stop offset="100%" stopColor="#8B4513" />
        </linearGradient>
      </defs>
      {/* Oil surface */}
      <ellipse cx="30" cy="38" rx="14" ry="5" fill="rgba(255,200,50,0.35)" />
      {/* Mandala pattern on diya */}
      <circle cx="30" cy="48" r="6" fill="none" stroke="rgba(255,200,100,0.4)" strokeWidth="0.8" />
      <circle cx="30" cy="48" r="3" fill="none" stroke="rgba(255,200,100,0.3)" strokeWidth="0.6" />
    </svg>
  </div>
);

// ─── Gulal Heap ─────────────────────────────────────────────────────────────
const GulalHeap = ({ x, color, color2, size = 1 }) => (
  <div
    style={{
      position: "absolute",
      bottom: "3%",
      left: x,
      pointerEvents: "none",
      zIndex: 7,
      transform: `scale(${size})`,
      transformOrigin: "bottom center",
    }}
  >
    <svg width="80" height="55" viewBox="0 0 80 55">
      <defs>
        <radialGradient id={`heap-${color}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={color2 || color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.85" />
        </radialGradient>
      </defs>
      {/* Bowl shadow */}
      <ellipse cx="40" cy="50" rx="36" ry="7" fill="rgba(0,0,0,0.35)" />
      {/* Bowl */}
      <path d="M8,46 Q12,38 40,38 Q68,38 72,46 L68,50 Q55,54 40,55 Q25,54 12,50Z" fill="#8B4513" opacity="0.9" />
      {/* Gulal powder heap */}
      <ellipse cx="40" cy="38" rx="28" ry="12" fill={`url(#heap-${color})`} />
      <ellipse cx="40" cy="34" rx="20" ry="10" fill={color2 || color} opacity="0.8" />
      <ellipse cx="40" cy="30" rx="12" ry="8" fill={color} opacity="0.9" />
      {/* Powder dust */}
      {[[-10, -5], [10, -8], [-5, -12], [8, -6]].map(([dx, dy], i) => (
        <circle key={i} cx={40 + dx} cy={30 + dy} r="2.5" fill={color} opacity={0.4 + i * 0.1} />
      ))}
    </svg>
  </div>
);

// ─── Color Powder Explosion ─────────────────────────────────────────────────
const PowderExplosion = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      zIndex: 2,
      pointerEvents: "none",
      overflow: "hidden",
    }}
  >
    {/* Left side splashes */}
    {[
      { left: "2%", top: "20%", color: "#ff0080", size: 120, blur: 40, opacity: 0.55 },
      { left: "-2%", top: "50%", color: "#ff6600", size: 100, blur: 35, opacity: 0.5 },
      { left: "8%", top: "75%", color: "#ffee00", size: 90, blur: 30, opacity: 0.45 },
      { left: "15%", top: "10%", color: "#ff44aa", size: 80, blur: 28, opacity: 0.4 },
    ].map((s, i) => (
      <div
        key={`left-${i}`}
        style={{
          position: "absolute",
          left: s.left,
          top: s.top,
          width: s.size,
          height: s.size,
          borderRadius: "50%",
          background: s.color,
          filter: `blur(${s.blur}px)`,
          opacity: s.opacity,
          mixBlendMode: "screen",
          animation: `pulseGlow ${3 + i * 0.7}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.4}s`,
        }}
      />
    ))}
    {/* Right side splashes */}
    {[
      { right: "2%", top: "20%", color: "#00aaff", size: 120, blur: 40, opacity: 0.55 },
      { right: "-2%", top: "55%", color: "#cc00ff", size: 100, blur: 35, opacity: 0.5 },
      { right: "8%", top: "75%", color: "#00cc44", size: 90, blur: 30, opacity: 0.45 },
      { right: "15%", top: "8%", color: "#33ff99", size: 80, blur: 28, opacity: 0.4 },
    ].map((s, i) => (
      <div
        key={`right-${i}`}
        style={{
          position: "absolute",
          right: s.right,
          top: s.top,
          width: s.size,
          height: s.size,
          borderRadius: "50%",
          background: s.color,
          filter: `blur(${s.blur}px)`,
          opacity: s.opacity,
          mixBlendMode: "screen",
          animation: `pulseGlow ${3.5 + i * 0.6}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.3 + 0.2}s`,
        }}
      />
    ))}
    {/* Center top explosion */}
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "10%",
        transform: "translateX(-50%)",
        width: 300,
        height: 300,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(255,200,0,0.25) 0%, rgba(255,0,128,0.15) 40%, transparent 70%)",
        filter: "blur(20px)",
        mixBlendMode: "screen",
      }}
    />
  </div>
);

// ─── HERO SECTION ───────────────────────────────────────────────────────────
const HeroSection = memo(({ router }) => (
  <section
    style={{
      position: "relative",
      zIndex: 10,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      paddingTop: "90px",
      paddingBottom: "60px",
      paddingLeft: "16px",
      paddingRight: "16px",
    }}
  >
    {/* Full background image */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "url(/holi-hero-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        zIndex: 0,
      }}
    />
    {/* Dark overlay for text readability */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to bottom, rgba(5,5,20,0.72) 0%, rgba(5,5,20,0.55) 40%, rgba(5,5,20,0.75) 100%)",
        zIndex: 1,
      }}
    />

    {/* Powder color explosions */}
    <PowderExplosion />

    {/* Gulal dust particles canvas */}
    <GulalCanvas />

    {/* Marigold garland at top */}
    <MarigoldGarland />

    {/* Diyas */}
    <Diya x="3%" scale={1.1} />
    <Diya x="10%" scale={0.85} />
    <Diya x="80%" scale={0.85} flip />
    <Diya x="88%" scale={1.1} flip />

    {/* Gulal heaps */}
    <GulalHeap x="0%" color="#ff44aa" color2="#ff0080" size={1.1} />
    <GulalHeap x="9%" color="#ff8800" color2="#ffcc00" size={0.8} />
    <GulalHeap x="18%" color="#ffee00" color2="#ffe000" size={0.75} />
    <GulalHeap x="73%" color="#00cc44" color2="#33ff99" size={0.75} />
    <GulalHeap x="82%" color="#a855f7" color2="#cc00ff" size={0.8} />
    <GulalHeap x="90%" color="#00aaff" color2="#0055ff" size={1.0} />

    {/* Main content */}
    <div
      style={{
        position: "relative",
        zIndex: 20,
        textAlign: "center",
        maxWidth: "860px",
        width: "100%",
        margin: "0 auto",
      }}
    >
      {/* Event badge */}
      <div
        className="animate-fade-in-up"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 18px",
          borderRadius: "999px",
          marginBottom: "24px",
          background:
            "linear-gradient(135deg, rgba(255,0,128,0.22), rgba(255,153,0,0.22), rgba(0,204,68,0.18))",
          border: "1px solid rgba(255,100,100,0.4)",
          color: "#ffccea",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.05em",
          backdropFilter: "blur(8px)",
        }}
      >
        🎨&nbsp;Happy Holi 2026&nbsp;·&nbsp;Festival of Colors
      </div>

      {/* Heading */}
      <h1
        className="animate-fade-in-up"
        style={{
          fontSize: "clamp(2.2rem, 6vw, 5rem)",
          fontWeight: 900,
          color: "#ffffff",
          lineHeight: 1.1,
          marginBottom: "20px",
          textShadow: "0 4px 30px rgba(0,0,0,0.7)",
          fontFamily: "'Inter', 'Arial Black', sans-serif",
          animationDelay: "0.1s",
        }}
      >
        Discover Amazing{" "}
        <span
          style={{
            background:
              "linear-gradient(90deg, #ff0080, #ff6600, #ffee00, #00cc44, #00aaff, #cc00ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            backgroundSize: "200% auto",
            animation: "holiTextShift 4s linear infinite",
            display: "inline-block",
          }}
        >
          Events
        </span>{" "}
        Near You
      </h1>

      {/* Subtitle */}
      <p
        className="animate-fade-in-up"
        style={{
          fontSize: "clamp(0.95rem, 1.8vw, 1.15rem)",
          color: "rgba(230,230,255,0.88)",
          marginBottom: "36px",
          maxWidth: "560px",
          margin: "0 auto 36px",
          lineHeight: 1.65,
          textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          animationDelay: "0.2s",
        }}
      >
        Join thousands of people experiencing the best events in music, food,
        technology, and community. Book your next adventure today! 🌈
      </p>

      {/* Search bar */}
      <div
        className="animate-fade-in-up"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          maxWidth: "600px",
          margin: "0 auto 28px",
          flexWrap: "wrap",
          animationDelay: "0.35s",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
          <input
            type="text"
            placeholder="Search events, artists, venues..."
            style={{
              width: "100%",
              padding: "14px 48px 14px 20px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.09)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,120,180,0.38)",
              color: "#fff",
              fontSize: "0.95rem",
              outline: "none",
              boxSizing: "border-box",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              transition: "box-shadow 0.25s",
            }}
            onFocus={(e) =>
              (e.target.style.boxShadow =
                "0 0 0 3px rgba(255,0,128,0.38), inset 0 1px 0 rgba(255,255,255,0.06)")
            }
            onBlur={(e) =>
              (e.target.style.boxShadow =
                "inset 0 1px 0 rgba(255,255,255,0.06)")
            }
          />
          <span
            style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "18px",
              opacity: 0.65,
            }}
          >
            🔍
          </span>
        </div>

        <button
          style={{
            padding: "14px 28px",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #ff0080, #ff6600, #ffcc00)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 20px rgba(255,80,0,0.45)",
            transition: "filter 0.2s, transform 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(1.18)";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "brightness(1)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Search ✦
        </button>
      </div>

      {/* Action buttons */}
      <div
        className="animate-fade-in-up"
        style={{
          display: "flex",
          gap: "16px",
          justifyContent: "center",
          flexWrap: "wrap",
          animationDelay: "0.5s",
        }}
      >
        <button
          onClick={() => router.push("/events")}
          style={{
            padding: "13px 30px",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #ff0080, #ff6600)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 22px rgba(255,0,128,0.45)",
            transition: "filter 0.2s, transform 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(1.15)";
            e.currentTarget.style.transform = "scale(1.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "brightness(1)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Browse Events 🎪
        </button>

        <button
          onClick={() => router.push("/about")}
          style={{
            padding: "13px 30px",
            borderRadius: "999px",
            background: "linear-gradient(135deg, rgba(0,170,255,0.18), rgba(204,0,255,0.18))",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
            border: "2px solid rgba(100,200,255,0.5)",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            transition: "filter 0.2s, transform 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(135deg, rgba(0,170,255,0.35), rgba(204,0,255,0.35))";
            e.currentTarget.style.transform = "scale(1.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(135deg, rgba(0,170,255,0.18), rgba(204,0,255,0.18))";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Learn More 🌈
        </button>
      </div>
    </div>

    {/* Inline keyframes */}
    <style>{`
      @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes pulseGlow {
        from { opacity: 0.35; transform: scale(0.95); }
        to   { opacity: 0.65; transform: scale(1.08); }
      }
      @keyframes holiTextShift {
        0%   { background-position: 0% center; }
        100% { background-position: 200% center; }
      }
      @keyframes diyaFlicker {
        0%  { filter: drop-shadow(0 0 8px rgba(255,140,0,0.7)); }
        50% { filter: drop-shadow(0 0 18px rgba(255,200,0,0.9)); }
        100%{ filter: drop-shadow(0 0 10px rgba(255,100,0,0.75)); }
      }
      @keyframes logoFloat {
        0%, 100% { transform: translateY(0px) scale(1); }
        50%       { transform: translateY(-12px) scale(1.015); }
      }
    `}</style>
  </section>
));

HeroSection.displayName = "HeroSection";

export default HeroSection;
