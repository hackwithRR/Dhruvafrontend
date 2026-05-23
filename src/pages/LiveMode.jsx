import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaTimes, FaMicrophone, FaVolumeUp, FaBrain, FaStop,
    FaWifi, FaChevronDown, FaBolt, FaMagic, FaRobot, FaSignal, FaChartLine
} from "react-icons/fa";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// ==========================================
// DYNAMIC LIQUID ORB COMPONENT
// ==========================================
const DynamicLiquidOrb = ({ audioData, appState, theme }) => {
    const [frequencyData, setFrequencyData] = useState(new Array(5).fill(0.5));

    // Process audio data into frequency bands
    useEffect(() => {
        if (!audioData || audioData.length === 0) return;

        // Divide frequency data into 5 bands for layered animation
        const bands = 5;
        const bandSize = Math.floor(audioData.length / bands);
        const newFrequencies = [];

        for (let i = 0; i < bands; i++) {
            const start = i * bandSize;
            const end = start + bandSize;
            const bandData = audioData.slice(start, end);
            const average = bandData.reduce((a, b) => a + b, 0) / bandData.length;
            // Normalize to 0-1 range and apply scaling
            const normalized = Math.min(1, (average / 255) * 1.5 + 0.2);
            newFrequencies.push(normalized);
        }

        setFrequencyData(newFrequencies);
    }, [audioData]);

    // Get gradient colors based on app state
    const getGradientColors = () => {
        if (appState === "listening") {
            return ["#22d3ee", "#06b6d4", "#0891b2", "#0e7490", "#155e75"]; // Cyan blues
        } else if (appState === "speaking") {
            return [theme.primaryHex, theme.primaryLight, "#8b5cf6", "#ec4899", "#3b82f6"]; // Theme + Purple/Pink/Blue
        } else if (appState === "processing") {
            return ["#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e"]; // Amber/Gold
        }
        return ["#3b82f6", "#8b5cf6", "#ec4899", "#6366f1", "#a855f7"]; // Default Blue/Purple/Pink
    };

    const colors = getGradientColors();
    const baseScale = appState === "speaking" ? 1.1 : appState === "listening" ? 1.05 : 1;

    return (
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            {/* Outer glow layers */}
            {frequencyData.map((freq, i) => (
                <motion.div
                    key={`glow-${i}`}
                    className="absolute rounded-full"
                    animate={{
                        scale: baseScale + (freq * 0.15 * (i + 1) * 0.3),
                        opacity: 0.15 + (freq * 0.1),
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                        mass: 0.5
                    }}
                    style={{
                        width: `${100 + i * 15}%`,
                        height: `${100 + i * 15}%`,
                        background: `radial-gradient(circle, ${colors[i]} 0%, transparent 70%)`,
                        filter: `blur(${40 + i * 5}px)`,
                        zIndex: 5 - i,
                    }}
                />
            ))}

            {/* SVG Liquid Orb */}
            <svg
                viewBox="0 0 200 200"
                className="w-full h-full relative z-10"
                style={{ filter: "blur(0.5px)" }}
            >
                <defs>
                    {/* Layered gradients */}
                    <radialGradient id="orbGradient1" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={colors[0]} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={colors[1]} stopOpacity="0.4" />
                    </radialGradient>
                    <radialGradient id="orbGradient2" cx="30%" cy="30%" r="60%">
                        <stop offset="0%" stopColor={colors[2]} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={colors[3]} stopOpacity="0.3" />
                    </radialGradient>
                    <radialGradient id="orbGradient3" cx="70%" cy="70%" r="50%">
                        <stop offset="0%" stopColor={colors[4]} stopOpacity="0.7" />
                        <stop offset="100%" stopColor={colors[0]} stopOpacity="0.2" />
                    </radialGradient>

                    {/* Filters for liquid effect */}
                    <filter id="liquidFilter">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                    </filter>
                </defs>

                {/* Animated orb circles */}
                <motion.circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="url(#orbGradient1)"
                    filter="url(#liquidFilter)"
                    animate={{
                        r: 75 + (frequencyData[0] * 15),
                        cx: 100 + Math.sin(Date.now() / 1000) * 3,
                        cy: 100 + Math.cos(Date.now() / 1000) * 3,
                    }}
                    transition={{
                        r: { type: "spring", stiffness: 200, damping: 15 },
                        cx: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                        cx: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                        cy: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    }}
                />

                <motion.circle
                    cx="100"
                    cy="100"
                    r="60"
                    fill="url(#orbGradient2)"
                    filter="url(#liquidFilter)"
                    animate={{
                        r: 55 + (frequencyData[1] * 12),
                        cx: 100 + Math.cos(Date.now() / 1200) * 5,
                        cy: 100 + Math.sin(Date.now() / 900) * 5,
                    }}
                    transition={{
                        r: { type: "spring", stiffness: 180, damping: 12 },
                        cx: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                        cy: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                    }}
                />

                <motion.circle
                    cx="100"
                    cy="100"
                    r="40"
                    fill="url(#orbGradient3)"
                    filter="url(#liquidFilter)"
                    animate={{
                        r: 35 + (frequencyData[2] * 10),
                        cx: 100 + Math.sin(Date.now() / 800) * 4,
                        cy: 100 + Math.cos(Date.now() / 1100) * 4,
                    }}
                    transition={{
                        r: { type: "spring", stiffness: 220, damping: 18 },
                        cx: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                        cy: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
                    }}
                />

                {/* Center core */}
                <motion.circle
                    cx="100"
                    cy="100"
                    r="20"
                    fill={colors[0]}
                    animate={{
                        r: 18 + (frequencyData[3] * 8),
                        opacity: 0.8 + (frequencyData[4] * 0.2),
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 250,
                        damping: 20,
                    }}
                    style={{
                        filter: `blur(${2 + frequencyData[4] * 3}px)`,
                    }}
                />
            </svg>

            {/* Rotating ring */}
            <motion.div
                className="absolute inset-0 rounded-full border-2 border-dashed"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                style={{
                    borderColor: colors[0],
                    opacity: 0.3,
                }}
            />
        </div>
    );
};

