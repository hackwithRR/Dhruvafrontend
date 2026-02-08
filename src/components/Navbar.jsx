import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPalette, FaChevronDown, FaSignOutAlt, FaHourglassHalf } from "react-icons/fa";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Navbar({ userData }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Mapping variables from userData to fix 'not defined' errors
    const theme = userData?.theme || "DeepSpace";
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
        <nav className="sticky top-0 z-[500] w-full border-b border-white/10 bg-black/10 backdrop-blur-xl transition-all duration-500">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                
                {/* User Profile Section */}
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
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black bg-emerald-500" />
                    </div>
                    <div className="hidden sm:block">
                        <span className="font-bold text-sm tracking-tight text-white/90">{displayName}</span>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Verified Session</p>
                    </div>
                </motion.div>

                {/* Theme & Logout Controls */}
                <div className="flex items-center gap-3" ref={dropdownRef}>
                    <div className="relative">
                        <button 
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all ${dropdownOpen ? 'ring-2 ring-indigo-500/40' : ''}`}
                        >
                            <FaPalette className="text-indigo-400 text-xs" />
                            <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-widest text-white">Theme</span>
                            <FaChevronDown className={`text-[8px] transition-transform text-white ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-48 p-2 rounded-2xl border border-white/10 bg-black/80 backdrop-blur-2xl shadow-2xl"
                                >
                                    {environments.map((env) => (
                                        <button 
                                            key={env}
                                            onClick={() => { setTheme(env); setDropdownOpen(false); }}
                                            className={`flex items-center justify-between w-full p-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${theme === env ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                        >
                                            {env}
                                            {theme === env && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
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
