import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaChevronDown, FaHourglassHalf, FaMedal } from "react-icons/fa";
import { MdColorLens } from "react-icons/md";
import { toast } from "react-toastify";

export default function Navbar({ currentUser, theme, setTheme, logout, userData }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const isProfilePage = location.pathname === "/profile";
    const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Student";
    const photoURL = currentUser?.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff`;

    // --- SYNCED WITH MASTER THEMES ---
    const themeConfigs = {
        DeepSpace: { nav: "bg-[#050505]/80 border-white/10 text-white backdrop-blur-md", dropdown: "bg-[#0A0A0A] text-white border-white/10", btn: "hover:bg-indigo-600/20" },
        Light: { nav: "bg-white/90 border-gray-200 text-gray-900 backdrop-blur-md shadow-sm", dropdown: "bg-white text-gray-900 border-gray-200 shadow-xl", btn: "hover:bg-gray-100 border-gray-200 text-gray-700" },
        Sakura: { nav: "bg-[#1a0f12]/80 border-rose-500/20 text-rose-100 backdrop-blur-md", dropdown: "bg-[#221418] text-rose-100 border-rose-500/20", btn: "hover:bg-rose-500/20" },
        Forest: { nav: "bg-[#0a120a]/80 border-emerald-500/20 text-emerald-100 backdrop-blur-md", dropdown: "bg-[#0e1a0e] text-emerald-100 border-emerald-500/20", btn: "hover:bg-emerald-500/20" },
        Cyberpunk: { nav: "bg-[#0a0512]/80 border-cyan-500/30 text-cyan-100 backdrop-blur-md", dropdown: "bg-[#120a1a] text-cyan-100 border-cyan-500/30", btn: "hover:bg-cyan-500/20" }
    };

    const config = themeConfigs[theme] || themeConfigs.DeepSpace;
    const isLightTheme = theme === "Light";

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
            
            {/* LEFT: USER PROFILE & DISPLAY NAME */}
            <div
                className="flex items-center gap-3 cursor-pointer active:scale-95 transition-transform group"
                onClick={() => !isLoggingOut && navigate("/profile")}
            >
                <div className="relative">
                    <img 
                        src={photoURL} 
                        className={`w-10 h-10 md:w-11 md:h-11 rounded-full border-2 object-cover shadow-lg transition-all 
                            ${isLoggingOut ? "grayscale" : "group-hover:border-indigo-500"} 
                            ${isLightTheme ? 'border-gray-200 shadow-gray-200' : 'border-white/20 shadow-black/40'}`} 
                        alt="User" 
                    />
                    {!isLoggingOut && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />}
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className={`font-black text-sm md:text-base tracking-tight leading-tight transition-colors ${isLightTheme ? 'text-gray-900' : 'text-white'}`}>
                            {displayName}
                        </span>
                        {/* XP Badge next to name */}
                        {userData?.xp > 0 && (
                            <div className="flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                                <FaMedal className="text-yellow-500 text-[8px]" />
                                <span className="text-[8px] font-black text-yellow-500">{userData.xp}</span>
                            </div>
                        )}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${isLightTheme ? 'text-indigo-600' : 'text-indigo-400 opacity-70'}`}>
                        {isLoggingOut ? "Ending Session..." : isProfilePage ? "Account Settings" : "Dhruva Intelligence"}
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
                            <button onClick={() => navigate("/profile")} className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all ${config.btn} ${isLightTheme ? 'border-gray-200' : 'border-white/10'}`}>
                                <FaUser /> PROFILE
                            </button>
                        )}

                        {/* THEME DROPDOWN */}
                        {!isProfilePage && (
                            <div className="relative">
                                <button 
                                    onClick={() => setDropdownOpen(!dropdownOpen)} 
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all active:scale-90 text-xs font-bold ${config.dropdown} ${isLightTheme ? 'border-gray-200' : 'border-white/10'}`}
                                >
                                    <MdColorLens className="text-base" />
                                    <span className="hidden lg:inline uppercase tracking-tighter">{theme}</span>
                                    <FaChevronDown className={`text-[10px] transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`} />
                                </button>

                                {dropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[-1]" onClick={() => setDropdownOpen(false)} />
                                        <div className={`absolute right-0 mt-2 w-44 rounded-2xl shadow-2xl border p-2 z-[110] grid grid-cols-1 gap-1 ${config.dropdown} ${isLightTheme ? 'border-gray-200' : 'border-white/10'}`}>
                                            <p className={`text-[8px] font-black uppercase px-3 py-1 ${isLightTheme ? 'text-gray-400' : 'opacity-40'}`}>Select Environment</p>
                                            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                                                {Object.keys(themeConfigs).map(t => (
                                                    <button 
                                                        key={t} 
                                                        className={`flex items-center justify-between w-full text-left px-3 py-2.5 text-[10px] font-bold rounded-lg transition-all ${theme === t ? (isLightTheme ? 'bg-indigo-50 text-indigo-600' : 'bg-white/10') : (isLightTheme ? 'hover:bg-gray-50' : 'hover:bg-white/5')}`} 
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

                        {/* EXIT BUTTON */}
                        <button 
                            onClick={handleLogout} 
                            className={`flex items-center justify-center w-10 h-10 md:w-auto md:px-5 md:py-2.5 rounded-xl text-xs font-black border transition-all active:scale-90 ${isLightTheme ? 'border-rose-200 text-rose-500 hover:bg-rose-500 hover:text-white' : 'border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
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
