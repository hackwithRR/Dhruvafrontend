import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaChevronDown, FaHourglassHalf, FaMedal, FaPalette, FaRocket, FaShieldAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar({ currentUser, theme, setTheme, logout, userData }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef(null);

    const isProfilePage = location.pathname === "/profile";
    const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Scholar";
    const photoURL = currentUser?.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff&bold=true`;

    // --- 🎨 DYNAMIC THEME ENGINE ---
    const themeConfigs = {
        DeepSpace: { 
            nav: "bg-[#050505]/80 border-white/5 text-white backdrop-blur-2xl", 
            dropdown: "bg-[#0c0c0c] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)]",
            accent: "text-indigo-400",
            glow: "bg-indigo-500/20",
            border: "border-indigo-500/30",
            dot: "bg-indigo-500",
            btn: "hover:bg-indigo-500/10 text-indigo-100",
            subtext: "text-indigo-400/50"
        },
        Light: { 
            nav: "bg-white/80 border-slate-200 text-slate-900 backdrop-blur-2xl shadow-sm", 
            dropdown: "bg-white border-slate-200 shadow-xl",
            accent: "text-indigo-600",
            glow: "bg-slate-100",
            border: "border-slate-200",
            dot: "bg-indigo-600",
            btn: "hover:bg-slate-100 text-slate-600",
            subtext: "text-slate-400"
        },
        Sakura: { 
            nav: "bg-[#1a0f12]/80 border-rose-500/20 text-rose-50 backdrop-blur-2xl", 
            dropdown: "bg-[#221418] border-rose-500/20 shadow-[0_20px_50px_rgba(255,50,100,0.15)]",
            accent: "text-rose-400",
            glow: "bg-rose-500/10",
            border: "border-rose-500/30",
            dot: "bg-rose-500",
            btn: "hover:bg-rose-500/10 text-rose-200",
            subtext: "text-rose-400/50"
        },
        Cyberpunk: { 
            nav: "bg-[#050a12]/80 border-cyan-500/20 text-cyan-50 backdrop-blur-2xl", 
            dropdown: "bg-[#0a101f] border-cyan-500/20 shadow-[0_20px_50px_rgba(0,255,255,0.1)]",
            accent: "text-cyan-400",
            glow: "bg-cyan-500/10",
            border: "border-cyan-500/30",
            dot: "bg-cyan-500",
            btn: "hover:bg-cyan-500/10 text-cyan-200",
            subtext: "text-cyan-400/50"
        }
    };

    const config = themeConfigs[theme] || themeConfigs.DeepSpace;

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            toast.success("Session Ended");
            navigate("/login");
        } catch (e) {
            toast.error("Exit Failed");
            setIsLoggingOut(false);
        }
    };

    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <nav className={`sticky top-0 z-[100] w-full border-b transition-all duration-700 ${config.nav}`}>
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                
                {/* --- LEFT: USER HUD --- */}
                <div 
                    className="flex items-center gap-4 cursor-pointer group"
                    onClick={() => !isLoggingOut && navigate("/profile")}
                >
                    <div className="relative">
                        {/* Dynamic Theme Glow */}
                        <div className={`absolute -inset-1 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${config.dot}`}></div>
                        
                        <img 
                            src={photoURL} 
                            className={`relative w-10 h-10 rounded-full object-cover border-2 transition-transform group-hover:scale-105 duration-300 ${config.border}`} 
                            alt="Avatar" 
                        />
                        
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${theme === 'Light' ? 'border-white' : 'border-black'} bg-emerald-500`} />
                    </div>

                    <div className="hidden sm:block">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-[13px] uppercase tracking-wider">{displayName}</span>
                            {userData?.xp > 0 && (
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border transition-colors ${config.border} ${config.glow}`}>
                                    <FaRocket className={config.accent} size={8}/> 
                                    <span className={config.accent}>{userData.xp}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <FaShieldAlt className={`text-[8px] ${config.accent} opacity-50`} />
                            <p className={`text-[8px] font-black uppercase tracking-[0.25em] ${config.subtext}`}>
                                System Authenticated
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: HUD CONTROLS --- */}
                <div className="flex items-center gap-2 md:gap-4" ref={dropdownRef}>
                    
                    {/* Theme Portal */}
                    <div className="relative">
                        <button 
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className={`group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all active:scale-95 ${config.border} ${config.glow} hover:border-opacity-100 border-opacity-40`}
                        >
                            <FaPalette className={`text-xs transition-transform group-hover:rotate-12 ${config.accent}`} />
                            <span className={`hidden lg:inline text-[9px] font-black uppercase tracking-widest ${config.accent}`}>Environment</span>
                            <FaChevronDown className={`text-[8px] opacity-40 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                    className={`absolute right-0 mt-3 w-44 p-1.5 rounded-2xl border backdrop-blur-3xl z-[110] ${config.dropdown}`}
                                >
                                    <p className="px-3 py-2 text-[7px] font-black uppercase opacity-30 tracking-[0.2em]">Switch Link</p>
                                    {Object.entries(themeConfigs).map(([key, cfg]) => (
                                        <button 
                                            key={key}
                                            onClick={() => { setTheme(key); setDropdownOpen(false); }}
                                            className={`flex items-center justify-between w-full p-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === key ? 'bg-white/5 opacity-100' : 'opacity-40 hover:opacity-100 hover:bg-white/5'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                                                {key}
                                            </div>
                                            {theme === key && <div className={`w-1 h-3 rounded-full ${cfg.dot}`} />}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Exit Matrix */}
                    <button 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border group
                            ${theme === 'Light' 
                                ? 'border-red-200 text-red-500 hover:bg-red-500 hover:text-white' 
                                : 'border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/20 hover:border-red-500/50'
                            }`}
                    >
                        {isLoggingOut ? (
                            <FaHourglassHalf className="animate-spin" />
                        ) : (
                            <FaSignOutAlt className="group-hover:translate-x-0.5 transition-transform" />
                        )}
                        <span className="hidden md:inline">Terminate</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
