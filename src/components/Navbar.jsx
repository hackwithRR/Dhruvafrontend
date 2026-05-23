import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPalette, FaSignOutAlt, FaBolt, FaCheckCircle, FaChartLine } from "react-icons/fa";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import RippleEffect from "./RippleEffect";
import ClickSpark from "./ClickSpark";

// 1. Background & Animation Logic (Tailwind)
const themes = {
    DeepSpace: {
        bg: "bg-[#02040a]",
        glow: "rgba(56, 189, 248, 0.15)",
        blobs: ["bg-[#0c1b35]", "bg-[#1e1b4b]"],
        grid: "rgba(255, 255, 255, 0.02)",
        scan: "via-[#38bdf8]/10",
        accent: "text-sky-400"
    },
    Sakura: {
        bg: "bg-[#0a0104]",
        glow: "rgba(244, 63, 94, 0.2)",
        blobs: ["bg-[#4c0519]", "bg-[#2d0616]"],
        grid: "rgba(244, 63, 94, 0.05)",
        scan: "via-[#fb7185]/20",
        accent: "text-rose-400"
    },
    Cyberpunk: {
        bg: "bg-[#050505]",
        glow: "rgba(168, 85, 247, 0.25)",
        blobs: ["bg-[#7e22ce]/20", "bg-[#06b6d4]/20"],
        grid: "rgba(6, 182, 212, 0.1)",
        scan: "via-[#a855f7]/40",
        accent: "text-cyan-400"
    },

};

// 2. UI Component Colors (Hex Codes)
const themeConfigs = {
    DeepSpace: { primary: "#38bdf8", text: "#ffffff", sub: "#94a3b8", border: "#0c1b35", navBg: "#02040a", btnBg: "#0f172a" },
    Sakura: {
        primary: "#db2777", // Pink Petal
        text: "#4a2c2a",    // Dark Branch Brown (much better than black for this palette)
        sub: "#9d174d",     // Deep Rose
        border: "#f9a8d4",  // Soft Petal Edge
        navBg: "#fff5f7",   // Warm Blush
        btnBg: "#fce7f3"    
    },
    Cyberpunk: { primary: "#a855f7", text: "#ecfeff", sub: "#22d3ee", border: "#1e1b4b", navBg: "#050505", btnBg: "#0f172a" },
    RoyalParchment: {
        primary: "#b45309", // Warm Amber-Brown
        text: "#451a03",    // Deep Espresso (Better than black for cream)
        sub: "#92400e",     // Cinnamon
        border: "#fcd34d",  // Golden border
        navBg: "#fdf6e3",   // Matching Cream base
        btnBg: "#fef3c7"    
    },
    Light: {
        primary: "#4f46e5", // Indigo (Clear & Professional)
        text: "#000000",
        sub: "#64748b",
        border: "#e2e8f0",
        navBg: "#fcfcf9", // Match RoyalParchment Background

        btnBg: "#f1f5f9"
    },
    MidnightAurora: {
        primary: "#34d399", // Emerald Green
        text: "#ecfdf5",
        sub: "#6ee7b7",
        border: "#064e3b",
        navBg: "#010806", 
        btnBg: "#06201b"
    },
    SunsetDrift: {
        primary: "#fb923c", // Warm Orange
        text: "#fff7ed",
        sub: "#fdba74",
        border: "#431407",
        navBg: "#0f0402",
        btnBg: "#2d0a05"
    },
    Phantom: {
        primary: "#ffffff", // Pure White
        text: "#ffffff",
        sub: "#a3a3a3",
        border: "#262626",
        navBg: "#050505", 
        btnBg: "#171717"
    },
    Solaris: {
        primary: "#facc15", // Bright Gold
        text: "#fefce8",
        sub: "#eab308",
        border: "#422006",
        navBg: "#050401",
        btnBg: "#1c1917"
    },
    Aero: {
        primary: "#cbd5e1", // Silver Slate
        text: "#f8fafc",
        sub: "#94a3b8",
        border: "#334155",
        navBg: "#0f172a",
        btnBg: "#1e293b"
    },
    Toxic: {
        primary: "#a3e635", // Lime Green
        text: "#f7fee7",
        sub: "#4d7c0f",
        border: "#14532d",
        navBg: "#020500",
        btnBg: "#1a2e05"
    },
    Synthwave: {
        primary: "#22d3ee", // Cyan accents
        text: "#fff1f2",
        sub: "#ff0080", // Hot Pink
        border: "#4c0519",
        navBg: "#120422",
        btnBg: "#2e1065"
    },
    Coffee: {
        primary: "#d6c5bb", // Latte Cream  
        text: "#fafaf9",
        sub: "#a8a29e",
        border: "#292524",
        navBg: "#0c0a09",
        btnBg: "#1c1917"
    },
    RetroTerminal: {
        primary: "#22c55e", // Matrix Green
        text: "#dcfce7",
        sub: "#15803d",
        border: "#052e16",
        navBg: "#0a0f0a",
        btnBg: "#062006"
    },

    Amethyst: {
        primary: "#c084fc", // Crystal Light
        text: "#faf5ff",
        sub: "#7e22ce",
        border: "#3b0764",
        navBg: "#0d0214",
        btnBg: "#1e0a2d"
    },

    Blueprint: {
        primary: "#ffffff",
        text: "#ffffff",
        sub: "#93c5fd",
        border: "rgba(255,255,255,0.3)",
        navBg: "#1e40af",
        btnBg: "#1e3a8a"
    },
    Clay: {
        primary: "#44403c",
        text: "#1c1917",
        sub: "#78716c",
        border: "#d6d3d1",
        navBg: "#e5e5e1",
        btnBg: "#d1d1cc"
    },
    Radioactive: {
        primary: "#000000",
        text: "#000000",
        sub: "#3f6212",
        border: "#000000",
        navBg: "#bef264",
        btnBg: "#a3e635"
    },

    CrimsonOLED: {
        primary: "#dc2626",
        text: "#ffffff",
        sub: "#7f1d1d",
        border: "#450a0a",
        navBg: "#000000",
        btnBg: "#1a1a1a"
    },
    Industrial: {
        primary: "#f97316",
        text: "#e5e5e5",
        sub: "#a3a3a3",
        border: "#404040",
        navBg: "#1c1c1c",
        btnBg: "#262626"
    },
    MidnightSun: {
        primary: "#fbbf24",
        text: "#fdf4ff",
        sub: "#a855f7",
        border: "#4c1d95",
        navBg: "#1a0b2e",
        btnBg: "#2d1b4e"
    }
};