// ==========================================
// VOICE LIVE OVERLAY COMPONENT
// ==========================================
const VoiceLiveOverlay = ({
    appState,
    status,
    liveTranscript,
    lastTranscript,
    audioData,
    onInterrupt,
    theme,
    children
}) => {
    return (
        <div className="relative flex flex-col items-center justify-center flex-1 px-4">
            {/* Transcript Display */}
            <AnimatePresence>
                {appState === "listening" && (
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="absolute top-0 w-full max-w-lg mx-auto z-30"
                    >
                        <div className={`${theme.card} ${theme.border} border rounded-3xl p-6 backdrop-blur-xl shadow-2xl`}>
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    className="w-2 h-2 rounded-full bg-cyan-400"
                                />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
                                    Listening...
                                </span>
                            </div>
                            <motion.div
                                key={liveTranscript}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`text-center text-lg md:text-xl font-bold ${theme.text} min-h-[40px] flex items-center justify-center`}
                            >
                                {liveTranscript ? (
                                    <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                        {liveTranscript}
                                    </span>
                                ) : (
                                    <motion.span
                                        initial={{ opacity: 0.4 }}
                                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="opacity-40 italic"
                                    >
                                        Start speaking...
                                    </motion.span>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Interrupt indicator */}
            <AnimatePresence>
                {appState === "interrupted" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-20 z-30"
                    >
                        <div className="bg-red-500/20 border border-red-500/40 rounded-full px-4 py-2 backdrop-blur-md">
                            <span className="text-red-400 text-xs font-bold uppercase tracking-wider">
                                Interrupted - You spoke
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Orb Container */}
            <div className="relative z-20">
                <DynamicLiquidOrb
                    audioData={audioData}
                    appState={appState}
                    theme={theme}
                />
            </div>

            {/* Status text */}
            <motion.div
                key={status}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-center z-20"
            >
                <p className="text-sm font-bold uppercase tracking-widest" style={{
                    color: appState === "listening" ? "#22d3ee" :
                        appState === "speaking" ? theme.primaryHex :
                            appState === "processing" ? "#fbbf24" :
                                theme.isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)"
                }}>
                    {status}
                </p>
                {lastTranscript && appState !== "listening" && appState !== "processing" && (
                    <p className={`text-[10px] mt-2 max-w-xs truncate ${theme.isDark ? 'text-white/25' : 'text-black/30'}`}>
                        "{lastTranscript}"
                    </p>
                )}
            </motion.div>

            {children}
        </div>
    );
};



// Background animation configs matching theme colors
const bgConfigs = {
    DeepSpace: {
        blob1: "bg-indigo-600/20",
        blob2: "bg-blue-600/20",
        grid: "rgba(255,255,255,0.03)",
        scan: "via-indigo-500/20",
        glow: "rgba(79, 70, 229, 0.15)"
    },
    Light: {
        blob1: "bg-blue-200/40",
        blob2: "bg-indigo-200/40",
        grid: "rgba(0,0,0,0.03)",
        scan: "via-indigo-500/10",
        glow: "rgba(79, 70, 229, 0.08)"
    },
    Sakura: {
        blob1: "bg-[#fbcfe8]",
        blob2: "bg-[#bae6fd]",
        grid: "rgba(120, 113, 108, 0.05)",
        scan: "via-pink-200/30",
        glow: "rgba(244, 114, 182, 0.2)"
    },

    Cyberpunk: {
        blob1: "bg-cyan-600/20",
        blob2: "bg-fuchsia-600/20",
        grid: "rgba(6, 182, 212, 0.05)",
        scan: "via-cyan-500/30",
        glow: "rgba(6, 182, 212, 0.15)"
    },
    RoyalParchment: {
        blob1: "bg-amber-200/40",
        blob2: "bg-yellow-100/40",
        grid: "rgba(180, 83, 9, 0.04)",
        scan: "via-amber-500/10",
        glow: "rgba(180, 83, 9, 0.08)"
    },

    MidnightAurora: {
        blob1: "bg-emerald-600/20",
        blob2: "bg-violet-600/20",
        grid: "rgba(52, 211, 153, 0.03)",
        scan: "via-emerald-500/20",
        glow: "rgba(34, 197, 94, 0.12)"
    },
    SunsetDrift: {
        blob1: "bg-orange-600/20",
        blob2: "bg-red-600/20",
        grid: "rgba(249, 115, 22, 0.03)",
        scan: "via-orange-500/20",
        glow: "rgba(249, 115, 22, 0.15)"
    },
    Phantom: {
        blob1: "bg-neutral-700/20",
        blob2: "bg-neutral-600/20",
        grid: "rgba(255,255,255,0.05)",
        scan: "via-white/10",
        glow: "rgba(255, 255, 255, 0.05)"
    },
    Solaris: {
        blob1: "bg-amber-600/20",
        blob2: "bg-yellow-600/20",
        grid: "rgba(234, 179, 8, 0.04)",
        scan: "via-amber-500/20",
        glow: "rgba(234, 179, 8, 0.15)"
    },
    Aero: {
        blob1: "bg-slate-600/20",
        blob2: "bg-slate-500/20",
        grid: "rgba(255,255,255,0.03)",
        scan: "via-slate-400/20",
        glow: "rgba(148, 163, 184, 0.1)"
    },
    Toxic: {
        blob1: "bg-lime-600/20",
        blob2: "bg-green-600/20",
        grid: "rgba(132, 204, 22, 0.08)",
        scan: "via-lime-500/40",
        glow: "rgba(132, 204, 22, 0.25)"
    },
    Synthwave: {
        blob1: "bg-pink-600/20",
        blob2: "bg-purple-600/20",
        grid: "rgba(0,255,255,0.1)",
        scan: "via-pink-500/30",
        glow: "rgba(255, 0, 128, 0.2)"
    },
    Coffee: {
        blob1: "bg-stone-600/20",
        blob2: "bg-stone-500/20",
        grid: "rgba(214, 197, 187, 0.03)",
        scan: "via-stone-400/10",
        glow: "rgba(214, 197, 187, 0.1)"
    },
    RetroTerminal: {
        blob1: "bg-green-800/20",
        blob2: "bg-green-900/20",
        grid: "rgba(34, 197, 94, 0.08)",
        scan: "via-green-500/30",
        glow: "rgba(34, 197, 94, 0.15)"
    },
    Blueprint: {
        blob1: "bg-blue-700/30",
        blob2: "bg-blue-800/30",
        grid: "rgba(255, 255, 255, 0.15)",
        scan: "via-white/20",
        glow: "rgba(255, 255, 255, 0.2)"
    },
    Clay: {
        blob1: "bg-stone-300/40",
        blob2: "bg-stone-200/40",
        grid: "rgba(0, 0, 0, 0.03)",
        scan: "via-black/5",
        glow: "rgba(0, 0, 0, 0.05)"
    },
    Radioactive: {
        blob1: "bg-lime-400/30",
        blob2: "bg-lime-300/30",
        grid: "rgba(0, 0, 0, 0.1)",
        scan: "via-black/10",
        glow: "rgba(0, 0, 0, 0.1)"
    },
    Amethyst: {
        blob1: "bg-purple-800/20",
        blob2: "bg-purple-900/20",
        grid: "rgba(168, 85, 247, 0.04)",
        scan: "via-purple-500/20",
        glow: "rgba(168, 85, 247, 0.15)"
    },
    CrimsonOLED: {
        blob1: "bg-red-900/30",
        blob2: "bg-black/50",
        grid: "rgba(255, 0, 0, 0.05)",
        scan: "via-red-600/20",
        glow: "rgba(255, 0, 0, 0.15)"
    },
    Industrial: {
        blob1: "bg-neutral-700/20",
        blob2: "bg-neutral-600/20",
        grid: "rgba(249, 115, 22, 0.08)",
        scan: "via-orange-500/20",
        glow: "rgba(249, 115, 22, 0.1)"
    },
    MidnightSun: {
        blob1: "bg-purple-900/20",
        blob2: "bg-amber-500/10",
        grid: "rgba(252, 211, 77, 0.04)",
        scan: "via-amber-400/20",
        glow: "rgba(252, 211, 77, 0.15)"
    }
};



// Theme configuration matching Chat.jsx structure
const themes = {
    DeepSpace: {
        bg: "bg-[#050505]",
        hex: "#050505",
        primary: "indigo-600",
        primaryHex: "#4f46e5",
        primaryLight: "#818cf8",
        accent: "text-indigo-400",
        text: "text-white",
        card: "bg-white/[0.03]",
        border: "border-white/10",
        isDark: true,
        glow: "rgba(79, 70, 229, 0.4)"
    },
    Light: {
        bg: "bg-[#f8fafc]",
        hex: "#f8fafc",
        primary: "indigo-600",
        primaryHex: "#4f46e5",
        primaryLight: "#818cf8",
        accent: "text-indigo-600",
        text: "text-slate-900",
        card: "bg-white shadow-sm",
        border: "border-slate-200",
        isDark: false,
        glow: "rgba(79, 70, 229, 0.2)"
    },
    Sakura: {
        bg: "bg-[#fff5f7]",
        hex: "#fff5f7",
        primary: "pink-500",
        primaryHex: "#ec4899",
        primaryLight: "#f472b6",
        accent: "text-[#be185d]",
        text: "text-pink-950",
        card: "bg-pink-100/50",
        border: "border-pink-200",
        isDark: false,
        glow: "rgba(236, 72, 153, 0.2)"
    },

    Cyberpunk: {
        bg: "bg-[#0a0a0f]",
        hex: "#0a0a0f",
        primary: "cyan-500",
        primaryHex: "#06b6d4",
        primaryLight: "#22d3ee",
        accent: "text-cyan-400",
        text: "text-cyan-50",
        card: "bg-cyan-950/20",
        border: "border-cyan-500/20",
        isDark: true,
        glow: "rgba(6, 182, 212, 0.4)"
    },
    RoyalParchment: {
        bg: "bg-[#fdf6e3]",
        hex: "#fdf6e3",
        primary: "amber-700",
        primaryHex: "#b45309",
        primaryLight: "#d97706",
        accent: "text-amber-700",
        text: "text-amber-950",
        card: "bg-[#fffbeb] shadow-sm",
        border: "border-amber-200",
        isDark: false,
        glow: "rgba(180, 83, 9, 0.2)"
    },

    MidnightAurora: {
        bg: "bg-[#010806]",
        hex: "#010806",
        primary: "emerald-500",
        primaryHex: "#10b981",
        primaryLight: "#34d399",
        accent: "text-emerald-400",
        text: "text-emerald-50",
        card: "bg-emerald-950/20",
        border: "border-emerald-500/20",
        isDark: true,
        glow: "rgba(34, 197, 94, 0.4)"
    },
    SunsetDrift: {
        bg: "bg-[#0f0402]",
        hex: "#0f0402",
        primary: "orange-500",
        primaryHex: "#f97316",
        primaryLight: "#fb923c",
        accent: "text-orange-400",
        text: "text-orange-50",
        card: "bg-orange-950/20",
        border: "border-orange-500/20",
        isDark: true,
        glow: "rgba(249, 115, 22, 0.4)"
    },
    Phantom: {
        bg: "bg-[#050505]",
        hex: "#050505",
        primary: "white",
        primaryHex: "#ffffff",
        primaryLight: "#e5e5e5",
        accent: "text-gray-400",
        text: "text-white",
        card: "bg-neutral-900/50",
        border: "border-neutral-700",
        isDark: true,
        glow: "rgba(255, 255, 255, 0.2)"
    },
    Solaris: {
        bg: "bg-[#050401]",
        hex: "#050401",
        primary: "amber-400",
        primaryHex: "#facc15",
        primaryLight: "#fde047",
        accent: "text-amber-400",
        text: "text-amber-50",
        card: "bg-amber-950/20",
        border: "border-amber-500/20",
        isDark: true,
        glow: "rgba(234, 179, 8, 0.4)"
    },
    Aero: {
        bg: "bg-[#0f172a]",
        hex: "#0f172a",
        primary: "slate-400",
        primaryHex: "#94a3b8",
        primaryLight: "#cbd5e1",
        accent: "text-slate-300",
        text: "text-slate-200",
        card: "bg-slate-900/50",
        border: "border-slate-700",
        isDark: true,
        glow: "rgba(148, 163, 184, 0.3)"
    },
    Toxic: {
        bg: "bg-[#020500]",
        hex: "#020500",
        primary: "lime-400",
        primaryHex: "#a3e635",
        primaryLight: "#bef264",
        accent: "text-lime-400",
        text: "text-lime-50",
        card: "bg-lime-950/20",
        border: "border-lime-500/20",
        isDark: true,
        glow: "rgba(132, 204, 22, 0.4)"
    },
    Synthwave: {
        bg: "bg-[#120422]",
        hex: "#120422",
        primary: "cyan-400",
        primaryHex: "#22d3ee",
        primaryLight: "#67e8f9",
        accent: "text-pink-500",
        text: "text-pink-50",
        card: "bg-purple-950/30",
        border: "border-cyan-500/30",
        isDark: true,
        glow: "rgba(34, 211, 238, 0.4)"
    },
    Coffee: {
        bg: "bg-[#0c0a09]",
        hex: "#0c0a09",
        primary: "stone-300",
        primaryHex: "#d6c5bb",
        primaryLight: "#e7e5e4",
        accent: "text-stone-300",
        text: "text-stone-100",
        card: "bg-stone-900/50",
        border: "border-stone-700",
        isDark: true,
        glow: "rgba(214, 197, 187, 0.3)"
    },
    RetroTerminal: {
        bg: "bg-[#0a0f0a]",
        hex: "#0a0f0a",
        primary: "green-500",
        primaryHex: "#22c55e",
        primaryLight: "#4ade80",
        accent: "text-green-400",
        text: "text-green-100",
        card: "bg-green-950/30",
        border: "border-green-500/30",
        isDark: true,
        glow: "rgba(34, 197, 94, 0.4)"
    },
    Blueprint: {
        bg: "bg-[#1e40af]",
        hex: "#1e40af",
        primary: "white",
        primaryHex: "#ffffff",
        primaryLight: "#e0e7ff",
        accent: "text-blue-100",
        text: "text-white",
        card: "bg-blue-800/50",
        border: "border-white/30",
        isDark: true,
        glow: "rgba(255, 255, 255, 0.3)"
    },
    Clay: {
        bg: "bg-[#e5e5e1]",
        hex: "#e5e5e1",
        primary: "stone-600",
        primaryHex: "#57534e",
        primaryLight: "#78716c",
        accent: "text-stone-700",
        text: "text-stone-900",
        card: "bg-stone-200/50",
        border: "border-stone-300",
        isDark: false,
        glow: "rgba(87, 83, 78, 0.15)"
    },
    Radioactive: {
        bg: "bg-[#bef264]",
        hex: "#bef264",
        primary: "black",
        primaryHex: "#000000",
        primaryLight: "#1a1a1a",
        accent: "text-black",
        text: "text-black",
        card: "bg-lime-300/50",
        border: "border-black/20",
        isDark: false,
        glow: "rgba(0, 0, 0, 0.2)"
    },
    Amethyst: {
        bg: "bg-[#0d0214]",
        hex: "#0d0214",
        primary: "purple-400",
        primaryHex: "#c084fc",
        primaryLight: "#d8b4fe",
        accent: "text-purple-300",
        text: "text-purple-100",
        card: "bg-purple-950/30",
        border: "border-purple-500/30",
        isDark: true,
        glow: "rgba(192, 132, 252, 0.3)"
    },
    CrimsonOLED: {
        bg: "bg-[#000000]",
        hex: "#000000",
        primary: "red-600",
        primaryHex: "#dc2626",
        primaryLight: "#ef4444",
        accent: "text-red-500",
        text: "text-white",
        card: "bg-red-950/20",
        border: "border-red-900",
        isDark: true,
        glow: "rgba(220, 38, 38, 0.3)"
    },
    Industrial: {
        bg: "bg-[#1c1c1c]",
        hex: "#1c1c1c",
        primary: "orange-500",
        primaryHex: "#f97316",
        primaryLight: "#fb923c",
        accent: "text-orange-400",
        text: "text-neutral-200",
        card: "bg-neutral-800/50",
        border: "border-neutral-600",
        isDark: true,
        glow: "rgba(249, 115, 22, 0.2)"
    },
    MidnightSun: {
        bg: "bg-[#1a0b2e]",
        hex: "#1a0b2e",
        primary: "amber-400",
        primaryHex: "#fbbf24",
        primaryLight: "#fcd34d",
        accent: "text-amber-300",
        text: "text-purple-100",
        card: "bg-purple-900/30",
        border: "border-amber-500/30",
        isDark: true,
        glow: "rgba(251, 191, 36, 0.25)"
    }
};



const API_BASE = "https://dhruva-backend-e5h8.onrender.com";

const MODE = {
    IDLE: "idle",
    LISTENING: "listening",
    PROCESSING: "processing",
    SPEAKING: "speaking",
    ERROR: "error"
};

// Enhanced floating particle component with audio reactivity
const Particle = ({ theme, audioData, index }) => {
    const randomX = Math.random() * 100;
    const randomDelay = Math.random() * 5;
    const randomDuration = 6 + Math.random() * 8;
    const randomSize = 2 + Math.random() * 4;

    // Get audio reactivity for this particle
    const audioLevel = audioData && audioData.length > 0
        ? audioData[index % audioData.length] / 255
        : 0;

    return (
        <motion.div
            initial={{ x: `${randomX}vw`, y: "110vh", opacity: 0, scale: 0 }}
            animate={{
                y: "-10vh",
                opacity: [0, 0.4 + (audioLevel * 0.4), 0],
                scale: [0.5, 1 + (audioLevel * 0.5), 0.5],
                x: `${randomX + Math.sin(Date.now() / 1000 + index) * 5}vw`
            }}
            transition={{
                duration: randomDuration,
                delay: randomDelay,
                repeat: Infinity,
                ease: "linear",
                opacity: { duration: randomDuration / 2, repeat: Infinity, repeatType: "reverse" }
            }}
            className="absolute rounded-full pointer-events-none"
            style={{
                width: randomSize,
                height: randomSize,
                left: `${randomX}%`,
                background: `radial-gradient(circle, ${theme.primaryHex} 0%, transparent 70%)`,
                filter: `blur(${2 + audioLevel * 3}px)`,
                boxShadow: `0 0 ${10 + audioLevel * 20}px ${theme.primaryHex}`
            }}
        />
    );
};

// Ripple effect component
const RippleEffect = ({ x, y, color }) => {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="fixed pointer-events-none rounded-full border-2 z-50"
            style={{
                left: x - 50,
                top: y - 50,
                width: 100,
                height: 100,
                borderColor: color,
                boxShadow: `0 0 30px ${color}`
            }}
        />
    );
};


