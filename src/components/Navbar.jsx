import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaSignOutAlt, FaChevronDown, FaHourglassHalf, FaPalette, FaRocket, FaShieldAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext"; // Import unified context

export default function Navbar({ userData }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logout, theme, setTheme } = useAuth(); // Consume global theme
    
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef(null);

    // Derived State
    const displayName = userData?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || "Scholar";
    const photoURL = currentUser?.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff&bold=true`;

    // Environment Options (Logic handled by AuthContext via setTheme)
    const environments = ["DeepSpace", "Light", "Sakura", "Cyberpunk"];

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            toast.success("Neural Link Disconnected");
            navigate("/login");
        } catch (e) {
            toast.error("Termination Failed");
            setIsLoggingOut(false);
        }
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <nav className="sticky top-0 z-[500] w-full border-b border-white/5 bg-black/40 backdrop-blur-xl transition-all duration-500">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                
                {/* LEFT: USER HUD (Interactive Profile) */}
                <motion.div 
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-4 cursor-pointer group"
                    onClick={() => navigate("/profile")}
                >
                    <div className="relative">
                        <div className="absolute -inset-1 rounded-full bg-indigo-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img 
                            src={photoURL} 
                            className="relative w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-indigo-500/50 transition-all"
                            alt="Avatar" 
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>

                    <div className="hidden sm:block">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm tracking-tight text-white/90">{displayName}</span>
                            {userData?.xp > 0 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                    <FaRocket size={8}/> 
                                    <span>{userData.xp} XP</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 opacity-50">
                            <FaShieldAlt size={8} className="text-indigo-400" />
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Verified Session</p>
                        </div>
                    </div>
                </motion.div>

                {/* RIGHT: HUD CONTROLS */}
                <div className="flex items-center gap-3" ref={dropdownRef}>
                    
                    {/* Environment Selector */}
                    <div className="relative">
                        <button 
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all ${dropdownOpen ? 'ring-2 ring-indigo-500/40' : ''}`}
                        >
                            <FaPalette className="text-indigo-400 text-xs" />
                            <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-widest text-white/70">Theme</span>
                            <FaChevronDown className={`text-[8px] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-48 p-2 rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-2xl backdrop-blur-2xl"
                                >
                                    {environments.map((env) => (
                                        <button 
                                            key={env}
                                            onClick={() => {
                                                setTheme(env);
                                                setDropdownOpen(false);
                                            }}
                                            className={`flex items-center justify-between w-full p-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${theme === env ? 'bg-indigo-500/10 text-indigo-400' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                        >
                                            {env}
                                            {theme === env && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Logout Button */}
                    <button 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 disabled:opacity-50"
                    >
                        {isLoggingOut ? (
                            <FaHourglassHalf className="animate-spin text-xs" />
                        ) : (
                            <FaSignOutAlt className="text-xs" />
                        )}
                        <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Exit</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