export default function Navbar({ userData }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // --- 1. Mouse tracking for 3D logo tilt ---
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    useEffect(() => {
      const handleMove = (e) => {
        const rect = e.currentTarget?.getBoundingClientRect?.() || { width: window.innerWidth, height: window.innerHeight };
        const x = (e.clientX / window.innerWidth - 0.5) * 10;
        const y = (e.clientY / window.innerHeight - 0.5) * 10;
        setMousePos({ x, y });
      };
      window.addEventListener("mousemove", handleMove);
      return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    const currentThemeKey = userData?.theme || "DeepSpace";
    const activeTheme = themeConfigs[currentThemeKey] || themeConfigs.DeepSpace;

    // Fixes the "Scholar" bug by checking every possible name field
    const displayName = userData?.name || userData?.displayName || auth.currentUser?.displayName || "Scholar";
    const photoURL = userData?.pfp || auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid}`;
    const logoLetters = "PADHOYAAR".split("");

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav
            className="sticky top-0 z-[1000] w-full border-b transition-all duration-500 shadow-2xl overflow-visible"
            style={{ backgroundColor: activeTheme.navBg, borderColor: activeTheme.border }}
        >
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 h-16 flex items-center justify-between overflow-visible">

                <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                    {/* BRAND: Kinetic Pulse */}
                    <motion.div
                        style={{
                            transform: `perspective(600px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`
                        }}
                        whileHover={{ scale: 1.04 }}
                        whileTap="tap"
                        className="flex items-center gap-2 cursor-pointer relative group"
                        onClick={() => navigate("/")}
                    >
                        <div className="absolute -inset-2 rounded-xl blur-lg opacity-0 group-hover:opacity-30 transition-all" style={{ backgroundColor: activeTheme.primary }} />
                        <motion.div
                            variants={{ hover: { scale: 1.2, rotate: [0, -15, 15, 0] } }}
                            animate={{ boxShadow: [
                                `0 0 5px ${activeTheme.primary}`,
                                `0 0 20px ${activeTheme.primary}`,
                                `0 0 5px ${activeTheme.primary}`
                            ] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="relative w-9 h-9 rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
                            style={{ backgroundColor: activeTheme.primary }}>
                            <FaBolt className="text-white text-base relative z-10" />
                            <motion.div variants={{ hover: { x: ["-100%", "200%"] } }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 bg-white/40 skew-x-12" />
                        </motion.div>
                        <div className="flex relative group">
                            {logoLetters.map((l, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ y: 0 }}
                                    animate={{ y: [0, -3, 0], rotateX: [0, 10, 0] }}
                                    whileHover={{
                                        y: -8,
                                        scale: 1.1,
                                        rotateY: 15,
                                        color: activeTheme.primary
                                    }}
                                    transition={{
                                        y: {
                                            repeat: Infinity,
                                            duration: 2 + i * 0.15,
                                            ease: "easeInOut"
                                        },
                                        rotateX: {
                                            repeat: Infinity,
                                            duration: 3 + i * 0.2,
                                            ease: "easeInOut"
                                        },
                                        scale: { type: "spring", stiffness: 200, damping: 12 },
                                        delay: i * 0.05
                                    }}
                                    className="font-black tracking-tighter uppercase text-lg sm:text-xl whitespace-nowrap"
                                    style={{
                                        color: activeTheme.text,
                                        textShadow: `0 0 8px ${activeTheme.primary}80`
                                    }}
                                >
                                    {l}
                                </motion.span>
                            ))}
                            <motion.div
                              className="absolute inset-0 pointer-events-none rounded-[0.5rem]"
                              animate={{
                                background: [
                                  `linear-gradient(120deg, transparent, ${activeTheme.primary}20, transparent)`,
                                  `linear-gradient(120deg, transparent, ${activeTheme.primary}50, transparent)`,
                                  `linear-gradient(120deg, transparent, ${activeTheme.primary}20, transparent)`
                                ]
                              }}
                              transition={{ repeat: Infinity, duration: 3 }}
                              style={{
                                mixBlendMode: "screen",
                                filter: "blur(6px)",
                                opacity: 0.7
                              }}
                            />
                        </div>
                    </motion.div>

                    {/* AVATAR: Orbital Scanner */}
                    <motion.div
                        whileHover="hover"
                        className="flex items-center gap-2 sm:gap-4 cursor-pointer border-l pl-3 sm:pl-6"
                        style={{ borderColor: activeTheme.border }}
                        onClick={() => navigate("/profile")}
                    >
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-12 h-12 rounded-full border opacity-30" style={{ borderColor: activeTheme.border }} />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                                className="absolute w-12 h-12 rounded-full border-2 border-dashed opacity-50"
                                style={{ borderColor: activeTheme.primary }}
                            />
                            <img src={photoURL} className="relative w-10 h-10 rounded-full object-cover border-2 z-10" style={{ borderColor: activeTheme.border }} alt="Avatar" />
                        </div>
                        <div className="hidden sm:flex flex-col">
                            <motion.span variants={{ hover: { x: 5, letterSpacing: "0.05em", color: activeTheme.primary } }} className="font-black text-sm tracking-tight transition-all" style={{ color: activeTheme.text }}>
                                {displayName}
                            </motion.span>
                            <motion.p className="text-[7px] font-black uppercase tracking-[0.4em]" style={{ color: activeTheme.sub }}>
                                {currentThemeKey}_READY
                            </motion.p>
                        </div>
                    </motion.div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0" ref={dropdownRef}>
                    {/* Statistics Button - Enhanced with glassy smooth UX */}
                    <RippleEffect color={activeTheme.primary}>
                      <ClickSpark sparkColor={activeTheme.primary} sparkCount={6} sparkRadius={20}>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.9, rotate: -3 }}
                            transition={{ type: "spring", stiffness: 220, damping: 20 }}
                            onClick={() => navigate("/statistics")}
                            className="hidden sm:block relative z-10 group p-2.5 sm:p-3 rounded-[1.5rem] overflow-hidden border transition-all duration-300 ease-out hover:shadow-xl active:scale-95 backdrop-blur-md"
                            style={{
                              borderColor: activeTheme.border + "80",
                              backgroundColor: activeTheme.btnBg,
                              color: activeTheme.text,
                              boxShadow: `0 6px 18px ${activeTheme.primary}20`,
                              backdropFilter: 'blur(6px)',
                              transformOrigin: "center",
                              willChange: "transform",
                              borderRadius: "1.5rem",
                              transform: "translateZ(0)",
                              WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                            }}
                            title="Statistics"
                        >
                            <motion.div className="group-hover:scale-110 transition-transform" style={{ color: activeTheme.primary, filter: 'drop-shadow(0 0 8px currentColor)' }}>
                              <FaChartLine className="text-xl" />
                            </motion.div>
                        </motion.button>
                      </ClickSpark>
                    </RippleEffect>

                    {/* Theme Selector - Enhanced with shimmer and ring glow */}
                    <div className="relative">
                        <RippleEffect color={activeTheme.primary}>
                          <ClickSpark sparkColor={activeTheme.primary} sparkCount={8} sparkRadius={25}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.92 }}
                                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="relative z-10 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 rounded-[1.5rem] overflow-hidden border shadow-md hover:shadow-xl transition-all duration-300 ease-out backdrop-blur-md group"
                                style={{
                                  borderColor: activeTheme.border + "80",
                                  backgroundColor: activeTheme.btnBg,
                                  color: activeTheme.text,
                                  backdropFilter: 'blur(8px)',
                                  transformOrigin: "center",
                                  willChange: "transform",
                                  borderRadius: "1.5rem",
                                  transform: "translateZ(0)",
                                  WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                                  boxShadow: `0 6px 18px ${activeTheme.primary}20`,
                                }}
                            >
                                <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                                    <FaPalette className="text-lg group-hover:animate-ping group-hover:[filter:drop-shadow(0_0_10px_currentColor)] transition-all" style={{ color: activeTheme.primary }} />
                                    <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest group-hover:tracking-[0.3em] transition-all">Interface</span>
                                </div>
                                {/* Removed fancy gradient hover background */}
                                <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:animate-shine transform -translate-x-[100%] pointer-events-none z-0" />
                            </motion.button>
                          </ClickSpark>
                        </RippleEffect>

                      <AnimatePresence>
                          {dropdownOpen && (
                              <motion.div
                                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                  className="absolute right-0 mt-4 w-[90vw] sm:w-64 max-w-xs rounded-[1.5rem] border shadow-2xl z-[2000] overflow-hidden"
                                  style={{
                                      backgroundColor: activeTheme.navBg,
                                      borderColor: activeTheme.border
                                  }}
                              >
                                  {/* Scroll Container */}
                                  <div
                                      className="max-height-scroll overflow-y-auto p-2"
                                      style={{
                                          maxHeight: '400px', // Limits height to roughly 6-7 items
                                          scrollbarWidth: 'thin', // Firefox
                                          scrollbarColor: `${activeTheme.primary} transparent`, // Firefox
                                      }}
                                  >
                                      {/* CSS for Chrome/Safari/Edge Scrollbar */}
                                      <style>{`
                    .max-height-scroll::-webkit-scrollbar {
                        width: 4px;
                    }
                    .max-height-scroll::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .max-height-scroll::-webkit-scrollbar-thumb {
                        background-color: ${activeTheme.primary};
                        border-radius: 20px;
                    }
                `}</style>

                                      {Object.keys(themeConfigs).map((env) => (
                                          <motion.button
                                              key={env}
                                              whileHover={{ 
                                                  scale: 1.05, 
                                                  y: -3, 
                                                  rotateX: 5,
                                                  backgroundColor: activeTheme.btnBg + 'CC',
                                                  boxShadow: `0 10px 25px ${activeTheme.primary}40`
                                              }}
                                              whileTap={{ scale: 0.97, y: 0 }}
                                              onClick={() => {
                                                  updateDoc(doc(db, "users", auth.currentUser.uid), { theme: env });
                                                  setDropdownOpen(false);
                                              }}
                                              className="flex items-center justify-between w-full p-4 rounded-xl transition-all mb-1 last:mb-0 hover:shadow-2xl hover:shadow-[0_20px_40px_rgba(var(--tw-shadow-color))] duration-300"
                                              style={{ 
                                                  color: currentThemeKey === env ? activeTheme.primary : activeTheme.text,
                                                  '--tw-shadow-color': `${activeTheme.primary.slice(0,-1)}0.3`
                                              }}
                                          >
                                              <span className="text-[10px] font-black uppercase tracking-widest">{env}</span>
                                              {currentThemeKey === env && <FaCheckCircle className="text-xs" />}
                                          </motion.button>
                                      ))}
                                  </div>
                              </motion.div>
                          )}
                      </AnimatePresence>
                    </div>

                    {/* Logout Button - Enhanced with glassy smooth UX */}
                    <RippleEffect color="#ef4444">
                      <ClickSpark sparkColor="#ef4444" sparkCount={10} sparkRadius={30}>
                        <motion.button
                            whileHover={{
                              scale: 1.03,
                              backgroundColor: "#ef4444CC",
                              color: "#ffffff"
                            }}
                            whileTap={{ scale: 0.88, rotate: -4, backgroundColor: "#dc2626" }}
                            transition={{ type: "spring", stiffness: 180, damping: 20 }}
                            onClick={() => auth.signOut()}
                            className="relative z-10 group p-2.5 sm:p-3.5 rounded-[1.5rem] overflow-hidden border transition-all duration-300 ease-out hover:shadow-lg active:scale-90 backdrop-blur-md animate-glow-red"
                            style={{
                              borderColor: activeTheme.border + "80",
                              backgroundColor: activeTheme.btnBg,
                              color: activeTheme.text,
                              backdropFilter: 'blur(6px)',
                              transformOrigin: "center",
                              willChange: "transform",
                              borderRadius: "1.5rem",
                              transform: "translateZ(0)",
                              WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                              boxShadow: `0 6px 18px ${activeTheme.primary}20`,
                            }}
                        >
                            <FaSignOutAlt className="text-xl group-hover:scale-110 group-hover:[filter:drop-shadow(0_0_12px_#ef4444)] transition-all" />
                        </motion.button>
                      </ClickSpark>
                    </RippleEffect>
                </div>
            </div>
            <div className="[&_.group-hover]:animate-glow-red group-hover:[--tw-shadow-color:theme(colors.red.400/_40)]" />
        </nav>
    );
}
