import React from "react";
import { motion } from "framer-motion";
import { FaCheckCircle, FaBook, FaChartLine, FaClock } from "react-icons/fa";

export default function ProgressCard({ subject, progress, totalChapters, theme }) {
    const completedCount = progress?.completedChapters?.length || 0;
    const percentage = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

    // Get theme colors
    const themeConfigs = {
        DeepSpace: { primary: "#38bdf8", accent: "#818cf8", bg: "bg-slate-900", border: "border-slate-700" },
        Sakura: { primary: "#ec4899", accent: "#f472b6", bg: "bg-pink-50", border: "border-pink-200" },
        Cyberpunk: { primary: "#a855f7", accent: "#06b6d4", bg: "bg-purple-950", border: "border-purple-800" },
        RoyalParchment: { primary: "#b45309", accent: "#d97706", bg: "bg-amber-50", border: "border-amber-200" },
        Light: { primary: "#4f46e5", accent: "#7c3aed", bg: "bg-slate-50", border: "border-slate-200" },
        MidnightAurora: { primary: "#10b981", accent: "#34d399", bg: "bg-emerald-950", border: "border-emerald-800" },
        SunsetDrift: { primary: "#f97316", accent: "#fb923c", bg: "bg-orange-950", border: "border-orange-800" },
        Phantom: { primary: "#ffffff", accent: "#a3a3a3", bg: "bg-neutral-900", border: "border-neutral-700" },
        Solaris: { primary: "#facc15", accent: "#fde047", bg: "bg-yellow-950", border: "border-yellow-800" },
        Aero: { primary: "#94a3b8", accent: "#cbd5e1", bg: "bg-slate-900", border: "border-slate-700" },
        Toxic: { primary: "#a3e635", accent: "#84cc16", bg: "bg-lime-950", border: "border-lime-800" },
        Synthwave: { primary: "#22d3ee", accent: "#e879f9", bg: "bg-fuchsia-950", border: "border-fuchsia-800" },
        Coffee: { primary: "#d6c5bb", accent: "#a8a29e", bg: "bg-stone-900", border: "border-stone-700" },
        RetroTerminal: { primary: "#22c55e", accent: "#4ade80", bg: "bg-green-950", border: "border-green-800" },
        Amethyst: { primary: "#c084fc", accent: "#a855f7", bg: "bg-purple-950", border: "border-purple-800" },
        Blueprint: { primary: "#ffffff", accent: "#93c5fd", bg: "bg-blue-900", border: "border-blue-700" },
        Clay: { primary: "#57534e", accent: "#78716c", bg: "bg-stone-200", border: "border-stone-300" },
        Radioactive: { primary: "#000000", accent: "#3f6212", bg: "bg-lime-300", border: "border-black" },
        CrimsonOLED: { primary: "#dc2626", accent: "#ef4444", bg: "bg-red-950", border: "border-red-800" },
        Industrial: { primary: "#f97316", accent: "#fb923c", bg: "bg-neutral-900", border: "border-neutral-700" },
        MidnightSun: { primary: "#fbbf24", accent: "#f59e0b", bg: "bg-purple-950", border: "border-purple-800" }
    };

    const colors = themeConfigs[theme] || themeConfigs.DeepSpace;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className={`relative overflow-hidden rounded-3xl border ${colors.border} ${colors.bg} p-6 backdrop-blur-xl transition-all duration-300`}
            style={{
                boxShadow: `0 0 30px ${colors.primary}20`
            }}
        >
            {/* Background Glow Effect */}
            <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: colors.primary }}
            />

            {/* Header */}
            <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="p-3 rounded-2xl"
                        style={{
                            backgroundColor: `${colors.primary}20`,
                            border: `1px solid ${colors.primary}40`
                        }}
                    >
                        <FaBook style={{ color: colors.primary }} size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight" style={{ color: colors.primary }}>
                            {subject}
                        </h3>
                        <p className="text-xs font-bold opacity-60 uppercase tracking-widest">
                            {completedCount} / {totalChapters} Chapters
                        </p>
                    </div>
                </div>
                <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{
                        backgroundColor: `${colors.accent}20`,
                        border: `1px solid ${colors.accent}40`
                    }}
                >
                    <FaChartLine style={{ color: colors.accent }} size={12} />
                    <span className="text-sm font-black" style={{ color: colors.accent }}>
                        {percentage}%
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-4">
                <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full relative"
                        style={{
                            backgroundColor: colors.primary,
                            boxShadow: `0 0 20px ${colors.primary}`
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </motion.div>
                </div>
            </div>

            {/* Chapter List Preview */}
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                {progress?.completedChapters?.slice(0, 3).map((chapter, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-2 text-xs"
                    >
                        <FaCheckCircle style={{ color: colors.accent }} size={10} />
                        <span className="font-medium truncate opacity-80">{chapter}</span>
                    </motion.div>
                ))}
                {progress?.completedChapters?.length > 3 && (
                    <p className="text-xs font-bold opacity-40 uppercase tracking-widest pl-4">
                        +{progress.completedChapters.length - 3} more completed
                    </p>
                )}
                {(!progress?.completedChapters || progress.completedChapters.length === 0) && (
                    <p className="text-xs font-bold opacity-40 uppercase tracking-widest italic">
                        No chapters completed yet
                    </p>
                )}
            </div>

            {/* Last Updated */}
            {progress?.lastUpdated && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                    <FaClock size={10} className="opacity-40" />
                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                        Last: {new Date(progress.lastUpdated?.seconds * 1000).toLocaleDateString()}
                    </span>
                </div>
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: ${colors.primary}40;
                    border-radius: 20px;
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </motion.div>
    );
}
