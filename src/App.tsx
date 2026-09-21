import { useEffect, useRef, useState } from "react";
import svgPaths from "../imports/svg-w17lhaxojo";

// ── Odometer ────────────────────────────────────────────────────────────────
// Column has REPEATS copies of 0-9. When pos exceeds HALF, we snap back by
// HALF (invisible, same visual digit) then continue animating — infinite loop.
const REPEATS = 40;
const TOTAL = 10 * REPEATS; // 400 cells
const HALF = TOTAL / 2;    // 200

function OdometerDigit({
  digit, color, fontSize, fontFamily, fontWeight, letterSpacing, nudge = 0, card = true, cardColor = "white",
}: {
  digit: string; color: string; fontSize: number;
  fontFamily: string; fontWeight: number; letterSpacing: string; nudge?: number; card?: boolean; cardColor?: string;
}) {
  const cellH = fontSize * 1.15;
  const padH = fontSize * 0.08;
  const padW = fontSize * 0.14;

  if (isNaN(parseInt(digit, 10))) {
    return (
      <span
        style={{
          color,
          fontSize,
          fontFamily,
          fontWeight,
          letterSpacing,
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "flex-end",
          height: cellH + padH * 2,
          paddingBottom: `${padH + 4}px`,
          paddingLeft: "1px",
          paddingRight: "2px",
        }}
      >
        {digit}
      </span>
    );
  }

  const d = parseInt(digit, 10);

  return (
    <div
      style={{
        height: cellH + padH * 2,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: card ? cardColor : "transparent",
        borderRadius: fontSize * 0.07,
        padding: `${padH}px ${padW + 3}px ${padH}px ${padW}px`,
        overflow: "hidden",
      }}
    >
      <div style={{ height: cellH, overflow: "hidden", display: "inline-block", transform: nudge ? `translateX(${nudge}px)` : undefined }}>
        <div
          style={{
            transform: `translateY(-${d * cellH}px)`,
            transition: "transform 220ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <div
              key={n}
              style={{
                height: cellH,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color,
                fontSize,
                fontFamily,
                fontWeight,
                letterSpacing,
                lineHeight: 1,
              }}
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OdometerCounter({
  value, color, fontSize, fontFamily, fontWeight, letterSpacing, minDigits = 1, nudge = 0, card = true, cardColor = "white",
}: {
  value: number; color: string; fontSize: number;
  fontFamily: string; fontWeight: number; letterSpacing: string; minDigits?: number; nudge?: number; card?: boolean; cardColor?: string;
}) {
  const str = value.toLocaleString("en-US", { minimumIntegerDigits: minDigits, useGrouping: true });
  return (
    <div style={{ display: "flex", alignItems: "flex-end", lineHeight: 1, gap: card ? 2 : 0 }}>
      {str.split("").map((ch, i) => (
        <OdometerDigit key={i} digit={ch} color={color} fontSize={fontSize} fontFamily={fontFamily} fontWeight={fontWeight} letterSpacing={letterSpacing} nudge={nudge} card={card} cardColor={cardColor} />
      ))}
    </div>
  );
}
const imgImage8 = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1024&h=976&fit=crop&auto=format";

// ~12.7 markers per second in the US
const MARKERS_PER_SECOND = 12;

// AusPen saved since 2016: ~1.44M total (cumulative), growing slowly
const AUSPEN_BASE = 1_440_000;
const AUSPEN_PER_SECOND = 1.85;

function useLiveCounter(initial: number, perSecond: number) {
  const [count, setCount] = useState(initial);
  const startRef = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      setCount(Math.floor(initial + elapsed * perSecond));
    }, 100);
    return () => clearInterval(id);
  }, [initial, perSecond]);
  return count;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

import Matter from "matter-js";

// ── Marker Physics Canvas with Matter.js ────────────────────────────────────
const MARKER_SVG_PATH =
  "M421 0C424.425 4.09556e-06 427.447 1.72245 429.249 4.34766V1.00098C429.249 0.439227 429.698 -0.012817 430.26 0.000976562C450.548 0.507145 488.863 1.61557 492.942 2.19824C497.09 2.79072 498.867 5.90088 498.867 8.86328H526.271C529.233 8.86328 548.243 16.2696 557.377 19.9727H600.333C600.82 21.1893 601.224 22.934 601.551 25.001H603.744C614.703 25.001 625.143 29.6705 632.449 37.8389C633.455 38.9634 633.455 40.6646 632.449 41.7891C625.143 49.9574 614.703 54.6259 603.744 54.626H601.6C601.265 56.8293 600.844 58.6884 600.333 59.9658H557.377C548.243 63.6689 529.233 71.0752 526.271 71.0752H498.868C498.868 74.0377 497.09 77.1487 492.942 77.7412C488.862 78.3239 450.548 79.4313 430.261 79.9375C429.699 79.9515 429.249 79.4994 429.249 78.9375V75.6514C427.447 78.277 424.425 80 421 80H10C4.47715 80 -3.26459e-07 75.5228 0 70V10C3.26459e-07 4.47715 4.47715 -3.26461e-07 10 0H421Z";

const MORIG_W = 634;
const MORIG_H = 80;
const MAX_MARKERS_PER_LAYER = 300;

// Colors for 3D depth
const BACK_LAYER_COLORS = ["#8066ffff"];
const MID_LAYER_COLORS = ["#8066ffff"];
const FRONT_LAYER_COLORS = ["#8066FF"];

// Collision categories
const CAT_BOUNDARY = 0x0001;
const CAT_BACK_LAYER = 0x0002;
const CAT_MID_LAYER = 0x0008;
const CAT_FRONT_LAYER = 0x0004;

interface MarkerItem {
  body: Matter.Body;
  color: string;
  scale: number;
  opacity: number;
  settledFrames: number;
}

function MarkerPhysicsCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver((entries) => {
      activeRef.current = active && entries[0].isIntersecting;
    });
    observer.observe(canvas);

    const path2d = new Path2D(MARKER_SVG_PATH);
    const { Engine, World, Bodies, Body } = Matter;

    // Natural vertical gravity with high solver iterations
    const engine = Engine.create({
      enableSleeping: true,
      positionIterations: 30,
      velocityIterations: 24,
      constraintIterations: 10,
      gravity: { x: 0, y: 1.2, scale: 0.001 },
    });

    let width = canvas.clientWidth || 954;
    let height = canvas.clientHeight || 340;
    canvas.width = width;
    canvas.height = height;

    // Static Boundaries (Floor, Left Wall, Right Wall) - interacts with BOTH layers
    const WALL_THICKNESS = 100;
    const boundaryOptions = {
      isStatic: true,
      friction: 0.02, // very low friction floor
      restitution: 0.0,
      collisionFilter: {
        category: CAT_BOUNDARY,
        mask: CAT_BACK_LAYER | CAT_MID_LAYER | CAT_FRONT_LAYER,
      },
    };

    const floor = Bodies.rectangle(width / 2, height + WALL_THICKNESS / 2 - 4, width * 2, WALL_THICKNESS, boundaryOptions);
    const leftWall = Bodies.rectangle(-WALL_THICKNESS / 2 + 4, height / 2, WALL_THICKNESS, height * 4, boundaryOptions);
    const rightWall = Bodies.rectangle(width + WALL_THICKNESS / 2 - 4, height / 2, WALL_THICKNESS, height * 4, boundaryOptions);

    World.add(engine.world, [floor, leftWall, rightWall]);

    const backMarkers: MarkerItem[] = [];
    const midMarkers: MarkerItem[] = [];
    const frontMarkers: MarkerItem[] = [];

    const spawnMarker = (layer: "back" | "mid" | "front") => {
      let list, category, baseScale, colorPalette, opacity;
      if (layer === "back") {
        list = backMarkers; category = CAT_BACK_LAYER; baseScale = 0.135; colorPalette = BACK_LAYER_COLORS; opacity = 0.75;
      } else if (layer === "mid") {
        list = midMarkers; category = CAT_MID_LAYER; baseScale = 0.155; colorPalette = MID_LAYER_COLORS; opacity = 0.9;
      } else {
        list = frontMarkers; category = CAT_FRONT_LAYER; baseScale = 0.175; colorPalette = FRONT_LAYER_COLORS; opacity = 1.0;
      }

      if (list.length >= MAX_MARKERS_PER_LAYER) return;

      const scaleVariance = 0.8 + Math.random() * 0.4; // +/- 20% variance
      const scale = baseScale * scaleVariance;
      const bodyW = MORIG_W * scale;
      const bodyH = MORIG_H * scale;

      // Spawn in top-right area (right 50%)
      const minX = width * 0.50;
      const maxX = width - bodyW * 0.4;
      const x = minX + Math.random() * Math.max(10, maxX - minX);
      const y = -bodyH * (1 + Math.random() * 2);

      const mask = CAT_BOUNDARY | category;

      const body = Bodies.rectangle(x, y, bodyW, bodyH, {
        chamfer: { radius: bodyH * 0.45 },
        restitution: 0.0,
        friction: 0.3,     // increased friction
        frictionStatic: 0.4,
        frictionAir: 0.004,
        density: 0.004,
        slop: 0.05,
        collisionFilter: {
          category,
          mask,
        },
      });

      const randomAngle = (Math.random() - 0.5) * (Math.PI * 2); // Full 360 degree random angle
      Body.setAngle(body, randomAngle);
      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 1.5, // natural drop without artificial wind
        y: 2.0 + Math.random() * 2.5,
      });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];

      list.push({ body, color, scale, opacity, settledFrames: 0 });
      World.add(engine.world, body);
    };

    // Resize observer
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW === 0 || newH === 0) continue;
        width = newW;
        height = newH;
        canvas.width = newW;
        canvas.height = newH;

        Body.setPosition(floor, { x: newW / 2, y: newH + WALL_THICKNESS / 2 - 4 });
        Body.setPosition(leftWall, { x: -WALL_THICKNESS / 2 + 4, y: newH / 2 });
        Body.setPosition(rightWall, { x: newW + WALL_THICKNESS / 2 - 4, y: newH / 2 });
      }
    });
    ro.observe(canvas);

    let rafId = 0;
    let lastTime = performance.now();
    let lastSpawnBack = performance.now();
    let lastSpawnMid = performance.now() + 83; // stagger spawn between layers
    let lastSpawnFront = performance.now() + 166;
    const layerSpawnInterval = 1000 / 4; // 4 per second per layer (12/s combined)

    const ctx = canvas.getContext("2d")!;

    function frame(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      // Spawn for each layer
      if (activeRef.current) {
        if (now - lastSpawnBack >= layerSpawnInterval) {
          spawnMarker("back");
          lastSpawnBack = now;
        }
        if (now - lastSpawnMid >= layerSpawnInterval) {
          spawnMarker("mid");
          lastSpawnMid = now;
        }
        if (now - lastSpawnFront >= layerSpawnInterval) {
          spawnMarker("front");
          lastSpawnFront = now;
        }
      }

      // Update physics
      Engine.update(engine, dt * 1000);

      // Lock settled bodies to static once they fully finish sliding into place
      const checkFreeze = (items: MarkerItem[]) => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const b = item.body;
          if (b.isStatic) continue;

          // If body has fully come to rest
          if (b.speed < 0.15 && Math.abs(b.angularSpeed) < 0.01 && b.position.y > 0) {
            item.settledFrames++;
            if (item.settledFrames > 28) {
              Body.setStatic(b, true); // Freeze permanently once motion is finished
            }
          } else {
            item.settledFrames = 0;
          }
        }
      };

      checkFreeze(backMarkers);
      checkFreeze(midMarkers);
      checkFreeze(frontMarkers);

      // Render
      ctx.clearRect(0, 0, width, height);

      const renderList = (items: MarkerItem[]) => {
        for (let i = 0; i < items.length; i++) {
          const { body, color, scale, opacity } = items[i];
          const { x, y } = body.position;
          const angle = body.angle;

          if (y < -40 || y > height + 60) continue;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.scale(scale, scale);
          ctx.translate(-MORIG_W / 2, -MORIG_H / 2);

          ctx.globalAlpha = opacity;
          ctx.fillStyle = color;
          ctx.fill(path2d);

          ctx.restore();
        }
      };

      // Draw back layer first (depth), then mid layer, then front layer
      renderList(backMarkers);
      renderList(midMarkers);
      renderList(frontMarkers);

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      ro.disconnect();
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none", borderRadius: "24px" }}
    />
  );
}

