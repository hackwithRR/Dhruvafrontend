import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaChevronDown, FaPalette } from "react-icons/fa";
import { toast } from "react-toastify";

export default function Navbar({ currentUser, theme, setTheme, logout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const isProfilePage = location.pathname === "/profile";
    const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Student";
    const photoURL = currentUser?.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff`;

    // SYNCED THEME CONFIGS
    const themeConfigs = {
        dark: { nav: "bg-[#050505]/80 border-white/5 text-white backdrop-blur-md", dropdown: "bg-[#111] border-white/10 text-white", btnProfile: "bg-indigo-600/20 text-indigo-400 border-indigo-500/30", btnLogout: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
        light: { nav: "bg-white/70 border-slate-200 text-slate-900 backdrop-blur-lg", dropdown: "bg-white border-slate-200 text-slate-800", btnProfile: "bg-blue-500/10 text-blue-600 border-blue-500/20", btnLogout: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
        cosmic: { nav: "bg-purple-950/40 border-purple-500/20 text-white backdrop-blur-md", dropdown: "bg-[#0f0c29] border-purple-500/30 text-white", btnProfile: "bg-purple-500/20 text-purple-300", btnLogout: "bg-pink-500/20 text-pink-300" },
        emerald: { nav: "bg-[#020d08]/80 border-emerald-500/20 text-emerald-50 backdrop-blur-md", dropdown: "bg-[#010805] border-emerald-500/30 text-emerald-100", btnProfile: "bg-emerald-500/20 text-emerald-400", btnLogout: "bg-teal-500/20 text-teal-400" },
        sunset: { nav: "bg-[#1a0a05]/80 border-orange-500/20 text-orange-50 backdrop-blur-md", dropdown: "bg-[#120703] border-orange-500/30 text-orange-100", btnProfile: "bg-orange-500/20 text-orange-400", btnLogout: "bg-red-500/20 text-red-400" },
        cyber: { nav: "bg-black/80 border-[#00ff9f]/30 text-[#00ff9f] backdrop-blur-md", dropdown: "bg-black border-[#00ff9f]/50 text-[#00ff9f]", btnProfile: "bg-[#00ff9f]/10 text-[#00ff9f]", btnLogout: "bg-white/10 text-white" },
        ocean: { nav: "bg-[#000428]/80 border-blue-400/20 text-blue-50 backdrop-blur-md", dropdown: "bg-[#000428] border-blue-400/30 text-blue-100", btnProfile: "bg-blue-500/20 text-blue-300", btnLogout: "bg-cyan-500/20 text-cyan-300" },
        royal: { nav: "bg-[#0f172a]/80 border-yellow-500/20 text-slate-100 backdrop-blur-md", dropdown: "bg-[#0a101f] border-yellow-500/30 text-amber-100", btnProfile: "bg-amber-500/20 text-amber-400", btnLogout: "bg-slate-700/50 text-slate-300" },
        electric: { nav: "bg-[#000]/80 border-white/10 text-white backdrop-blur-xl", dropdown: "bg-black border-white/20 text-white", btnProfile: "bg-orange-500/20 text-orange-400", btnLogout: "bg-red-500/20 text-red-400" }
    };

    const config = themeConfigs[theme] || themeConfigs.dark;

    const handleLogout = async () => {
        try {
            toast.success("Logging out...");
            setIsLoggingOut(true);
            await logout();
            navigate("/");
        } catch (e) { toast.error("Logout error"); setIsLoggingOut(false); }
    };

    return (
        <nav className={`sticky top-0 z-[100] flex items-center justify-between px-4 md:px-8 py-3 border-b transition-all duration-500 ${config.nav}`}>
            <div className="flex items-center gap-4 cursor-pointer active:scale-95 transition-transform" onClick={() => !isLoggingOut && navigate("/profile")}>
                <img src={photoURL} className={`w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-white/20 object-cover ${isLoggingOut ? "grayscale" : ""}`} alt="User" />
                <div className="flex flex-col">
                    <span className="font-bold text-sm md:text-base tracking-tight">{displayName}</span>
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
                        {isLoggingOut ? "Ending Session" : isProfilePage ? "Account Settings" : "Dhruva AI"}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {!isLoggingOut && (
                    <>
                        {!isProfilePage && (
                            <button onClick={() => navigate("/profile")} className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all ${config.btnProfile}`}>
                                <FaUser /> PROFILE
                            </button>
                        )}

                        <div className="relative">
                            <button onClick={() => setDropdownOpen(!dropdownOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all active:scale-90 text-xs font-bold uppercase tracking-tighter ${config.dropdown}`}>
                                <FaPalette className="opacity-70" />
                                <span className="hidden sm:inline">{theme}</span>
                                <FaChevronDown className={`transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`} size={10} />
                            </button>

                            {dropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-[-1]" onClick={() => setDropdownOpen(false)} />
                                    <div className={`absolute right-0 mt-3 w-44 rounded-2xl shadow-2xl border p-1 z-50 ${config.dropdown}`}>
                                        {Object.keys(themeConfigs).map(t => (
                                            <button key={t} className={`flex items-center justify-between w-full text-left px-4 py-2.5 text-[10px] font-black hover:bg-white/10 rounded-xl capitalize tracking-widest ${theme === t ? 'bg-white/10' : 'opacity-60'}`} 
                                                onClick={() => { setTheme(t); setDropdownOpen(false); }}>
                                                {t}
                                                {theme === t && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <button onClick={handleLogout} className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-xl text-xs font-black border transition-all active:scale-90 ${config.btnLogout}`}>
                            <FaSignOutAlt /> <span className="hidden xs:inline">LOGOUT</span>
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
