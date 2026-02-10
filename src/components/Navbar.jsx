import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPalette, FaSignOutAlt, FaBolt, FaCheckCircle } from "react-icons/fa";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const themeConfigs = {
    DeepSpace: { primary: "#4f46e5", text: "#ffffff", sub: "#6366f1", border: "#1e1b4b", navBg: "#000000", btnBg: "#111111" },
    Light: { primary: "#4f46e5", text: "#020617", sub: "#64748b", border: "#cbd5e1", navBg: "#ffffff", btnBg: "#f1f5f9" },
    Sakura: { primary: "#f43f5e", text: "#fff1f2", sub: "#fb7185", border: "#4c0519", navBg: "#2d0611", btnBg: "#3d0a1a" },
    Cyberpunk: { primary: "#06b6d4", text: "#ecfeff", sub: "#22d3ee", border: "#083344", navBg: "#020c1b", btnBg: "#031e30" }
};

export default function Navbar({ userData }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const currentThemeKey = userData?.theme || "DeepSpace";
    const activeTheme = themeConfigs[currentThemeKey] || themeConfigs.DeepSpace;

    // Fixes the "Scholar" bug by checking every possible name field
    const displayName = userData?.name || userData?.displayName || auth.currentUser?.displayName || "Scholar";
    const photoURL = userData?.pfp || auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid}`;
    const logoLetters = "DHRUVA".split("");

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav
            className="sticky top-0 z-[1000] w-full border-b transition-all duration-500 shadow-2xl"
            style={{ backgroundColor: activeTheme.navBg, borderColor: activeTheme.border }}
        >
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">

                <div className="flex items-center gap-6">
                    {/* BRAND: Kinetic Pulse */}
                    <motion.div
                        whileHover="hover" whileTap="tap"
                        className="flex items-center gap-2 cursor-pointer relative group"
                        onClick={() => navigate("/")}
                    >
                        <div className="absolute -inset-2 rounded-xl blur-lg opacity-0 group-hover:opacity-30 transition-all" style={{ backgroundColor: activeTheme.primary }} />
                        <motion.div variants={{ hover: { scale: 1.1, rotate: [0, -10, 10, 0] } }} className="relative w-9 h-9 rounded-xl flex items-center justify-center shadow-lg overflow-hidden" style={{ backgroundColor: activeTheme.primary }}>
                            <FaBolt className="text-white text-base relative z-10" />
                            <motion.div variants={{ hover: { x: ["-100%", "200%"] } }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 bg-white/40 skew-x-12" />
                        </motion.div>
                        <div className="flex">
                            {logoLetters.map((l, i) => (
                                <motion.span
                                    key={i}
                                    variants={{ hover: { y: -3, color: activeTheme.primary } }}
                                    transition={{ delay: i * 0.02 }}
                                    className="font-black tracking-tighter uppercase text-xl"
                                    style={{ color: activeTheme.text }} /* FORCED */
                                >
                                    {l}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>

                    {/* AVATAR: Orbital Scanner */}
                    <motion.div
                        whileHover="hover"
                        className="flex items-center gap-4 cursor-pointer border-l pl-6"
                        style={{ borderColor: activeTheme.border }}
                        onClick={() => navigate("/profile")}
                    >
                        <div className="relative flex items-center justify-center">
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.4, 0.1] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute w-12 h-12 rounded-full border" style={{ borderColor: activeTheme.border }} />
                            <motion.div variants={{ hover: { rotate: 360, opacity: 1, scale: 1.3 } }} initial={{ opacity: 0 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="absolute w-12 h-12 rounded-full border-2 border-dashed" style={{ borderColor: activeTheme.primary }} />
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

                <div className="flex items-center gap-4" ref={dropdownRef}>
                    <div className="relative">
                        <motion.button
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="relative flex items-center gap-3 px-5 py-2.5 rounded-2xl border shadow-lg"
                            style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.btnBg, color: activeTheme.text }}
                        >
                            <FaPalette style={{ color: activeTheme.primary }} />
                            <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Interface</span>
                        </motion.button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute right-0 mt-4 w-64 p-2 rounded-[1.5rem] border shadow-2xl z-[2000]"
                                    style={{ backgroundColor: activeTheme.navBg, borderColor: activeTheme.border }}
                                >
                                    {Object.keys(themeConfigs).map((env) => (
                                        <motion.button
                                            key={env}
                                            whileHover={{ x: 10, backgroundColor: activeTheme.btnBg }}
                                            onClick={() => {
                                                updateDoc(doc(db, "users", auth.currentUser.uid), { theme: env });
                                                setDropdownOpen(false);
                                            }}
                                            className="flex items-center justify-between w-full p-4 rounded-xl transition-all"
                                            style={{ color: currentThemeKey === env ? activeTheme.primary : activeTheme.text }}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest">{env}</span>
                                            {currentThemeKey === env && <FaCheckCircle className="text-xs" />}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.button
                        whileHover={{ x: [0, -3, 3, -3, 3, 0], backgroundColor: "#ef4444", color: "#ffffff", scale: 1.1 }}
                        onClick={() => auth.signOut()}
                        className="p-3.5 rounded-2xl border transition-all"
                        style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.btnBg, color: activeTheme.text }}
                    >
                        <FaSignOutAlt className="text-xl" />
                    </motion.button>
                </div>
            </div>
        </nav>
    );
}
