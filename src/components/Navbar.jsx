import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPalette, FaChevronDown, FaSignOutAlt, FaHourglassHalf, FaBolt } from "react-icons/fa";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Standardizing themes to match Chat.js for consistency
const themeConfigs = {
    DeepSpace: { primaryHex: "#4f46e5", text: "text-white", border: "border-white/10", navBg: "bg-black/20" },
    Light: { primaryHex: "#4f46e5", text: "text-slate-900", border: "border-slate-200", navBg: "bg-white/40" },
    Sakura: { primaryHex: "#f43f5e", text: "text-rose-50", border: "border-rose-500/20", navBg: "bg-rose-950/10" },
    Cyberpunk: { primaryHex: "#06b6d4", text: "text-cyan-50", border: "border-cyan-500/20", navBg: "bg-cyan-950/10" }
};

export default function Navbar({ userData }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Mapping variables with safety checks
    const currentThemeKey = userData?.theme || "DeepSpace";
    const activeTheme = themeConfigs[currentThemeKey] || themeConfigs.DeepSpace;
    
    const photoURL = userData?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.uid || 'default'}`;
    const displayName = userData?.displayName || "Scholar";
    const environments = ["DeepSpace", "Light", "Sakura", "Cyberpunk"];

    const setTheme = async (newTheme) => {
        if (!auth.currentUser) return;
        try {
            await updateDoc(doc(db, "users", auth.currentUser.uid), { theme: newTheme });
        } catch (err) { 
            console.error("Theme Error", err); 
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try { 
            await auth.signOut(); 
            navigate("/login"); 
        } catch (err) { 
            setIsLoggingOut(false); 
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav className={`sticky top-0 z-[1000] w-full border-b ${activeTheme.border} ${activeTheme.navBg} backdrop-blur-xl transition-all duration-500`}>
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                
                {/* Brand & User Profile Section */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: activeTheme.primaryHex }}>
                            <FaBolt className="text-white text-sm" />
                        </div>
                        <span className={`font-black tracking-tighter uppercase text-lg ${activeTheme.text}`}>
                            Dhruva
                        </span>
                    </div>

                    <motion.div 
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-3 cursor-pointer group border-l border-white/10 pl-6"
                        onClick={() => navigate("/profile")}
                    >
                        <div className="relative">
                            <img 
                                src={photoURL} 
                                className="relative w-9 h-9 rounded-full object-cover border border-white/10 group-hover:border-indigo-500/50 transition-all" 
                                alt="Avatar" 
                            />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black bg-emerald-500" />
                        </div>
                        <div className="hidden sm:block">
                            <span className={`font-bold text-xs tracking-tight ${activeTheme.text}`}>{displayName}</span>
                            <p className={`text-[8px] font-black uppercase tracking-[0.2em] opacity-40 ${activeTheme.text}`}>Verified</p>
                        </div>
                    </motion.div>
                </div>

                {/* Theme & Logout Controls */}
                <div className="flex items-center gap-3" ref={dropdownRef}>
                    <div className="relative">
                        <button 
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${activeTheme.border} bg-white/5 hover:bg-white/10 transition-all`}
                        >
                            <FaPalette className="text-xs" style={{ color: activeTheme.primaryHex }} />
                            <span className={`hidden lg:inline text-[10px] font-bold uppercase tracking-widest ${activeTheme.text}`}>Style</span>
                            <FaChevronDown className={`text-[8px] transition-transform ${activeTheme.text} ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className={`absolute right-0 mt-3 w-48 p-2 rounded-2xl border ${activeTheme.border} bg-black/90 backdrop-blur-2xl shadow-2xl`}
                                >
                                    {environments.map((env) => (
                                        <button 
                                            key={env}
                                            onClick={() => { setTheme(env); setDropdownOpen(false); }}
                                            className={`flex items-center justify-between w-full p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${currentThemeKey === env ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                        >
                                            {env}
                                            {currentThemeKey === env && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeTheme.primaryHex }} />}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    >
                        {isLoggingOut ? <FaHourglassHalf className="animate-spin text-xs" /> : <FaSignOutAlt className="text-xs" />}
                        <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Exit</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
