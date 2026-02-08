import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaChevronDown, FaHourglassHalf, FaPalette } from "react-icons/fa";
import { MdDarkMode, MdLightMode, MdGradient, MdColorLens } from "react-icons/md";
import { toast } from "react-toastify";

export default function Navbar({ currentUser, theme, setTheme, logout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const isProfilePage = location.pathname === "/profile";
    const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Student";
    const photoURL = currentUser?.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff`;

    // --- SYNCED WITH CHAT.JSX THEMES ---
    const themeConfigs = {
        DeepSpace: { nav: "bg-[#050505]/80 border-white/10 text-white backdrop-blur-md", dropdown: "bg-[#0A0A0A] text-white border-white/10", btn: "hover:bg-indigo-600/20" },
        Sakura: { nav: "bg-[#1a0f12]/80 border-rose-500/20 text-rose-100 backdrop-blur-md", dropdown: "bg-[#221418] text-rose-100 border-rose-500/20", btn: "hover:bg-rose-500/20" },
        Forest: { nav: "bg-[#0a120a]/80 border-emerald-500/20 text-emerald-100 backdrop-blur-md", dropdown: "bg-[#0e1a0e] text-emerald-100 border-emerald-500/20", btn: "hover:bg-emerald-500/20" },
        Cyberpunk: { nav: "bg-[#0a0512]/80 border-cyan-500/30 text-cyan-100 backdrop-blur-md", dropdown: "bg-[#120a1a] text-cyan-100 border-cyan-500/30", btn: "hover:bg-cyan-500/20" },
        Midnight: { nav: "bg-black/80 border-blue-500/20 text-blue-100 backdrop-blur-md", dropdown: "bg-[#050510] text-blue-100 border-blue-500/20", btn: "hover:bg-blue-500/20" },
        Sunset: { nav: "bg-[#120a05]/80 border-orange-500/20 text-orange-100 backdrop-blur-md", dropdown: "bg-[#1a0f0a] text-orange-100 border-orange-500/20", btn: "hover:bg-orange-500/20" },
        Lavender: { nav: "bg-[#0f0a12]/80 border-purple-500/20 text-purple-100 backdrop-blur-md", dropdown: "bg-[#160e1c] text-purple-100 border-purple-500/20", btn: "hover:bg-purple-500/20" },
        Ghost: { nav: "bg-[#0a0a0a]/80 border-white/5 text-gray-100 backdrop-blur-md", dropdown: "bg-[#111111] text-gray-100 border-white/10", btn: "hover:bg-white/5" }
    };

    const config = themeConfigs[theme] || themeConfigs.DeepSpace;

    const handleLogout = async () => {
        try {
            toast.success("Logging out...");
            setIsLoggingOut(true);
            await logout();
            setTimeout(() => navigate("/"), 1500);
        } catch (e) { 
            toast.error("Logout error"); 
            setIsLoggingOut(false);
        }
    };

    return (
        <nav className={`sticky top-0 z-[100] flex items-center justify-between px-4 md:px-8 py-3 border-b transition-all duration-500 ${config.nav}`}>
            
            {/* LEFT: USER PROFILE */}
            <div
                className="flex items-center gap-3 cursor-pointer active:scale-95 transition-transform group"
                onClick={() => !isLoggingOut && navigate("/profile")}
            >
                <div className="relative">
                    <img src={photoURL} className={`w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-white/20 object-cover shadow-lg transition-all ${isLoggingOut ? "grayscale" : "group-hover:border-indigo-500"}`} alt="User" />
                    {!isLoggingOut && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />}
                </div>
                <div className="hidden sm:flex flex-col">
                    <span className="font-bold text-sm tracking-tight leading-tight">{displayName}</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] opacity-50">
                        {isLoggingOut ? "Ending..." : isProfilePage ? "Account" : "Dhruva Pro"}
                    </span>
                </div>
            </div>

            {/* RIGHT: TOOLS & ACTIONS */}
            <div className="flex items-center gap-2 md:gap-4">
                {isLoggingOut ? (
                    <div className="flex items-center gap-2 text-xs font-bold animate-pulse"><FaHourglassHalf className="animate-spin" /> Syncing...</div>
                ) : (
                    <>
                        {/* PROFILE LINK (DESKTOP) */}
                        {!isProfilePage && (
                            <button onClick={() => navigate("/profile")} className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border border-white/10 transition-all ${config.btn}`}>
                                <FaUser /> PROFILE
                            </button>
                        )}

                        {/* THEME DROPDOWN */}
                        {!isProfilePage && (
                            <div className="relative">
                                <button 
                                    onClick={() => setDropdownOpen(!dropdownOpen)} 
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 transition-all active:scale-90 text-xs font-bold ${config.dropdown}`}
                                >
                                    <MdColorLens className="text-base" />
                                    <span className="hidden lg:inline uppercase tracking-tighter">{theme}</span>
                                    <FaChevronDown className={`text-[10px] transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`} />
                                </button>

                                {dropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[-1]" onClick={() => setDropdownOpen(false)} />
                                        <div className={`absolute right-0 mt-2 w-44 rounded-2xl shadow-2xl border p-2 z-[110] grid grid-cols-1 gap-1 ${config.dropdown}`}>
                                            <p className="text-[8px] font-black uppercase opacity-40 px-3 py-1">Select Theme</p>
                                            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                                                {Object.keys(themeConfigs).map(t => (
                                                    <button 
                                                        key={t} 
                                                        className={`flex items-center justify-between w-full text-left px-3 py-2.5 text-[10px] font-bold rounded-lg transition-all ${theme === t ? 'bg-white/10' : 'hover:bg-white/5'}`} 
                                                        onClick={() => { setTheme(t); setDropdownOpen(false); }}
                                                    >
                                                        <span className="capitalize">{t}</span>
                                                        {theme === t && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* LOGOUT */}
                        <button 
                            onClick={handleLogout} 
                            className="flex items-center justify-center w-10 h-10 md:w-auto md:px-5 md:py-2.5 rounded-xl text-xs font-black border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                        >
                            <FaSignOutAlt />
                            <span className="hidden md:inline ml-2 uppercase tracking-widest">Exit</span>
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
