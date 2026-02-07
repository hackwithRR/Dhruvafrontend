import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaChevronDown, FaHourglassHalf } from "react-icons/fa";
import { MdDarkMode, MdLightMode, MdGradient } from "react-icons/md";
import { toast } from "react-toastify";

export default function Navbar({ currentUser, theme, setTheme, logout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const isProfilePage = location.pathname === "/profile";
    const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Student";
    const photoURL = currentUser?.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff`;

    const themeConfigs = {
        dark: { nav: "bg-[#0F172A]/80 border-white/5 text-white backdrop-blur-md", dropdown: "bg-[#1E293B] text-white", btnProfile: "bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600", btnLogout: "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500" },
        light: { nav: "bg-white/60 border-white/40 text-slate-900 backdrop-blur-lg", dropdown: "bg-white text-slate-800", btnProfile: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500", btnLogout: "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500" },
        electric: { nav: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white", dropdown: "bg-[#833AB4] text-white", btnProfile: "bg-white/20 border-white/40", btnLogout: "bg-black/20 border-white/20" }
    };

    const config = themeConfigs[theme || "dark"];

    const handleLogout = async () => {
        try {
            toast.success("Logged out! Redirecting...");
            setIsLoggingOut(true);
            await logout();
            setTimeout(() => navigate("/"), 2000);
        } catch (e) { toast.error("Logout error"); }
    };

    return (
        <nav className={`sticky top-0 z-[100] flex items-center justify-between px-4 md:px-8 py-4 border-b transition-all duration-500 ${config.nav}`}>
            {/* LEFT SECTION */}
            <div
                className="flex items-center gap-4 cursor-pointer active:scale-95 transition-transform"
                onClick={() => !isLoggingOut && navigate("/profile")}
            >
                <img src={photoURL} className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/30 object-cover ${isLoggingOut ? "grayscale" : ""}`} alt="User" />
                <div className="flex flex-col">
                    {/* Increased font size to text-sm/text-base */}
                    <span className="font-bold text-sm md:text-base tracking-tight">{displayName}</span>
                    {/* Increased subtext size */}
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                        {isLoggingOut ? "Session Ended" : isProfilePage ? "Account Settings" : "Dhruva Plus"}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-5">
                {isLoggingOut ? (
                    <div className="flex items-center gap-2 text-sm font-bold animate-pulse text-white"><FaHourglassHalf className="animate-spin" /> Redirecting...</div>
                ) : (
                    <div className="flex items-center gap-3">
                        {/* PROFILE BUTTON: Hidden on Profile Page and Mobile */}
                        {!isProfilePage && (
                            <button onClick={() => navigate("/profile")} className={`hidden sm:flex items-center gap-2 px-5 py-2 rounded-full text-xs md:text-sm font-black border transition-all ${config.btnProfile}`}>
                                <FaUser /> PROFILE
                            </button>
                        )}

                        {/* LOGOUT BUTTON */}
                        <button onClick={handleLogout} className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-black border transition-all active:scale-90 ${config.btnLogout}`}>
                            <FaSignOutAlt /> <span className="hidden xs:inline uppercase tracking-widest">Logout</span>
                        </button>
                    </div>
                )}

                {/* THEME SELECTOR: Hidden on Profile Page */}
                {!isProfilePage && (
                    <div className="relative">
                        <button onClick={() => setDropdownOpen(!dropdownOpen)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all active:scale-90 ${config.dropdown}`}>
                            {theme === "light" ? <MdLightMode className="text-lg" /> : theme === "electric" ? <MdGradient className="text-lg" /> : <MdDarkMode className="text-lg" />}
                            <FaChevronDown className={`transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {dropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[-1]" onClick={() => setDropdownOpen(false)} />
                                <div className={`absolute right-0 mt-3 w-40 md:w-48 rounded-2xl shadow-2xl border p-1.5 z-50 animate-in fade-in slide-in-from-top-2 ${config.dropdown}`}>
                                    {["light", "dark", "electric"].map(t => (
                                        <button key={t} className="block w-full text-left px-5 py-3 text-xs md:text-sm font-black hover:bg-white/10 rounded-xl capitalize tracking-widest" onClick={() => { setTheme(t); setDropdownOpen(false); }}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}