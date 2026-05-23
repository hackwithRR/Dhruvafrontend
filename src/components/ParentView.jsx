import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaUserTie,
    FaKey,
    FaEye,
    FaTimes,
    FaGraduationCap,
    FaTrophy,
    FaFire,
    FaChartLine,
    FaBook,
    FaCheckCircle,
    FaLock
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

export default function ParentView({ isOpen, onClose, theme }) {
    const [code, setCode] = useState("");
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { verifyParentCode } = useAuth();

    // Theme configurations
    const themeConfigs = {
        DeepSpace: {
            primary: "#38bdf8",
            accent: "#818cf8",
            bg: "bg-slate-900",
            border: "border-slate-700",
            text: "text-white",
            subText: "text-slate-400"
        },
        Sakura: {
            primary: "#ec4899",
            accent: "#f472b6",
            bg: "bg-pink-50",
            border: "border-pink-200",
            text: "text-pink-950",
            subText: "text-pink-600"
        },
        Cyberpunk: {
            primary: "#a855f7",
            accent: "#06b6d4",
            bg: "bg-purple-950",
            border: "border-purple-800",
            text: "text-white",
            subText: "text-purple-300"
        },
        RoyalParchment: {
            primary: "#b45309",
            accent: "#d97706",
            bg: "bg-amber-50",
            border: "border-amber-200",
            text: "text-amber-950",
            subText: "text-amber-700"
        },
        Light: {
            primary: "#4f46e5",
            accent: "#7c3aed",
            bg: "bg-slate-50",
            border: "border-slate-200",
            text: "text-slate-900",
            subText: "text-slate-600"
        },
        MidnightAurora: {
            primary: "#10b981",
            accent: "#34d399",
            bg: "bg-emerald-950",
            border: "border-emerald-800",
            text: "text-white",
            subText: "text-emerald-300"
        },
        SunsetDrift: {
            primary: "#f97316",
            accent: "#fb923c",
            bg: "bg-orange-950",
            border: "border-orange-800",
            text: "text-white",
            subText: "text-orange-300"
        },
        Phantom: {
            primary: "#ffffff",
            accent: "#a3a3a3",
            bg: "bg-neutral-900",
            border: "border-neutral-700",
            text: "text-white",
            subText: "text-neutral-400"
        },
        Solaris: {
            primary: "#facc15",
            accent: "#fde047",
            bg: "bg-yellow-950",
            border: "border-yellow-800",
            text: "text-white",
            subText: "text-yellow-300"
        },
        Aero: {
            primary: "#94a3b8",
            accent: "#cbd5e1",
            bg: "bg-slate-900",
            border: "border-slate-700",
            text: "text-white",
            subText: "text-slate-400"
        },
        Toxic: {
            primary: "#a3e635",
            accent: "#84cc16",
            bg: "bg-lime-950",
            border: "border-lime-800",
            text: "text-white",
            subText: "text-lime-300"
        },
        Synthwave: {
            primary: "#22d3ee",
            accent: "#e879f9",
            bg: "bg-fuchsia-950",
            border: "border-fuchsia-800",
            text: "text-white",
            subText: "text-fuchsia-300"
        },
        Coffee: {
            primary: "#d6c5bb",
            accent: "#a8a29e",
            bg: "bg-stone-900",
            border: "border-stone-700",
            text: "text-white",
            subText: "text-stone-400"
        },
        RetroTerminal: {
            primary: "#22c55e",
            accent: "#4ade80",
            bg: "bg-green-950",
            border: "border-green-800",
            text: "text-white",
            subText: "text-green-300"
        },
        Amethyst: {
            primary: "#c084fc",
            accent: "#a855f7",
            bg: "bg-purple-950",
            border: "border-purple-800",
            text: "text-white",
            subText: "text-purple-300"
        },
        Blueprint: {
            primary: "#ffffff",
            accent: "#93c5fd",
            bg: "bg-blue-900",
            border: "border-blue-700",
            text: "text-white",
            subText: "text-blue-200"
        },
        Clay: {
            primary: "#57534e",
            accent: "#78716c",
            bg: "bg-stone-200",
            border: "border-stone-300",
            text: "text-stone-900",
            subText: "text-stone-600"
        },
        Radioactive: {
            primary: "#000000",
            accent: "#3f6212",
            bg: "bg-lime-300",
            border: "border-black",
            text: "text-black",
            subText: "text-lime-900"
        },
        CrimsonOLED: {
            primary: "#dc2626",
            accent: "#ef4444",
            bg: "bg-red-950",
            border: "border-red-800",
            text: "text-white",
            subText: "text-red-300"
        },
        Industrial: {
            primary: "#f97316",
            accent: "#fb923c",
            bg: "bg-neutral-900",
            border: "border-neutral-700",
            text: "text-white",
            subText: "text-neutral-400"
        },
        MidnightSun: {
            primary: "#fbbf24",
            accent: "#f59e0b",
            bg: "bg-purple-950",
            border: "border-purple-800",
            text: "text-white",
            subText: "text-amber-300"
        }
    };

    const colors = themeConfigs[theme] || themeConfigs.DeepSpace;

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        setError("");

        const result = await verifyParentCode(code.toUpperCase());

        if (result.success) {
            setStudentData(result.studentData);
        } else {
            setError(result.error || "Invalid access code");
        }

        setLoading(false);
    };

    const calculateOverallProgress = () => {
        if (!studentData?.progress) return 0;

        let totalChapters = 0;
        let completedChapters = 0;

        Object.values(studentData.progress).forEach(subject => {
            totalChapters += subject.totalChapters || 0;
            completedChapters += subject.completedChapters?.length || 0;
        });

        return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-2xl ${colors.bg} border ${colors.border} rounded-[3rem] p-8 md:p-12 relative overflow-hidden`}
                        style={{ boxShadow: `0 0 60px ${colors.primary}30` }}
                    >
                        {/* Background Effects */}
                        <div
                            className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20"
                            style={{ backgroundColor: colors.primary }}
                        />
                        <div
                            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20"
                            style={{ backgroundColor: colors.accent }}
                        />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-3 rounded-full hover:bg-white/10 transition-all z-10"
                        >
                            <FaTimes className={colors.text} size={20} />
                        </button>

                        {!studentData ? (
                            /* Access Code Entry */
                            <div className="relative text-center">
                                <div
                                    className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                                    style={{
                                        backgroundColor: `${colors.primary}20`,
                                        border: `2px solid ${colors.primary}40`
                                    }}
                                >
                                    <FaUserTie style={{ color: colors.primary }} size={40} />
                                </div>

                                <h2 className={`text-3xl font-black uppercase tracking-tighter mb-2 ${colors.text}`}>
                                    Parent Access
                                </h2>
                                <p className={`text-sm ${colors.subText} mb-8 font-medium`}>
                                    Enter your child's access code to view their progress
                                </p>

                                <form onSubmit={handleVerify} className="space-y-4 max-w-sm mx-auto">
                                    <div className="relative">
                                        <FaKey
                                            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
                                            style={{ color: colors.primary }}
                                        />
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                                            placeholder="ENTER CODE"
                                            maxLength={6}
                                            className={`w-full py-4 pl-12 pr-4 rounded-2xl border ${colors.border} ${colors.bg} ${colors.text} font-black uppercase tracking-[0.3em] text-center focus:outline-none focus:ring-2 transition-all`}
                                            style={{
                                                backgroundColor: `${colors.primary}10`,
                                                borderColor: `${colors.primary}40`,
                                                boxShadow: `0 0 20px ${colors.primary}20`
                                            }}
                                        />
                                    </div>

                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-500 text-xs font-bold uppercase tracking-widest"
                                        >
                                            {error}
                                        </motion.p>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={loading || code.length !== 6}
                                        type="submit"
                                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-sm transition-all flex items-center justify-center gap-3 ${colors.text}`}
                                        style={{
                                            backgroundColor: colors.primary,
                                            opacity: loading || code.length !== 6 ? 0.5 : 1
                                        }}
                                    >
                                        {loading ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                            />
                                        ) : (
                                            <>
                                                <FaEye size={14} />
                                                View Progress
                                            </>
                                        )}
                                    </motion.button>
                                </form>

                                <div className="mt-8 flex items-center justify-center gap-2 opacity-40">
                                    <FaLock size={10} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                        Secure Access Only
                                    </span>
                                </div>
                            </div>
                        ) : (
                            /* Student Progress View */
                            <div className="relative">
                                <div className="flex items-center gap-4 mb-8">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                        style={{
                                            backgroundColor: `${colors.primary}20`,
                                            border: `2px solid ${colors.primary}40`
                                        }}
                                    >
                                        <FaGraduationCap style={{ color: colors.primary }} size={32} />
                                    </div>
                                    <div>
                                        <h2 className={`text-2xl font-black uppercase tracking-tight ${colors.text}`}>
                                            {studentData.name}
                                        </h2>
                                        <p className={`text-sm ${colors.subText} font-medium`}>
                                            Class {studentData.classLevel} • {studentData.board}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    {[
                                        { icon: FaTrophy, label: "Total XP", value: studentData.xp, color: colors.primary },
                                        { icon: FaFire, label: "Streak", value: `${studentData.streak} days`, color: colors.accent },
                                        { icon: FaBook, label: "Subjects", value: Object.keys(studentData.progress || {}).length, color: colors.primary },
                                        { icon: FaChartLine, label: "Progress", value: `${calculateOverallProgress()}%`, color: colors.accent }
                                    ].map((stat, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={`p-4 rounded-2xl border ${colors.border} text-center`}
                                            style={{ backgroundColor: `${colors.primary}10` }}
                                        >
                                            <stat.icon style={{ color: stat.color }} className="mx-auto mb-2" size={20} />
                                            <p className={`text-2xl font-black ${colors.text}`}>{stat.value}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${colors.subText}`}>{stat.label}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Subject Progress */}
                                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                    <h3 className={`text-sm font-black uppercase tracking-[0.3em] mb-4 ${colors.subText}`}>
                                        Subject Breakdown
                                    </h3>

                                    {Object.entries(studentData.progress || {}).map(([subject, data], idx) => {
                                        const completed = data.completedChapters?.length || 0;
                                        const total = data.totalChapters || 1;
                                        const pct = Math.round((completed / total) * 100);

                                        return (
                                            <motion.div
                                                key={subject}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border ${colors.border}`}
                                                style={{ backgroundColor: `${colors.primary}05` }}
                                            >
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: `${colors.primary}20` }}
                                                >
                                                    <FaCheckCircle style={{ color: colors.primary }} size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <h4 className={`font-bold uppercase text-sm truncate ${colors.text}`}>
                                                            {subject}
                                                        </h4>
                                                        <span className={`text-xs font-black ${colors.subText}`}>
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            className="h-full rounded-full"
                                                            style={{ backgroundColor: colors.primary }}
                                                        />
                                                    </div>
                                                    <p className={`text-[10px] ${colors.subText} mt-1`}>
                                                        {completed} of {total} chapters completed
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {Object.keys(studentData.progress || {}).length === 0 && (
                                        <p className={`text-center py-8 ${colors.subText} text-sm font-medium italic`}>
                                            No progress data available yet
                                        </p>
                                    )}
                                </div>

                                {/* Back Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setStudentData(null)}
                                    className={`mt-6 w-full py-3 rounded-2xl border ${colors.border} font-bold uppercase tracking-widest text-xs ${colors.text} hover:bg-white/5 transition-all`}
                                >
                                    Check Another Student
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