function IconArrowDown() {
  return (
    <div className="overflow-clip relative size-[16px]">
      <div className="absolute bottom-[20.83%] flex items-center justify-center left-1/2 right-1/2 top-[20.83%]" style={{ containerType: "size" }}>
        <div className="flex-none h-[0px] rotate-90 w-[100cqh]">
          <div className="relative size-full">
            <div className="absolute inset-[-0.67px_-7.14%]">
              <svg className="block size-full" fill="none" height="1.33333" preserveAspectRatio="none" viewBox="0 0 10.6667 1.33333" width="10.6667">
                <path d="M0.666667 0.666667H10" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-[20.83%] flex items-center justify-center left-[20.83%] right-[20.83%] top-1/2" style={{ containerType: "size" }}>
        <div className="flex-none h-[100cqw] rotate-90 w-[100cqh]">
          <div className="relative size-full">
            <div className="absolute inset-[-7.14%_-14.29%]">
              <svg className="block size-full" fill="none" height="10.6667" preserveAspectRatio="none" viewBox="0 0 6 10.6667" width="6">
                <path d={svgPaths.p3f0cc030} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LucideClockFading() {
  return (
    <div className="relative shrink-0 size-[16px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" viewBox="0 0 16 16" width="16">
        <g clipPath="url(#clip-clock)">
          <path d={svgPaths.p6df3180} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
        <defs>
          <clipPath id="clip-clock">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function HeaderNavbar({ todayCount, loadingState, setLoadingState }: { todayCount: number, loadingState: string, setLoadingState: (s: any) => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const isMobile = useMediaQuery("(max-width: 960px)");

  useEffect(() => {
    const t1 = setTimeout(() => setIsLoaded(true), 100);
    return () => { clearTimeout(t1); };
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 50 && currentScrollY > lastScrollY) {
        // Cuộn xuống
        setIsScrolled(true);
      } else if (currentScrollY < lastScrollY) {
        // Cuộn lên
        setIsScrolled(false);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className={`w-full shrink-0 ${isMobile ? "h-[136px]" : "h-[120px]"}`} />

      <div className="fixed top-0 left-0 w-full flex flex-col items-center z-40 pointer-events-none">
        {/* Top Nav Pill */}
        <div
          className={`w-full flex justify-center pointer-events-auto transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)]
            ${isMobile ? "pt-[68px] px-[16px]" : "pt-[24px] px-[40px]"}
            ${isScrolled ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"}
          `}
        >
          <div className={`bg-white w-full flex items-center justify-between ${isMobile ? "rounded-[20px] max-w-none px-[16px] py-[10px]" : "rounded-[999px] max-w-[1280px] px-[24px] py-[12px]"}`} style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            {/* Logo */}
            <div className="flex items-center gap-1 pl-[8px]">
              <span className="font-black text-[28px] tracking-[-1px] text-[#1f1f1f]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", lineHeight: 1 }}>AusPen</span>
            </div>

            {/* Center Menu — desktop only */}
            {!isMobile && (
              <div className="bg-[#f5f5f5] rounded-full flex items-center p-[4px] gap-[4px]">
                <button className="px-[24px] py-[10px] text-[15px] font-medium text-[#4a4a4a] hover:text-[#1f1f1f] cursor-pointer" style={{ fontFamily: "'DM Sans', sans-serif" }}>Home</button>
                <button className="px-[24px] py-[10px] text-[15px] font-medium text-[#4a4a4a] hover:text-[#1f1f1f] flex items-center gap-[6px] cursor-pointer" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Shop
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                <button className="px-[24px] py-[10px] text-[15px] font-medium text-[#4a4a4a] hover:text-[#1f1f1f] cursor-pointer" style={{ fontFamily: "'DM Sans', sans-serif" }}>How to Refill</button>
                <button className="bg-white rounded-full px-[24px] py-[10px] text-[15px] font-bold text-[#1f1f1f] shadow-sm cursor-pointer" style={{ fontFamily: "'DM Sans', sans-serif" }}>Why AusPen</button>
              </div>
            )}

            {/* Icons */}
            <div className={`flex items-center text-[#1f1f1f] pr-[8px] ${isMobile ? "gap-[8px]" : "gap-[12px]"}`}>
              <button className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
              </button>
              {/* Hamburger — mobile only */}
              {isMobile && (
                <button className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Attached Ticker */}
        <div
          onClick={() => { if (loadingState === "loading") setLoadingState("transitioning"); }}
          className={`pointer-events-auto bg-[#151d2b] flex items-center justify-center overflow-clip shadow-md fixed left-1/2 -translate-x-1/2 z-50 ${isMobile ? "px-[20px]" : "px-[40px]"} py-[8px]
          ${loadingState === "loading" ? "opacity-100" : (isLoaded ? "opacity-100" : "opacity-0")}
          ${loadingState === "done" ? "transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)]" : "transition-all duration-[1200ms] ease-[cubic-bezier(0.7,0,0.3,1)]"}
          ${loadingState === "loading" ? "w-[100vw] h-[100vh] top-0 rounded-none cursor-pointer max-w-[100vw]" :
            isMobile
              ? "w-[100vw] h-[56px] max-w-[100vw] rounded-none top-0"
              : (isScrolled ? "w-[100vw] h-[56px] max-w-[100vw] rounded-none top-0" : "w-[85%] max-w-[1088px] h-[56px] rounded-[0_0_99px_99px] top-[100px]")}
        `}
        >
          {/* Loading Background Canvas (Rain) - Fixed to viewport, clipped by shrinking parent */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[100vw] h-[100vh] pointer-events-none z-0">
            <LoadingPhysicsCanvas active={loadingState === "loading"} isMobile={isMobile} />
          </div>


          {/* Ticker content — mobile variant (Vertical to Horizontal Seamless Transform) */}
          {isMobile ? (
            <div className="relative z-10 flex items-center justify-between w-full h-full">
              {/* Left group: Counter + Text. Stacked during loading, inline during bar */}
              <div className={`relative origin-left flex items-center
                ${loadingState === "done" ? "transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)]" : "transition-all duration-[1200ms] ease-[cubic-bezier(0.7,0,0.3,1)]"}
                ${loadingState === "loading" ? "scale-[1.9]" : "scale-100"}
              `}>
                {/* Invisible spacer to reserve width for the flex container so 'See how' aligns properly */}
                <div className="opacity-0 pointer-events-none flex items-center" aria-hidden="true">
                  <div className="shrink-0 w-[95px] h-[28px]" /> {/* Approx counter width/height */}
                  <div className="flex flex-col ml-[12px]">
                    <p className="font-medium text-[14px] leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>Markers landfilled in the US today</p>
                    <p className="font-medium text-[14px] leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>{`AusPen's slowing it down.`}</p>
                  </div>
                </div>

                {/* Actual Animated Content */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 flex items-center w-full">
                  <div className="relative inline-flex items-center">
                    {/* Initial Load Fade-in Wrapper */}
                    <div className={`transition-all duration-[800ms] delay-[500ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[20px]"}`}>
                      <div className={`origin-left transition-transform duration-[1200ms] ease-[cubic-bezier(0.7,0,0.3,1)] ${loadingState === "loading" ? "scale-[1.5]" : "scale-100"}`}>
                        <OdometerCounter
                          value={todayCount}
                          color="#FF5927"
                          fontSize={20}
                          fontFamily="'Barlow Condensed', sans-serif"
                          fontWeight={600}
                          letterSpacing="0.04em"
                          card={true}
                          cardColor="white"
                          minDigits={6}
                          nudge={2}
                        />
                      </div>
                    </div>
                    
                    {/* Animated Text: stacked below in loading, inline right in sticky bar */}
                    <div className={`absolute transition-all duration-[1200ms] ease-[cubic-bezier(0.7,0,0.3,1)]
                      ${loadingState === "loading" ? "left-0 top-[100%] mt-[20px] translate-y-0" : "left-[100%] ml-[12px] top-1/2 -translate-y-1/2"}
                    `}>
                      <div className="flex flex-col">
                        <p className={`font-medium text-[14px] text-white whitespace-nowrap leading-snug transition-all duration-[800ms] delay-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[10px]"}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Markers landfilled in the US today</p>
                        <p className={`font-medium text-[14px] text-white whitespace-nowrap leading-snug transition-all duration-[800ms] delay-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${isLoaded ? "opacity-100 translate-y-0" : "translate-y-[10px] opacity-0"}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{`AusPen's slowing it down.`}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* "See how ↓" — slides in after loading state ends */}
              <div className={`shrink-0 transition-all duration-[500ms] delay-[300ms] ease-[cubic-bezier(0.25,1,0.5,1)]
                ${loadingState !== "loading" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-[20px]"}`}>
                <span className="font-semibold text-[16px] whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif", color: "#FF8F27" }}>
                  See how ↓
                </span>
              </div>
            </div>
          ) : (
            /* Ticker content — desktop variant */
            <div className={`relative z-10 flex items-center gap-[24px] transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${loadingState === "loading" ? "scale-150" : "scale-100"}`}>
              <div className={`transition-all duration-[800ms] delay-[500ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-[20px] opacity-0"}`}>
                <p className="font-medium text-[16px] text-white whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>Markers landfilled in the US today</p>
              </div>

              <div className={`shrink-0 flex items-center transition-all duration-[800ms] delay-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-[20px] opacity-0"}`}>
                <OdometerCounter
                  value={todayCount}
                  color="#FF5927"
                  fontSize={24}
                  fontFamily="'Barlow Condensed', sans-serif"
                  fontWeight={600}
                  letterSpacing="0.04em"
                  card={true}
                  cardColor="white"
                  minDigits={6}
                  nudge={2}
                />
              </div>

              <div className={`transition-all duration-[800ms] delay-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-[20px] opacity-0"}`}>
                <div className="font-medium text-[16px] text-white whitespace-nowrap flex items-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  <span>{`AusPen's slowing it down.`}</span>
                  <span
                    className={`inline-block whitespace-nowrap overflow-hidden transition-all duration-[1500ms] delay-[2800ms] ease-[cubic-bezier(0.25,1,0.5,1)] 
                    ${isLoaded ? "max-w-[100px] translate-x-0 opacity-100 ml-1" : "max-w-0 translate-x-[20px] opacity-0 ml-0"}`}
                    style={{ color: "#FF8F27" }}
                  >
                    See how ↓
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function LoadingPhysicsCanvas({ active, isMobile }: { active: boolean, isMobile?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const path2d = new Path2D(MARKER_SVG_PATH);
    const { Engine, World, Bodies, Body } = Matter;

    const engine = Engine.create({
      enableSleeping: true,
      positionIterations: 30,
      velocityIterations: 24,
      constraintIterations: 10,
      gravity: { x: 0, y: 1.2, scale: 0.001 },
    });

    let width = canvas.clientWidth || window.innerWidth;
    let height = canvas.clientHeight || window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const WALL_THICKNESS = 100;
    const boundaryOptions = {
      isStatic: true,
      friction: 0.02,
      restitution: 0.0,
      collisionFilter: {
        category: 0x0001,
        mask: 0x0010,
      },
    };
    const floor = Bodies.rectangle(width / 2, height + WALL_THICKNESS / 2, width * 2, WALL_THICKNESS, boundaryOptions);
    const leftWall = Bodies.rectangle(-WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height * 4, boundaryOptions);
    const rightWall = Bodies.rectangle(width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height * 4, boundaryOptions);
    World.add(engine.world, [floor, leftWall, rightWall]);

    const backMarkers: MarkerItem[] = [];
    const GREY_COLORS = ["#444444", "#555555", "#666666"];

    const spawnMarker = () => {
      if (backMarkers.length >= 200) return;

      const scale = 0.15 * (0.8 + Math.random() * 0.4);
      const bodyW = MORIG_W * scale;
      const bodyH = MORIG_H * scale;

      let minX = width * 0.3;
      let maxX = width * 0.7;
      if (isMobile) {
        minX = width * 0.55; // Shift to right half
        maxX = width * 0.95; // Near right edge
      }
      const x = minX + Math.random() * (maxX - minX);
      const y = -bodyH * (1 + Math.random() * 2);

      const body = Bodies.rectangle(x, y, bodyW, bodyH, {
        chamfer: { radius: bodyH * 0.45 },
        restitution: 0.0,
        friction: 0.3,
        frictionStatic: 0.4,
        frictionAir: 0.004,
        density: 0.004,
        slop: 0.05,
        collisionFilter: {
          category: 0x0010,
          mask: 0x0011,
        }
      });

      const randomAngle = (Math.random() - 0.5) * (Math.PI * 2);
      Body.setAngle(body, randomAngle);
      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 1.5,
        y: 2.0 + Math.random() * 2.5,
      });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06);

      const color = GREY_COLORS[Math.floor(Math.random() * GREY_COLORS.length)];

      backMarkers.push({ body, color, scale, opacity: 1, settledFrames: 0 });
      World.add(engine.world, body);
    };

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
        canvas.width = width;
        canvas.height = height;
        Body.setPosition(floor, { x: width / 2, y: height + WALL_THICKNESS / 2 });
        Body.setPosition(leftWall, { x: -WALL_THICKNESS / 2, y: height / 2 });
        Body.setPosition(rightWall, { x: width + WALL_THICKNESS / 2, y: height / 2 });
      }
    });
    ro.observe(canvas);

    let rafId = 0;
    let lastTime = performance.now();
    let lastSpawn = performance.now();
    const layerSpawnInterval = 1000 / 12;

    const ctx = canvas.getContext("2d")!;

    function frame(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      if (activeRef.current) {
        if (now - lastSpawn >= layerSpawnInterval) {
          spawnMarker();
          lastSpawn = now;
        }
      }

      Engine.update(engine, dt * 1000);

      const checkFreeze = (items: MarkerItem[]) => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const b = item.body;
          if (b.isStatic) continue;
          if (b.speed < 0.15 && Math.abs(b.angularSpeed) < 0.01 && b.position.y > 0) {
            item.settledFrames++;
            if (item.settledFrames > 28) Body.setStatic(b, true);
          } else {
            item.settledFrames = 0;
          }
        }
      };
      checkFreeze(backMarkers);

      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < backMarkers.length; i++) {
        const { body, color, scale, opacity } = backMarkers[i];
        const { x, y } = body.position;
        const angle = body.angle;
        if (y > height + 60) continue;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(scale, scale);
        ctx.translate(-MORIG_W / 2, -MORIG_H / 2);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.fill(path2d);
        ctx.restore();
      }

      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }} />
  );
}