export default function LiveMode() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, userData } = useAuth();
    const { subject, chapter } = location.state || { subject: "General", chapter: "Concepts" };

    const activeTheme = useMemo(() => {
        const key = userData?.theme || "DeepSpace";
        return themes[key] || themes.DeepSpace;
    }, [userData?.theme]);

    useEffect(() => {
        if (activeTheme?.hex) {
            document.body.style.backgroundColor = activeTheme.hex;
            document.documentElement.style.backgroundColor = activeTheme.hex;
        }
    }, [activeTheme]);

    const [appState, setAppState] = useState(MODE.IDLE);
    const [status, setStatus] = useState("Initializing Neural Link...");
    const [isContinuousMode, setIsContinuousMode] = useState(true);
    const [lastTranscript, setLastTranscript] = useState("");
    const [showControls, setShowControls] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("connecting");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState("");
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [ripples, setRipples] = useState([]);

    // Audio visualization data
    const [audioData, setAudioData] = useState(new Array(64).fill(0));

    // Add ripple effect on click
    const addRipple = useCallback((e) => {
        const newRipple = {
            x: e.clientX,
            y: e.clientY,
            id: Date.now(),
            color: activeTheme.primaryHex
        };
        setRipples(prev => [...prev, newRipple]);
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 1000);
    }, [activeTheme.primaryHex]);


    // VAD (Voice Activity Detection) refs
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const microphoneStreamRef = useRef(null);
    const vadIntervalRef = useRef(null);
    const isVADActiveRef = useRef(false);


    const userClass = userData?.classLevel || userData?.class || "10";
    const userBoard = userData?.board || "CBSE";
    const userLang = userData?.language || "English";
    const userName = userData?.name || "Explorer";

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);
    const restartTimeoutRef = useRef(null);
    const wakeLockRef = useRef(null);
    const lastSpokenTextRef = useRef("");
    const ignoreNextTranscriptRef = useRef(false);
    const speakingRef = useRef(false); // Track when AI is actually speaking

    // ==========================================
    // VAD & AUDIO ANALYSIS FUNCTIONS
    // ==========================================

    // Initialize audio context for VAD and visualization
    const initializeAudioContext = useCallback(async () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphoneStreamRef.current = stream;

            // Create analyser
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 128; // Small size for performance
            analyser.smoothingTimeConstant = 0.8;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyser);

            analyserRef.current = analyser;
            isVADActiveRef.current = true;

            // Start VAD monitoring
            startVADMonitoring();

        } catch (err) {
            console.error("Failed to initialize audio context:", err);
        }
    }, []);

    // Start VAD (Voice Activity Detection) monitoring
    const startVADMonitoring = useCallback(() => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // VAD DISABLED - Only using for visualization, not interruption
        // To re-enable interruption, lower this threshold
        const VAD_THRESHOLD = -10; // Much higher threshold (requires very loud voice)
        const VAD_DEBOUNCE = 2000; // 2 seconds debounce

        let lastVoiceDetection = 0;
        let isInterrupting = false;
        let consecutiveDetections = 0;

        const checkVAD = () => {
            if (!isVADActiveRef.current || !analyserRef.current) return;

            analyserRef.current.getByteFrequencyData(dataArray);

            // Update visualization data only
            setAudioData(Array.from(dataArray));

            // Calculate volume in dB
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;

            // Skip if silence
            if (average === 0) {
                vadIntervalRef.current = requestAnimationFrame(checkVAD);
                return;
            }

            const db = 20 * Math.log10(average / 255);

            // VAD Logic: Only interrupt if VERY loud and sustained (effectively disabled for normal use)
            if (speakingRef.current && db > VAD_THRESHOLD) {
                consecutiveDetections++;

                if (consecutiveDetections >= 10 && !isInterrupting) { // Requires 10 consecutive detections
                    const now = Date.now();
                    if (now - lastVoiceDetection > VAD_DEBOUNCE) {
                        console.log("VAD: High volume detected, interrupting AI");
                        isInterrupting = true;
                        lastVoiceDetection = now;
                        consecutiveDetections = 0;

                        // Stop AI speech immediately
                        synthesisRef.current.cancel();
                        speakingRef.current = false;
                        setIsSpeaking(false);
                        setAppState("interrupted");
                        setStatus("Interrupted - You spoke");

                        setTimeout(() => {
                            setAppState(MODE.LISTENING);
                            setStatus("Listening...");
                            isInterrupting = false;
                        }, 500);

                        setTimeout(() => {
                            startListeningRef.current(false);
                        }, 600);
                    }
                }
            } else {
                consecutiveDetections = 0;
            }

            vadIntervalRef.current = requestAnimationFrame(checkVAD);
        };

        vadIntervalRef.current = requestAnimationFrame(checkVAD);
    }, []);



    // Stop VAD monitoring
    const stopVADMonitoring = useCallback(() => {
        isVADActiveRef.current = false;
        if (vadIntervalRef.current) {
            cancelAnimationFrame(vadIntervalRef.current);
            vadIntervalRef.current = null;
        }
        if (microphoneStreamRef.current) {
            microphoneStreamRef.current.getTracks().forEach(track => track.stop());
            microphoneStreamRef.current = null;
        }
    }, []);

    // Cleanup audio context on unmount
    useEffect(() => {
        return () => {
            stopVADMonitoring();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [stopVADMonitoring]);


    // Use sessionStorage to persist across component remounts (when userData changes in App.js)
    const getSessionHistory = () => {
        try {
            const stored = sessionStorage.getItem('liveMode_history');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    };

    const setSessionHistory = (history) => {
        try {
            sessionStorage.setItem('liveMode_history', JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    };

    const hasGreetedRef = useRef(false); // Track if initial greeting has been played
    const currentQuestionRef = useRef(""); // Track current question being asked

    const conversationHistoryRef = useRef(getSessionHistory()); // Store conversation history for context




    const calculateSimilarity = (str1, str2) => {
        if (!str1 || !str2) return 0;
        const s1 = str1.toLowerCase().split(' ');
        const s2 = str2.toLowerCase().split(' ');
        const intersection = s1.filter(x => s2.includes(x));
        return (2 * intersection.length) / (s1.length + s2.length);
    };

    const getIndianMaleVoice = useCallback(() => {
        const voices = synthesisRef.current.getVoices();
        const lang = userLang === 'Hinglish' ? 'hi-IN' : 'en-IN';

        // First try to find a natural-sounding English voice (more natural for both English and Hinglish)
        let voice = voices.find(v =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('man') ||
                v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('james') ||
                v.name.toLowerCase().includes('john') || v.name.toLowerCase().includes('mark'))
        );

        // If no English male voice, try Indian English
        if (!voice) {
            voice = voices.find(v =>
                v.lang === 'en-IN' && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('man'))
            );
        }

        // Try any Indian voice
        if (!voice) {
            voice = voices.find(v =>
                v.lang === 'en-IN' || v.lang === 'hi-IN'
            );
        }

        // Fallback to any English voice
        if (!voice) {
            voice = voices.find(v => v.lang.startsWith('en'));
        }

        // Final fallback - any available voice
        return voice || voices[0];
    }, [userLang]);

    const cleanText = useCallback((text) => {
        return text.replace(/[*_`~#]/g, '').replace(/\\\[.*?\\\]/g, '').replace(/\[.*?\]\(.*?\)/g, '').trim();
    }, []);

    const speak = useCallback(async (text, forceInterrupt = false) => {
        if (forceInterrupt) synthesisRef.current.cancel();

        const clean = cleanText(text);
        if (!clean) return;

        lastSpokenTextRef.current = clean.toLowerCase();
        ignoreNextTranscriptRef.current = true;
        // Increased timeout to 2500ms for better self-listening prevention
        setTimeout(() => { ignoreNextTranscriptRef.current = false; }, 2500);

        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.voice = getIndianMaleVoice();
        utterance.lang = userLang === 'Hinglish' ? 'hi-IN' : 'en-IN';
        // More natural speaking rate and pitch
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            speakingRef.current = true;
            setAppState(MODE.SPEAKING);
            setIsSpeaking(true);
            setStatus("Padhoyaar is speaking...");
            // Initialize VAD when AI starts speaking (for interruption)
            initializeAudioContext();
            // Stop any ongoing recognition when AI starts speaking
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore if already stopped
                }
            }
        };

        utterance.onend = () => {
            speakingRef.current = false;
            setAppState(MODE.IDLE);
            setIsSpeaking(false);
            setStatus(isContinuousMode ? "Tap to speak" : "Ready");
            // Stop VAD when AI stops speaking
            stopVADMonitoring();
            // Auto-restart listening in continuous mode - increased delay to 1500ms
            if (isContinuousMode) {
                setTimeout(() => {
                    if (!speakingRef.current) {
                        startListeningRef.current(true);
                    }
                }, 1500);
            }
        };

        utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            speakingRef.current = false;
            setAppState(MODE.IDLE);
            setIsSpeaking(false);
            setStatus("Ready");
            // Stop VAD on error
            stopVADMonitoring();
            if (isContinuousMode) {
                setTimeout(() => {
                    if (!speakingRef.current) {
                        startListeningRef.current(true);
                    }
                }, 1500);
            }
        };

        synthesisRef.current.speak(utterance);
    }, [getIndianMaleVoice, cleanText, isContinuousMode, userLang]);



    const stopSpeaking = useCallback(() => {
        synthesisRef.current.cancel();
        setAppState(MODE.IDLE);
        setIsSpeaking(false);
        setStatus("Ready");
        if (isContinuousMode) setTimeout(() => startListening(true), 300);
    }, [isContinuousMode]);

    const startListening = useCallback((autoStart = false) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setStatus("Speech Recognition not supported");
            setAppState(MODE.ERROR);
            return false;
        }

        // Don't start listening if AI is currently speaking
        if (speakingRef.current) {
            return false;
        }

        // Don't start if already in certain states
        if (appState === MODE.SPEAKING || appState === MODE.PROCESSING) {
            return false;
        }

        if (recognitionRef.current) recognitionRef.current.stop();
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onstart = () => {
            setAppState(MODE.LISTENING);
            setStatus("Listening...");
            setConnectionStatus("connected");
            setLiveTranscript("");
        };

        recognitionRef.current.onresult = async (event) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript.trim();

            if (!result.isFinal) {
                setLiveTranscript(transcript.toLowerCase());
            }

            if (ignoreNextTranscriptRef.current) {
                const similarity = calculateSimilarity(transcript, lastSpokenTextRef.current);
                // Lowered threshold to 0.4 for better self-listening detection
                if (similarity > 0.4) return;
            }

            // Also check if AI is currently speaking
            if (speakingRef.current) {
                return;
            }

            if (result.isFinal && transcript) {
                setLiveTranscript(transcript.toLowerCase());
                setLastTranscript(transcript);
                setAppState(MODE.PROCESSING);
                setStatus("Processing...");
                recognitionRef.current?.stop();

                // Build conversation context from history
                const recentHistory = getSessionHistory().slice(-6); // Last 3 exchanges (6 messages)
                let conversationContext = "";

                if (recentHistory.length > 0) {
                    conversationContext = "\n\nCONVERSATION HISTORY:\n";
                    recentHistory.forEach(msg => {
                        const role = msg.role === "assistant" ? "Padhoyaar" : userName;
                        conversationContext += `${role}: ${msg.content}\n`;
                    });
                }

                const systemInstruction = `
ROLE: You are Padhoyaar, a super-friendly and kinda funny (with genz humour) AI tutor for Class ${userClass} (${userBoard} Board). 
Student: ${userName}. Subject: ${subject}. Chapter: ${chapter}.
Mode: Continuous Voice Conversation. 
Language: ${userLang.name} (Type: ${userLang.type}).

STRICT BOARD SYLLABUS PROTOCOL:
1. CBSE RIGOR: Use NCERT-only context. Focus on direct conceptual clarity, "Assertion-Reasoning," and "Case-Based" question styles.
2. ICSE RIGOR: Follow CISCE depth (e.g., Selina/S. Chand). Use high-level technical terminology and "Application-Based" scenarios. For Science (Class 9-10), maintain strict distinction between Physics, Chemistry, and Biology.
3. ADAPTIVITY: Actively monitor ${userClass}, ${userBoard}, and ${userLang}. If the student edits these mid-chat, acknowledge the change (e.g., "Switching to ICSE mode now!") and adjust depth instantly.

LINGUISTIC & EXAM STRATEGY:
- NATIVE/HYBRID LOGIC: If type is "Hybrid" (e.g., Hinglish/Tanglish), use the regional language for conversational flow but keep CORE definitions and concepts in English.
- BOARD KEYWORDS: Always emphasize "High-Yield" keywords required for board marking schemes (e.g., "Latent Heat," "Juxtaposition," or "Fundamental Rights").
- TECHNICAL TERMS: Regardless of language, ensure the student learns the English technical terms they will need to write on the exam paper.

VOICE-FIRST PEDAGOGY:
- NO MONOLOGUES: Explain ONE concept at a time (MAX 45-50 words). Avoid "walls of sound."
- GREET IF GREETED: IF greeted greet back and continue.
- NO REPETITION: After the first turn, NEVER re-introduce yourself or say "Namaste." Jump straight into: "Exactly! Now..." or "Great point, ${userName}..."
- BRIDGE THE GAP: If the student is half-correct, validate their logic and gently guide them to the full answer. Be a supportive peer, not a lecturer.

ENDING PROTOCOL:
- Every turn must end with a natural, board-relevant follow-up question to keep the voice flow active.
${conversationContext}
`.trim();


                const formData = new FormData();
                formData.append("userId", currentUser?.uid || "anonymous");
                formData.append("message", transcript);
                formData.append("systemInstruction", systemInstruction);
                formData.append("subject", subject);
                formData.append("chapter", chapter);
                formData.append("mode", "Explain");
                formData.append("board", userBoard);
                formData.append("class", userClass);

                // Add conversation history for context (including current user message)
                // Add user message to history BEFORE sending to API so context is preserved even on error
                const currentHistory = getSessionHistory();
                currentHistory.push({ role: "user", content: transcript });
                conversationHistoryRef.current = currentHistory;
                setSessionHistory(currentHistory);

                const historyString = currentHistory
                    .map(msg => `${msg.role}: ${msg.content}`)
                    .join('\n');
                formData.append("history", historyString);

                try {
                    console.log("Sending request to API with message:", transcript);
                    console.log("FormData contents:", {
                        userId: currentUser?.uid || "anonymous",
                        message: transcript,
                        subject,
                        chapter,
                        userClass,
                        userBoard
                    });

                    const res = await axios.post(`${API_BASE}/chat`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        timeout: 30000
                    });

                    console.log("API response received:", res.data);
                    console.log("Response type:", typeof res.data);
                    console.log("Response keys:", Object.keys(res.data));

                    // Extract reply from response - handle different response formats
                    let replyText = null;

                    if (res.data && res.data.reply) {
                        replyText = res.data.reply;
                    } else if (res.data && typeof res.data === 'string') {
                        replyText = res.data;
                    } else if (res.data && res.data.message) {
                        replyText = res.data.message;
                    } else if (res.data && res.data.response) {
                        replyText = res.data.response;
                    } else if (res.data && res.data.text) {
                        replyText = res.data.text;
                    }

                    if (!replyText || typeof replyText !== 'string' || replyText.trim().length === 0) {
                        console.error("Invalid or empty API response:", res.data);
                        setStatus("Invalid response from server");
                        setAppState(MODE.ERROR);
                        return;
                    }

                    console.log("Extracted reply:", replyText.substring(0, 100) + "...");

                    // Add AI response to conversation history
                    const updatedHistory = getSessionHistory();
                    updatedHistory.push({ role: "assistant", content: replyText });

                    // Keep history manageable - limit to last 10 exchanges (20 messages)
                    if (updatedHistory.length > 20) {
                        updatedHistory.splice(0, updatedHistory.length - 20);
                    }

                    conversationHistoryRef.current = updatedHistory;
                    setSessionHistory(updatedHistory);

                    // Speak the response
                    console.log("Calling speak() with reply");
                    speak(replyText, true);

                } catch (err) {
                    console.error("API Error:", err);
                    console.error("Error response:", err.response?.data);
                    setStatus("Connection Error: " + (err.message || "Unknown error"));
                    setAppState(MODE.ERROR);
                    setConnectionStatus("error");
                    if (isContinuousMode) {
                        restartTimeoutRef.current = setTimeout(() => startListening(true), 2000);
                    }
                }


            }
        };

        recognitionRef.current.onerror = (event) => {
            if (event.error === "no-speech") {
                if (isContinuousMode && !speakingRef.current) {
                    restartTimeoutRef.current = setTimeout(() => startListening(true), 500);
                } else {
                    setAppState(MODE.IDLE);
                    setStatus("Tap to speak");
                }
            } else if (event.error === "not-allowed") {
                setStatus("Microphone access denied");
                setAppState(MODE.ERROR);
            } else if (event.error === "network") {
                setStatus("Network error");
                setAppState(MODE.ERROR);
                setConnectionStatus("error");
                if (isContinuousMode && !speakingRef.current) {
                    restartTimeoutRef.current = setTimeout(() => startListening(true), 3000);
                }
            } else if (isContinuousMode && !speakingRef.current) {
                restartTimeoutRef.current = setTimeout(() => startListening(true), 1000);
            }
        };

        recognitionRef.current.onend = () => {
            // Don't stop VAD here - let it continue for visualization
            console.log("Recognition ended");
        };

        try {
            recognitionRef.current.start();
            console.log("Recognition started");
            return true;
        } catch (err) {
            console.error("Failed to start recognition:", err);
            setStatus("Failed to start listening");
            setAppState(MODE.ERROR);
            return false;
        }
    }, [subject, chapter, speak, isContinuousMode, userClass, userBoard, userName, currentUser, userLang, appState]);




    const handleStartListening = useCallback(() => {
        synthesisRef.current.cancel();
        // Stop any ongoing VAD
        stopVADMonitoring();
        startListening(false);
    }, [startListening, stopVADMonitoring]);


    const speakRef = useRef(speak);
    const startListeningRef = useRef(startListening);

    useEffect(() => {
        speakRef.current = speak;
        startListeningRef.current = startListening;
    }, [speak, startListening]);

    useEffect(() => {
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                }
            } catch (err) { console.log("Wake lock not available"); }
        };
        requestWakeLock();

        const loadVoices = () => window.speechSynthesis.getVoices();
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        const initTimeout = setTimeout(() => {
            setConnectionStatus("connected");
            // Only play greeting if not already greeted (check sessionStorage)
            const hasGreeted = sessionStorage.getItem('liveMode_hasGreeted') === 'true';
            const storedHistory = getSessionHistory();

            // Only greet if never greeted AND no conversation history exists
            if (!hasGreeted && storedHistory.length === 0) {
                sessionStorage.setItem('liveMode_hasGreeted', 'true');
                hasGreetedRef.current = true;
                const intro = `Welcome to PadhoYaar! 🚀

Why struggle alone when you have an AI friend? From Class 8 to 12, I'm your 24/7 tutor for every single subject.

Maths or Stats? I'll solve it.

Science or Commerce? I'll explain it.

Humanities? I've got the notes.

If you haven't started today's prep yet—Ab PadhoYaar! Let's turn those weak spots into your strengths. What's on the schedule today?`;
                speakRef.current(intro);
            } else if (storedHistory.length > 0) {
                // If there's existing history, just acknowledge reconnection briefly
                hasGreetedRef.current = true;
                console.log("Existing conversation history found, skipping greeting");
            }
        }, 1500);


        return () => {
            clearTimeout(initTimeout);
            synthesisRef.current.cancel();
            if (recognitionRef.current) recognitionRef.current.stop();
            if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
            if (wakeLockRef.current) wakeLockRef.current.release();
        };
    }, []);


    // Visual helpers - unified for all states
    const getStatusColor = () => {
        switch (appState) {
            case MODE.LISTENING: return { color: "#22d3ee", glow: "rgba(34, 211, 238, 0.5)", icon: <FaMicrophone /> };
            case MODE.PROCESSING: return { color: "#fbbf24", glow: "rgba(251, 191, 36, 0.5)", icon: <FaBrain /> };
            case MODE.SPEAKING: return { color: activeTheme.primaryHex, glow: activeTheme.glow, icon: <FaVolumeUp /> };
            case "interrupted": return { color: "#f87171", glow: "rgba(248, 113, 113, 0.5)", icon: <FaStop /> };
            case MODE.ERROR: return { color: "#f87171", glow: "rgba(248, 113, 113, 0.5)", icon: <FaTimes /> };
            default: return { color: activeTheme.isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)", glow: "transparent", icon: <FaMagic /> };
        }
    };

    const statusStyle = getStatusColor();

    // Helper functions for orb animation and audio bars
    const getOrbAnimation = () => {
        if (appState === MODE.SPEAKING) return { scale: [1, 1.1, 1] };
        if (appState === MODE.LISTENING) return { scale: [1, 1.05, 1] };
        if (appState === MODE.PROCESSING) return { scale: [1, 1.06, 1] };
        return { scale: 1 };
    };

    const renderAudioBars = () => {
        const bars = [...Array(12)];
        return bars.map((_, i) => {
            let height;
            let bgColor;

            if (appState === MODE.SPEAKING) {
                height = Math.random() * 40 + 15;
                bgColor = activeTheme.primaryHex;
            } else if (appState === MODE.LISTENING) {
                height = Math.random() * 30 + 10;
                bgColor = "#22d3ee";
            } else if (appState === MODE.PROCESSING) {
                height = 12 + Math.sin(Date.now() / 150 + i) * 10;
                bgColor = "#fbbf24";
            } else {
                height = 8;
                bgColor = activeTheme.isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";
            }

            return (
                <motion.div
                    key={i}
                    animate={{ height }}
                    transition={{
                        duration: appState === MODE.IDLE ? 0.3 : 0.06,
                        repeat: appState !== MODE.IDLE ? Infinity : 0,
                        repeatType: "reverse",
                        delay: i * 0.03
                    }}
                    className="w-1.5 rounded-full"
                    style={{ backgroundColor: bgColor }}
                />
            );
        });
    };

    // Get background config based on theme

    const activeBgConfig = useMemo(() => {
        const key = userData?.theme || "DeepSpace";
        return bgConfigs[key] || bgConfigs.DeepSpace;
    }, [userData?.theme]);

    // Mouse tracking for interactive radial glow
    useEffect(() => {
        const handleMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    // Click handler for ripples
    useEffect(() => {
        window.addEventListener("click", addRipple);
        return () => window.removeEventListener("click", addRipple);
    }, [addRipple]);


    return (
        <div
            className={`fixed inset-0 flex flex-col ${activeTheme.bg} overflow-hidden`}
            style={{ backgroundColor: activeTheme.hex }}
        >
            {/* Animated Gradient Blobs */}
            <div className={`absolute top-[-10%] left-[-10%] w-[70%] h-[70%] blur-[130px] rounded-full animate-blob ${activeBgConfig.blob1}`} />
            <div className={`absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] blur-[130px] rounded-full animate-blob animation-delay-2000 ${activeBgConfig.blob2}`} />

            {/* Dynamic Grid */}
            <div
                className="absolute inset-0 z-0 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, ${activeBgConfig.grid} 1px, transparent 1px),
                        linear-gradient(to bottom, ${activeBgConfig.grid} 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Interactive Radial Glow */}
            <div
                className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(800px at ${mousePos.x}px ${mousePos.y}px, ${activeBgConfig.glow}, transparent 80%)`
                }}
            />

            {/* Scanning Line */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <div className={`w-full h-[1px] bg-gradient-to-r from-transparent ${activeBgConfig.scan} to-transparent absolute top-0 animate-scan`} />
            </div>

            {/* Film Grain Texture */}
            <div className="absolute inset-0 z-40 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Enhanced Floating Particles - Audio Reactive */}
            {[...Array(20)].map((_, i) => (
                <Particle key={i} theme={activeTheme} audioData={audioData} index={i} />
            ))}

            {/* Ripple Effects */}
            <AnimatePresence>
                {ripples.map(ripple => (
                    <RippleEffect key={ripple.id} x={ripple.x} y={ripple.y} color={ripple.color} />
                ))}
            </AnimatePresence>


            {/* Header - Enhanced Glassmorphism */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="w-full max-w-2xl mx-auto pt-6 px-4 relative z-10"
            >
                <div className={`flex justify-between items-center p-4 rounded-3xl ${activeTheme.card} ${activeTheme.border} border backdrop-blur-2xl shadow-2xl`}>
                    <div className="flex-1">
                        <motion.h1
                            animate={{ opacity: [0.8, 1, 0.8] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className={`text-2xl md:text-3xl font-black tracking-tight uppercase ${activeTheme.text}`}
                            style={{ textShadow: `0 0 30px ${activeTheme.glow}` }}
                        >
                            {subject}
                        </motion.h1>
                        <p className={`text-[9px] font-bold uppercase tracking-[0.4em] mt-1 ${activeTheme.accent} flex items-center gap-2`}>
                            <motion.span
                                animate={{ rotate: [0, 360] }}
                                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                className="inline-block"
                            >
                                <FaBolt size={10} />
                            </motion.span>
                            Neural Link Active • {chapter}
                        </p>
                    </div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10`}
                    >
                        <motion.div
                            animate={{
                                scale: connectionStatus === "connected" ? [1, 1.2, 1] : 1,
                                opacity: connectionStatus === "connected" ? [1, 0.7, 1] : 1
                            }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                                backgroundColor: connectionStatus === "connected" ? "#22c55e" : connectionStatus === "error" ? "#f87171" : "#fbbf24",
                                boxShadow: connectionStatus === "connected" ? "0 0 10px #22c55e" : "none"
                            }}
                        />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${activeTheme.isDark ? 'text-white/60' : 'text-black/60'}`}>
                            {connectionStatus}
                        </span>

                    </motion.div>
                </div>
            </motion.div>


            {/* Main Visualizer Area - Enhanced */}
            <div className="relative flex flex-col items-center justify-center flex-1 px-4">

                {/* Enhanced Transcript Display */}
                <AnimatePresence mode="wait">
                    {appState === MODE.LISTENING && (
                        <motion.div
                            initial={{ opacity: 0, y: -30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -30, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="absolute top-8 w-full max-w-lg mx-auto z-30"
                        >
                            <div
                                className={`${activeTheme.card} ${activeTheme.border} border rounded-3xl p-6 backdrop-blur-2xl shadow-2xl`}
                                style={{ boxShadow: `0 20px 60px ${activeTheme.glow}` }}
                            >
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                                        transition={{ repeat: Infinity, duration: 0.6 }}
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: "#22d3ee", boxShadow: "0 0 20px #22d3ee" }}
                                    />
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: "#22d3ee" }}>
                                        Listening...
                                    </span>
                                </div>
                                <motion.div
                                    key={liveTranscript}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`text-center text-xl md:text-2xl font-bold ${activeTheme.text} min-h-[50px] flex items-center justify-center`}
                                >
                                    {liveTranscript ? (
                                        <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                                            {liveTranscript}
                                        </span>
                                    ) : (
                                        <motion.span
                                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            className={`italic ${activeTheme.isDark ? 'text-white/40' : 'text-black/40'}`}
                                        >
                                            Start speaking...
                                        </motion.span>

                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Speaking Indicator */}
                <AnimatePresence>
                    {appState === MODE.SPEAKING && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute top-8 z-30"
                        >
                            <div
                                className="px-6 py-3 rounded-full backdrop-blur-xl border"
                                style={{
                                    backgroundColor: `${activeTheme.primaryHex}20`,
                                    borderColor: `${activeTheme.primaryHex}50`,
                                    boxShadow: `0 0 30px ${activeTheme.glow}`
                                }}
                            >
                                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: activeTheme.primaryHex }}>
                                    Padhoyaar Speaking
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Neural Orb */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="relative z-20"
                >
                    <DynamicLiquidOrb
                        audioData={audioData}
                        appState={appState}
                        theme={activeTheme}
                    />
                </motion.div>


                {/* Enhanced Status Display */}
                <motion.div
                    key={status}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10 text-center z-20"
                >
                    <motion.p
                        className="text-lg md:text-xl font-black uppercase tracking-[0.2em]"
                        style={{
                            color: statusStyle.color,
                            textShadow: `0 0 20px ${statusStyle.glow}`
                        }}
                    >
                        {status}
                    </motion.p>
                    {lastTranscript && appState !== MODE.LISTENING && appState !== MODE.PROCESSING && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`text-xs mt-3 max-w-sm mx-auto truncate ${activeTheme.isDark ? 'text-white/30' : 'text-black/40'}`}
                        >
                            "{lastTranscript}"
                        </motion.p>
                    )}
                </motion.div>
            </div>


            {/* Bottom Controls - Enhanced Glassmorphism */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                className="w-full max-w-md mx-auto pb-8 px-4 flex flex-col items-center gap-5 z-10"
            >
                <div className="flex items-center gap-4">
                    {/* Stop Button */}
                    <AnimatePresence>
                        {isSpeaking && (
                            <motion.button
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={stopSpeaking}
                                className="p-4 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all backdrop-blur-xl"
                                style={{ boxShadow: "0 0 20px rgba(248, 113, 113, 0.3)" }}
                            >
                                <FaStop size={18} />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Main Microphone Button - Enhanced */}
                    <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={handleStartListening}
                        disabled={appState === MODE.PROCESSING}
                        className="relative p-8 rounded-full transition-all overflow-hidden group"
                        style={{
                            background: appState === MODE.LISTENING
                                ? "linear-gradient(135deg, #06b6d4, #22d3ee)"
                                : appState === MODE.PROCESSING
                                    ? "linear-gradient(135deg, #d97706, #fbbf24)"
                                    : `linear-gradient(135deg, ${activeTheme.primaryHex}, ${activeTheme.primaryLight})`,
                            boxShadow: appState === MODE.LISTENING
                                ? "0 0 50px rgba(34, 211, 238, 0.6), inset 0 0 20px rgba(255,255,255,0.2)"
                                : `0 0 50px ${activeTheme.glow}, inset 0 0 20px rgba(255,255,255,0.2)`,
                            cursor: appState === MODE.PROCESSING ? "not-allowed" : "pointer"
                        }}
                    >
                        {/* Pulse ring animation */}
                        {appState === MODE.LISTENING && (
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-0 rounded-full border-2 border-cyan-400"
                            />
                        )}

                        <motion.div
                            animate={appState === MODE.PROCESSING ? { rotate: 360 } : {}}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        >
                            {appState === MODE.LISTENING ? (
                                <div className="w-6 h-6 rounded-full bg-white" />
                            ) : appState === MODE.PROCESSING ? (
                                <FaBrain className="text-white" size={24} />
                            ) : (
                                <FaMicrophone className="text-white" size={24} />
                            )}
                        </motion.div>
                    </motion.button>

                    {/* Settings Toggle - Enhanced */}
                    <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setShowControls(!showControls)}
                        className={`p-4 rounded-full ${activeTheme.card} ${activeTheme.border} border backdrop-blur-xl ${activeTheme.isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'} transition-all`}
                        style={{ boxShadow: `0 0 20px ${activeTheme.glow}` }}
                    >

                        <motion.div animate={{ rotate: showControls ? 180 : 0 }}>
                            <FaChevronDown size={18} />
                        </motion.div>
                    </motion.button>
                </div>

                {/* Expandable Controls - Enhanced */}
                <AnimatePresence>
                    {showControls && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: 20 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: 20 }}
                            className={`w-full ${activeTheme.card} ${activeTheme.border} border rounded-3xl p-5 backdrop-blur-2xl space-y-4`}
                            style={{ boxShadow: `0 20px 40px ${activeTheme.glow}` }}
                        >
                            {/* Continuous Mode Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isContinuousMode ? 'bg-green-500/20' : activeTheme.isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                        <FaWifi className={isContinuousMode ? "text-green-400" : activeTheme.isDark ? "text-white/40" : "text-black/40"} size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-black uppercase tracking-wider ${activeTheme.isDark ? 'text-white/90' : 'text-black/90'}`}>Continuous Mode</span>
                                        <span className={`text-[9px] ${activeTheme.isDark ? 'text-white/40' : 'text-black/40'}`}>Auto-conversation flow</span>
                                    </div>

                                </div>
                                <button
                                    onClick={() => setIsContinuousMode(!isContinuousMode)}
                                    className={`w-12 h-7 rounded-full transition-all p-1 ${isContinuousMode ? "bg-green-500" : activeTheme.isDark ? "bg-white/20" : "bg-black/20"}`}
                                >

                                    <motion.div
                                        animate={{ x: isContinuousMode ? 20 : 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className="w-5 h-5 bg-white rounded-full shadow-lg"
                                    />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Terminate Button - Enhanced */}
                <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(-1)}
                    className={`group flex items-center gap-3 px-8 py-4 ${activeTheme.card} ${activeTheme.border} border rounded-full backdrop-blur-xl transition-all`}
                >
                    <motion.div
                        whileHover={{ rotate: 90 }}
                        transition={{ duration: 0.2 }}
                    >
                        <FaTimes className="text-red-400" size={16} />
                    </motion.div>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${activeTheme.isDark ? 'text-white/70 group-hover:text-white/90' : 'text-black/70 group-hover:text-black/90'}`}>Terminate Link</span>

                </motion.button>
            </motion.div>

        </div>
    );
}