export default function App() {
  const [loadingState, setLoadingState] = useState<"loading" | "transitioning" | "done">("loading");
  const isMobile = useMediaQuery("(max-width: 960px)");

  useEffect(() => {
    if (loadingState === "loading") {
      const isMobileNow = window.matchMedia("(max-width: 960px)").matches;
      const t = setTimeout(() => {
        setLoadingState("transitioning");
      }, isMobileNow ? 3300 : 4500);
      return () => clearTimeout(t);
    }

    if (loadingState === "transitioning") {
      const t = setTimeout(() => {
        setLoadingState("done");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [loadingState]);
  // "Landfilled in the US" — starts from 0 when you arrive
  const now = new Date();
  const arrivedCount = useLiveCounter(0, MARKERS_PER_SECOND);
  // Top-bar: today's running total
  const secondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const todayCount = useLiveCounter(Math.floor(secondsToday * MARKERS_PER_SECOND), MARKERS_PER_SECOND);
  // AusPen saved counter
  const auspenCount = useLiveCounter(AUSPEN_BASE, AUSPEN_PER_SECOND);

  return (
    <div className="flex flex-col items-center relative w-full min-h-screen overflow-hidden bg-[#f6f6f6]" data-name="Demo" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header & Sticky Ticker */}
      <HeaderNavbar todayCount={todayCount} loadingState={loadingState} setLoadingState={setLoadingState} />

      {/* Main Content Wrapper */}
      <div className={`flex flex-col items-center w-full min-h-screen bg-[#f6f6f6] transition-transform duration-[1200ms] ease-[cubic-bezier(0.7,0,0.3,1)]
        ${loadingState === "loading" ? "scale-[1.2]" : "scale-100"}
      `}>

        {/* Main section */}
        <div className="bg-[#f6f6f6] flex flex-col items-center w-full px-[20px] py-[40px] lg:px-[40px] lg:py-[80px]">
          <div className="flex flex-col gap-[40px] items-start max-w-[1280px] w-full">

            {/* Heading */}
            <div className="flex flex-col gap-[16px] items-start w-full">
              <div className="bg-[#ff8f27] px-[16px] py-[8px] rounded-full shrink-0">
                <p className="font-medium text-[14px] lg:text-[16px] text-white whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>Departures — to landfill</p>
              </div>
              <div className="flex flex-col lg:flex-row items-start w-full lg:gap-x-[40px] gap-y-[12px] lg:gap-y-[24px]">
                <p className="font-bold text-[#ff8f27] text-[48px] lg:text-[56px] tracking-[-1.12px] whitespace-nowrap leading-[1.1] lg:leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>13 markers</p>
                <div className="flex flex-1 flex-col items-start min-w-0">
                  <p className="font-bold text-[#1f1f1f] text-[48px] lg:text-[56px] tracking-[-1.12px] leading-[1.1] lg:leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>are discarded</p>
                  <div className="flex flex-col lg:flex-row lg:flex-wrap gap-[12px] lg:gap-[17px] items-start w-full" style={{ padding: 0 }}>
                    <div className="flex flex-col gap-[4px] shrink-0">
                      <p className="font-bold text-[#1f1f1f] text-[48px] lg:text-[56px] tracking-[-1.12px] leading-[1.1] lg:leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>every second</p>
                      <div className="h-[17px] relative w-[180px] lg:w-[215px]">
                        <div className="absolute inset-[-14.71%_-1.16%]">
                          <svg className="block size-full" fill="none" height="22" preserveAspectRatio="none" viewBox="0 0 220 22.0001" width="220">
                            <path d={svgPaths.p366c6080} stroke="#FF8F27" strokeLinecap="round" strokeWidth="5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center shrink-0">
                      <p className="font-bold text-[#1f1f1f] text-[48px] lg:text-[56px] tracking-[-1.12px] leading-[1.1] lg:leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>in the US.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Counter card */}
            <div className="flex flex-col lg:flex-row gap-[24px] items-start justify-end w-full">
              {/* placeholder spacer */}
              <div className="hidden lg:flex items-center opacity-0 pr-[32px] h-px w-[304px]">
                <div className="bg-[#454545] flex-1 h-full rounded-[16px]" />
              </div>
              {/* purple card */}
              <div className="flex-1 w-full lg:max-w-[954px] min-w-0 lg:min-w-[636px] relative rounded-[24px]" style={{ overflow: "hidden", background: "#6D57D9" }}>
                <MarkerPhysicsCanvas active={loadingState === "done"} />
                <div className="flex flex-col items-start lg:items-center size-full py-[32px] px-[20px] lg:pb-[56px] lg:pt-[40px] lg:px-[40px] gap-[32px]" style={{ position: "relative", zIndex: 1 }}>
                  {/* Row 1: landfilled */}
                  <div className="flex flex-col lg:flex-row lg:flex-wrap gap-[16px] lg:gap-[24px] items-start lg:items-end justify-end pb-[16px] lg:pb-[32px] w-full">
                    <div className="flex flex-1 flex-col gap-[4px] lg:gap-[8px] items-start min-w-0 lg:min-w-[230px]">
                      <div className="font-medium text-[#fafafa] text-[20px] lg:text-[24px] leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        <p className="mb-0">Markers landfilled in the US</p>
                      </div>
                      <div className="flex items-center gap-[8px] py-[4px] opacity-80 lg:opacity-100">
                        <LucideClockFading />
                        <p className="text-[14px] lg:text-[16px] text-white whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>since you arrived</p>
                      </div>
                    </div>
                    <div className="flex justify-end w-full lg:w-auto">
                      <OdometerCounter value={arrivedCount} color="rgb(255,134,42)" fontSize={isMobile ? 56 : 80} fontFamily="'Barlow Condensed',sans-serif" fontWeight={600} letterSpacing="0.04em" minDigits={6} nudge={4} cardColor="#8066FF" />
                    </div>
                  </div>
                  {/* Row 2: AusPen saved */}
                  <div className="flex flex-col lg:flex-row lg:flex-wrap gap-[16px] lg:gap-[24px] items-start lg:items-end justify-end w-full">
                    <div className="flex flex-1 flex-col gap-[4px] lg:gap-[8px] items-start min-w-0 lg:min-w-[230px]">
                      <p className="font-medium text-[#fafafa] text-[20px] lg:text-[24px] leading-snug w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>Kept out of landfill by AusPen users</p>
                      <div className="flex items-center gap-[8px] py-[4px] opacity-80 lg:opacity-100">
                        <LucideClockFading />
                        <p className="text-[14px] lg:text-[16px] text-white whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>since 2016</p>
                      </div>
                    </div>
                    <div className="flex justify-end w-full lg:w-auto">
                      <OdometerCounter value={auspenCount} color="#33FF5B" fontSize={isMobile ? 56 : 80} fontFamily="'Barlow Condensed',sans-serif" fontWeight={600} letterSpacing="0.04em" nudge={4} cardColor="#8066FF" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom section */}
            <div className="flex flex-col lg:flex-row gap-[24px] lg:items-end w-full">
              <div className="flex flex-1 gap-[24px] lg:items-end max-w-[954px] min-w-0">
                {/* Image */}
                <div className="hidden lg:flex items-center pr-[32px] shrink-0 w-[304px]">
                  <div className="flex flex-1 flex-col items-start min-w-0 overflow-clip rounded-[16px]">
                    <div className="aspect-[1024/976] relative w-full">
                      <img alt="Markers and drawing supplies" className="absolute inset-0 max-w-none object-cover size-full" src={imgImage8} />
                    </div>
                  </div>
                </div>
                {/* Text + CTA */}
                <div className="flex flex-1 flex-col gap-[24px] lg:gap-[40px] items-start min-w-0">
                  <div className="w-full lg:max-w-[524px] text-[20px] lg:text-[24px] leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <p className="font-medium text-[#8066FF] mb-[8px] lg:mb-0">{`That's your impact.`}</p>
                    <p className="font-medium text-[#1f1f1f]">{`AusPen users have saved 144,000+ from landfill. One refillable marker replaces 80 disposables."`}</p>
                  </div>
                  <button className="bg-[#8066FF] rounded-[12px] lg:rounded-[16px] shrink-0 cursor-pointer transition-transform hover:scale-105" style={{ boxShadow: "0px 4px 3px rgba(0,0,0,0.1), 0px 2px 2px rgba(0,0,0,0.1)" }}>
                    <div className="flex items-center gap-[8px] px-[20px] py-[10px] lg:px-[24px] lg:py-[12px]">
                      <p className="font-medium text-[14px] lg:text-[16px] text-center text-white whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>{`There's a Better Way`}</p>
                      <IconArrowDown />
                    </div>
                  </button>
                </div>
              </div>
              {/* Footnotes */}
              <div className="flex items-start lg:items-center justify-center lg:pr-[16px] shrink-0 w-full lg:w-[304px] mt-[24px] lg:mt-0">
                <p className="flex-1 min-w-0 text-[#1f1f1f] text-[12px] lg:text-[14px] opacity-50 leading-snug whitespace-pre-wrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {`Estimated 400 million dry-erase markers discarded annually in the US (widely reported industry estimate) · ~2-week average disposable lifespan · recycling rate ~0.375% (Design Life-Cycle, UC Davis).\n\nBoards are illustrative, driven by the annual estimate (≈12.7 per second). Saved counter: cumulative AusPen user impact since 2016.`}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
