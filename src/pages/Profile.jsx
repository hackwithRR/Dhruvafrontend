import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, linkWithCredential } from "firebase/auth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaArrowLeft, FaSave, FaSyncAlt, FaShieldAlt,
    FaChevronDown, FaLanguage, FaEye, FaEyeSlash, FaUserCircle,
    FaGraduationCap, FaBook, FaBolt, FaDice, FaKey, FaMars, FaVenus, FaGenderless, FaUpload, FaInfoCircle, FaExclamationTriangle,
    FaGlobe, FaCheck
} from "react-icons/fa";

// --- 🎨 THEME CONFIGS - All 20+ Themes ---
const themeConfigs = {
    DeepSpace: {
        primary: "#38bdf8", text: "#ffffff", sub: "#94a3b8",
        border: "#0c1b35", navBg: "#02040a", btnBg: "#0f172a",
        isDark: true, accentGlow: "rgba(56, 189, 248, 0.2)",
        card: "bg-[#0a0a0c] border-[#1d1d21] text-white",
        input: "bg-[#141417] border-[#2a2a2f] text-white focus:border-cyan-500",
        label: "text-cyan-400 bg-[#0a0a0c]",
        accent: "text-cyan-400",
        accentBg: "bg-cyan-500/10",
        accentBorder: "border-cyan-500",
        btnGradient: "from-[#6366f1] via-[#a855f7] to-[#6366f1]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    Sakura: {
        // 🌸 Light Cherry Blossom Theme
        primary: "#ff69b4", text: "#5c3a4a", sub: "#db7093",
        border: "#ffb6c1", navBg: "#fff0f5", btnBg: "#ffe4e1",
        isDark: false, accentGlow: "rgba(255, 182, 193, 0.3)",
        card: "bg-white border-[#ffb6c1] text-[#5c3a4a]",
        input: "bg-[#fff0f5] border-[#ffb6c1] text-[#5c3a4a] focus:border-pink-400",
        label: "text-pink-500 bg-white",
        accent: "text-pink-500",
        accentBg: "bg-pink-400/10",
        accentBorder: "border-pink-400",
        btnGradient: "from-[#ff69b4] via-[#ff1493] to-[#ff69b4]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },

    Cyberpunk: {
        primary: "#a855f7", text: "#ecfeff", sub: "#22d3ee",
        border: "#1e1b4b", navBg: "#050505", btnBg: "#0f172a",
        isDark: true, accentGlow: "rgba(168, 85, 247, 0.25)",
        card: "bg-[#0a0a0f] border-[#1e1b4b] text-white",
        input: "bg-[#141417] border-[#2a2a2f] text-white focus:border-purple-500",
        label: "text-purple-400 bg-[#0a0a0f]",
        accent: "text-cyan-400",
        accentBg: "bg-purple-500/10",
        accentBorder: "border-purple-500",
        btnGradient: "from-[#a855f7] via-[#06b6d4] to-[#a855f7]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    RoyalParchment: {
        primary: "#b45309", text: "#451a03", sub: "#92400e",
        border: "#fcd34d", navBg: "#fdf6e3", btnBg: "#fef3c7",
        isDark: false, accentGlow: "rgba(180, 83, 9, 0.15)",
        card: "bg-[#fffbeb] border-[#fcd34d] text-[#451a03]",
        input: "bg-white border-[#fcd34d] text-[#451a03] focus:border-amber-600",
        label: "text-amber-700 bg-white",
        accent: "text-amber-700",
        accentBg: "bg-amber-500/10",
        accentBorder: "border-amber-600",
        btnGradient: "from-[#b45309] via-[#d97706] to-[#b45309]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    Light: {
        primary: "#4f46e5", text: "#000000", sub: "#64748b",
        border: "#e2e8f0", navBg: "#fcfcf9", btnBg: "#f1f5f9",
        isDark: false, accentGlow: "rgba(79, 70, 229, 0.15)",
        card: "bg-white border-[#e2e8f0] text-[#0f172a]",
        input: "bg-white border-[#cbd5e1] text-[#0f172a] focus:border-indigo-600",
        label: "text-indigo-600 bg-white",
        accent: "text-indigo-600",
        accentBg: "bg-indigo-500/10",
        accentBorder: "border-indigo-600",
        btnGradient: "from-[#4f46e5] via-[#7c3aed] to-[#4f46e5]",
        warnGradient: "from-[#dc2626] via-[#ea580c] to-[#dc2626]",
        safeGradient: "from-[#059669] via-[#10b981] to-[#059669]"
    },
    MidnightAurora: {
        primary: "#34d399", text: "#ecfdf5", sub: "#6ee7b7",
        border: "#064e3b", navBg: "#010806", btnBg: "#06201b",
        isDark: true, accentGlow: "rgba(16, 185, 129, 0.25)",
        card: "bg-[#0a0a0c] border-[#064e3b] text-white",
        input: "bg-[#141417] border-[#1f2937] text-white focus:border-emerald-500",
        label: "text-emerald-400 bg-[#0a0a0c]",
        accent: "text-emerald-400",
        accentBg: "bg-emerald-500/10",
        accentBorder: "border-emerald-500",
        btnGradient: "from-[#10b981] via-[#34d399] to-[#10b981]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#059669] via-[#10b981] to-[#059669]"
    },
    SunsetDrift: {
        primary: "#fb923c", text: "#fff7ed", sub: "#fdba74",
        border: "#431407", navBg: "#0f0402", btnBg: "#2d0a05",
        isDark: true, accentGlow: "rgba(249, 115, 22, 0.25)",
        card: "bg-[#1a0503] border-[#431407] text-white",
        input: "bg-[#2d0a05] border-[#431407] text-white focus:border-orange-500",
        label: "text-orange-400 bg-[#1a0503]",
        accent: "text-orange-400",
        accentBg: "bg-orange-500/10",
        accentBorder: "border-orange-500",
        btnGradient: "from-[#f97316] via-[#fb923c] to-[#f97316]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    Phantom: {
        primary: "#ffffff", text: "#ffffff", sub: "#a3a3a3",
        border: "#262626", navBg: "#050505", btnBg: "#171717",
        isDark: true, accentGlow: "rgba(255, 255, 255, 0.1)",
        card: "bg-[#0a0a0a] border-[#262626] text-white",
        input: "bg-[#171717] border-[#262626] text-white focus:border-white",
        label: "text-white bg-[#0a0a0a]",
        accent: "text-gray-400",
        accentBg: "bg-white/10",
        accentBorder: "border-white",
        btnGradient: "from-[#525252] via-[#737373] to-[#525252]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    Solaris: {
        primary: "#facc15", text: "#fefce8", sub: "#eab308",
        border: "#422006", navBg: "#050401", btnBg: "#1c1917",
        isDark: true, accentGlow: "rgba(250, 204, 21, 0.2)",
        card: "bg-[#0a0901] border-[#422006] text-white",
        input: "bg-[#1c1917] border-[#422006] text-white focus:border-yellow-500",
        label: "text-yellow-400 bg-[#0a0901]",
        accent: "text-yellow-400",
        accentBg: "bg-yellow-500/10",
        accentBorder: "border-yellow-500",
        btnGradient: "from-[#facc15] via-[#fde047] to-[#facc15]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    Aero: {
        primary: "#cbd5e1", text: "#f8fafc", sub: "#94a3b8",
        border: "#334155", navBg: "#0f172a", btnBg: "#1e293b",
        isDark: true, accentGlow: "rgba(148, 163, 184, 0.2)",
        card: "bg-[#1e293b] border-[#334155] text-white",
        input: "bg-[#0f172a] border-[#334155] text-white focus:border-slate-400",
        label: "text-slate-400 bg-[#1e293b]",
        accent: "text-slate-300",
        accentBg: "bg-slate-500/10",
        accentBorder: "border-slate-400",
        btnGradient: "from-[#94a3b8] via-[#cbd5e1] to-[#94a3b8]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    Toxic: {
        primary: "#a3e635", text: "#f7fee7", sub: "#4d7c0f",
        border: "#14532d", navBg: "#020500", btnBg: "#1a2e05",
        isDark: true, accentGlow: "rgba(163, 230, 53, 0.25)",
        card: "bg-[#0a1202] border-[#14532d] text-white",
        input: "bg-[#1a2e05] border-[#14532d] text-white focus:border-lime-500",
        label: "text-lime-400 bg-[#0a1202]",
        accent: "text-lime-400",
        accentBg: "bg-lime-500/10",
        accentBorder: "border-lime-500",
        btnGradient: "from-[#a3e635] via-[#84cc16] to-[#a3e635]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    Synthwave: {
        primary: "#22d3ee", text: "#fff1f2", sub: "#ff0080",
        border: "#4c0519", navBg: "#120422", btnBg: "#2e1065",
        isDark: true, accentGlow: "rgba(34, 211, 238, 0.3)",
        card: "bg-[#1a0b2e] border-[#4c0519] text-white",
        input: "bg-[#2e1065] border-[#4c0519] text-white focus:border-cyan-500",
        label: "text-cyan-400 bg-[#1a0b2e]",
        accent: "text-pink-500",
        accentBg: "bg-cyan-500/10",
        accentBorder: "border-cyan-500",
        btnGradient: "from-[#22d3ee] via-[#e879f9] to-[#22d3ee]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    Coffee: {
        primary: "#d6c5bb", text: "#fafaf9", sub: "#a8a29e",
        border: "#292524", navBg: "#0c0a09", btnBg: "#1c1917",
        isDark: true, accentGlow: "rgba(214, 197, 187, 0.1)",
        card: "bg-[#1c1917] border-[#292524] text-white",
        input: "bg-[#0c0a09] border-[#292524] text-white focus:border-stone-400",
        label: "text-stone-400 bg-[#1c1917]",
        accent: "text-stone-300",
        accentBg: "bg-stone-500/10",
        accentBorder: "border-stone-400",
        btnGradient: "from-[#a8a29e] via-[#d6c5bb] to-[#a8a29e]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    RetroTerminal: {
        primary: "#22c55e", text: "#dcfce7", sub: "#15803d",
        border: "#052e16", navBg: "#0a0f0a", btnBg: "#062006",
        isDark: true, accentGlow: "rgba(34, 197, 94, 0.25)",
        card: "bg-[#0a120a] border-[#052e16] text-white",
        input: "bg-[#062006] border-[#052e16] text-white focus:border-green-500",
        label: "text-green-400 bg-[#0a120a]",
        accent: "text-green-400",
        accentBg: "bg-green-500/10",
        accentBorder: "border-green-500",
        btnGradient: "from-[#22c55e] via-[#4ade80] to-[#22c55e]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    Amethyst: {
        primary: "#c084fc", text: "#faf5ff", sub: "#7e22ce",
        border: "#3b0764", navBg: "#0d0214", btnBg: "#1e0a2d",
        isDark: true, accentGlow: "rgba(192, 132, 252, 0.25)",
        card: "bg-[#1e0a2d] border-[#3b0764] text-white",
        input: "bg-[#0d0214] border-[#3b0764] text-white focus:border-purple-400",
        label: "text-purple-400 bg-[#1e0a2d]",
        accent: "text-purple-300",
        accentBg: "bg-purple-500/10",
        accentBorder: "border-purple-400",
        btnGradient: "from-[#c084fc] via-[#a855f7] to-[#c084fc]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    Blueprint: {
        primary: "#ffffff", text: "#ffffff", sub: "#93c5fd",
        border: "rgba(255,255,255,0.3)", navBg: "#1e40af", btnBg: "#1e3a8a",
        isDark: true, accentGlow: "rgba(255, 255, 255, 0.15)",
        card: "bg-[#1e3a8a] border-[rgba(255,255,255,0.3)] text-white",
        input: "bg-[#1e40af] border-[rgba(255,255,255,0.3)] text-white focus:border-white",
        label: "text-white bg-[#1e3a8a]",
        accent: "text-blue-100",
        accentBg: "bg-white/10",
        accentBorder: "border-white",
        btnGradient: "from-[#60a5fa] via-[#93c5fd] to-[#60a5fa]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    Clay: {
        primary: "#44403c", text: "#1c1917", sub: "#78716c",
        border: "#d6d3d1", navBg: "#e5e5e1", btnBg: "#d1d1cc",
        isDark: false, accentGlow: "rgba(87, 83, 78, 0.1)",
        card: "bg-[#f5f5f4] border-[#d6d3d1] text-[#1c1917]",
        input: "bg-white border-[#d6d3d1] text-[#1c1917] focus:border-stone-600",
        label: "text-stone-600 bg-[#f5f5f4]",
        accent: "text-stone-700",
        accentBg: "bg-stone-500/10",
        accentBorder: "border-stone-600",
        btnGradient: "from-[#78716c] via-[#a8a29e] to-[#78716c]",
        warnGradient: "from-[#dc2626] via-[#ea580c] to-[#dc2626]",
        safeGradient: "from-[#059669] via-[#10b981] to-[#059669]"
    },
    Radioactive: {
        primary: "#000000", text: "#000000", sub: "#3f6212",
        border: "#000000", navBg: "#bef264", btnBg: "#a3e635",
        isDark: false, accentGlow: "rgba(0, 0, 0, 0.15)",
        card: "bg-[#d9f99d] border-black text-black",
        input: "bg-[#bef264] border-black text-black focus:border-black",
        label: "text-black bg-[#d9f99d]",
        accent: "text-lime-900",
        accentBg: "bg-black/10",
        accentBorder: "border-black",
        btnGradient: "from-[#000000] via-[#3f6212] to-[#000000]",
        warnGradient: "from-[#dc2626] via-[#ea580c] to-[#dc2626]",
        safeGradient: "from-[#059669] via-[#10b981] to-[#059669]"
    },
    CrimsonOLED: {
        primary: "#dc2626", text: "#ffffff", sub: "#7f1d1d",
        border: "#450a0a", navBg: "#000000", btnBg: "#1a1a1a",
        isDark: true, accentGlow: "rgba(220, 38, 38, 0.2)",
        card: "bg-[#0a0a0a] border-[#450a0a] text-white",
        input: "bg-[#1a1a1a] border-[#450a0a] text-white focus:border-red-600",
        label: "text-red-500 bg-[#0a0a0a]",
        accent: "text-red-500",
        accentBg: "bg-red-500/10",
        accentBorder: "border-red-600",
        btnGradient: "from-[#dc2626] via-[#ef4444] to-[#dc2626]",
        warnGradient: "from-[#f97316] via-[#fbbf24] to-[#f97316]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    Industrial: {
        primary: "#f97316", text: "#e5e5e5", sub: "#a3a3a3",
        border: "#404040", navBg: "#1c1c1c", btnBg: "#262626",
        isDark: true, accentGlow: "rgba(249, 115, 22, 0.2)",
        card: "bg-[#262626] border-[#404040] text-white",
        input: "bg-[#1c1c1c] border-[#404040] text-white focus:border-orange-500",
        label: "text-orange-400 bg-[#262626]",
        accent: "text-orange-400",
        accentBg: "bg-orange-500/10",
        accentBorder: "border-orange-500",
        btnGradient: "from-[#f97316] via-[#fb923c] to-[#f97316]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    MidnightSun: {
        primary: "#fbbf24", text: "#fdf4ff", sub: "#a855f7",
        border: "#4c1d95", navBg: "#1a0b2e", btnBg: "#2d1b4e",
        isDark: true, accentGlow: "rgba(251, 191, 36, 0.25)",
        card: "bg-[#2d1b4e] border-[#4c1d95] text-white",
        input: "bg-[#1a0b2e] border-[#4c1d95] text-white focus:border-amber-400",
        label: "text-amber-300 bg-[#2d1b4e]",
        accent: "text-amber-300",
        accentBg: "bg-amber-500/10",
        accentBorder: "border-amber-400",
        btnGradient: "from-[#fbbf24] via-[#f59e0b] to-[#fbbf24]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    }
};

const avatarStyles = ['bottts', 'avataaars', 'pixel-art', 'adventurer', 'big-smile', 'lorelei', 'notionists', 'personas'];

const languages = [
    { name: "English", type: "Global" },
    { name: "Hindi", type: "Native" }, { name: "Hinglish", type: "Hybrid" },
    { name: "Kannada", type: "Native" }, { name: "Kanglish", type: "Hybrid" },
    { name: "Tamil", type: "Native" }, { name: "Tanglish", type: "Hybrid" },
    { name: "Telugu", type: "Native" }, { name: "Tenglish", type: "Hybrid" },
    { name: "Malayalam", type: "Native" }, { name: "Manglish", type: "Hybrid" },
    { name: "Bengali", type: "Native" }, { name: "Benglish", type: "Hybrid" },
    { name: "Marathi", type: "Native" }, { name: "Marathish", type: "Hybrid" },
    { name: "Gujarati", type: "Native" }, { name: "Gujarish", type: "Hybrid" }
];

export default function Profile() {
    const { currentUser, userData, reloadUser, logout } = useAuth();
    const navigate = useNavigate();
    const auth = getAuth();

    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [passwords, setPasswords] = useState({ oldPass: "", newPass: "" });
    const [showErrorModal, setShowErrorModal] = useState(false);

    // Glassmorphism dropdown states
    const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
    const [classDropdownOpen, setClassDropdownOpen] = useState(false);
    const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

    // Refs for click outside
    const boardRef = useRef(null);
    const classRef = useRef(null);
    const languageRef = useRef(null);

    // Get current theme from userData
    const currentThemeKey = userData?.theme || "DeepSpace";
    const s = themeConfigs[currentThemeKey] || themeConfigs.DeepSpace;

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (boardRef.current && !boardRef.current.contains(event.target)) {
                setBoardDropdownOpen(false);
            }
            if (classRef.current && !classRef.current.contains(event.target)) {
                setClassDropdownOpen(false);
            }
            if (languageRef.current && !languageRef.current.contains(event.target)) {
                setLanguageDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [profileData, setProfileData] = useState({
        displayName: userData?.name || userData?.displayName || currentUser?.displayName || "",
        board: userData?.board || "CBSE",
        classLevel: userData?.classLevel || "10",
        language: userData?.language || "English",
        pfp: userData?.pfp || currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid}`,
        gender: userData?.gender || "other"
    });

    const hasPassword = currentUser?.providerData.some(p => p.providerId === 'password');

    // Sync local state when global userData changes
    useEffect(() => {
        if (userData) {
            setProfileData({
                displayName: userData.name || userData.displayName || currentUser?.displayName || "",
                board: userData.board || "CBSE",
                classLevel: userData.classLevel || "10",
                language: userData.language || "English",
                pfp: userData.pfp || currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid}`,
                gender: userData.gender || "other"
            });
        }
    }, [userData, currentUser]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) return toast.error("SOURCE TOO LARGE (MAX 10MB)");

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const SIZE = 400;
                canvas.width = SIZE;
                canvas.height = SIZE;
                const ctx = canvas.getContext("2d");
                const scale = Math.max(SIZE / img.width, SIZE / img.height);
                const x = (SIZE / 2) - (img.width / 2) * scale;
                const y = (SIZE / 2) - (img.height / 2) * scale;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.5);
                setProfileData({ ...profileData, pfp: compressedBase64 });
                toast.success("NEURAL IMAGE OPTIMIZED");
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const generateRandomAvatar = () => {
        const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
        const randomSeed = Math.random().toString(36).substring(7);
        setProfileData({ ...profileData, pfp: `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}` });
    };

    const handleSave = async () => {
        if (!profileData.displayName.trim()) return toast.error("ALIAS REQUIRED");

        setLoading(true);
        try {
            const userRef = doc(db, "users", currentUser.uid);

            await setDoc(userRef, {
                name: profileData.displayName,
                displayName: profileData.displayName,
                board: profileData.board,
                classLevel: profileData.classLevel,
                language: profileData.language,
                gender: profileData.gender,
                pfp: profileData.pfp,
                updatedAt: serverTimestamp()
            }, { merge: true });

            await updateProfile(auth.currentUser, {
                displayName: profileData.displayName,
                photoURL: profileData.pfp
            });

            if (reloadUser) await reloadUser();

            toast.success("CORE SYNCED", { icon: <FaBolt className="text-yellow-400" /> });

        } catch (e) {
            console.error(e);
            setShowErrorModal(true);
            toast.error("SYNC FAILED");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (!passwords.newPass) return toast.error("NEW KEY MISSING");
        setLoading(true);
        try {
            if (hasPassword) {
                const cred = EmailAuthProvider.credential(currentUser.email, passwords.oldPass);
                await reauthenticateWithCredential(auth.currentUser, cred);
                await updatePassword(auth.currentUser, passwords.newPass);
            } else {
                const credential = EmailAuthProvider.credential(currentUser.email, passwords.newPass);
                await linkWithCredential(auth.currentUser, credential);
            }
            toast.success("SECURITY UPDATED");
            setPasswords({ oldPass: "", newPass: "" });
            if (reloadUser) await reloadUser();
        } catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 pb-20`} style={{ backgroundColor: s.navBg }}>
            <Navbar userData={userData} />
            <ToastContainer position="top-right" theme={s.isDark ? 'dark' : 'light'} />

            {/* Error Modal */}
            <AnimatePresence>
                {showErrorModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className={`max-w-md w-full p-8 rounded-[40px] border-2 border-red-500/30 text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]`}
                            style={{ backgroundColor: s.navBg, borderColor: s.border }}>
                            <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-6" />
                            <h2 className="text-3xl font-black uppercase italic mb-4 tracking-tighter text-red-500">Sync_Overflow</h2>
                            <p className="text-[11px] opacity-60 leading-relaxed mb-8 uppercase tracking-widest" style={{ color: s.text }}>
                                The data packet is too large for the cloud. Please try a smaller image or use an avatar.
                            </p>
                            <button onClick={() => setShowErrorModal(false)} className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px]">
                                Try Again
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <main className="max-w-5xl mx-auto pt-10 sm:pt-20 px-4 relative z-10">
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-[40px] p-8 sm:p-14 border relative overflow-hidden ${s.card}`}>

                    <motion.button
                        whileHover={{ x: -5, backgroundColor: s.primary, color: s.isDark ? '#000' : '#fff' }}
                        onClick={() => navigate("/chat")}
                        className={`absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest z-30 transition-colors`}
                        style={{ borderColor: s.border, color: s.text }}
                    >
                        <FaArrowLeft /> Return_Hub
                    </motion.button>

                    <div className="flex flex-col items-center mt-12 mb-16">
                        <div className="relative group">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                                className="absolute -inset-6 border-2 border-dashed rounded-full"
                                style={{ borderColor: s.border }} />
                            <div className="relative p-2 rounded-[35%] bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 shadow-2xl">
                                <img src={profileData.pfp} className="w-32 h-32 sm:w-44 sm:h-44 rounded-[33%] object-cover bg-black border-4 border-black/40" alt="PFP" />
                                <div className="absolute -bottom-4 -right-2 flex gap-3">
                                    <label className="bg-white text-black p-4 rounded-2xl shadow-2xl border-[3px] border-black cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center justify-center">
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        <FaUpload className="text-xl" />
                                    </label>
                                    <motion.button whileHover={{ scale: 1.1, rotate: 180 }} onClick={generateRandomAvatar} className="bg-white text-black p-4 rounded-2xl shadow-2xl border-[3px] border-black">
                                        <FaDice className="text-xl" />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 flex items-center gap-2 text-[9px] font-black tracking-[0.3em] opacity-30 uppercase">
                            <FaInfoCircle style={{ color: s.primary }} /> Neural ID established | Class {profileData.classLevel}
                        </div>
                        <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter mt-4 uppercase" style={{ color: s.text }}>
                            User<span style={{ color: s.primary }}>.</span>Meta
                        </h1>
                    </div>

                    <div className="space-y-12">
                        {/* Name Input */}
                        <div className="relative group">
                            <span className={`absolute -top-2.5 left-6 px-2 py-0.5 text-[10px] font-black uppercase rounded-md z-20 border tracking-widest ${s.label}`}>Neural Alias</span>
                            <div className={`absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-40 ${s.accent}`}><FaUserCircle /></div>
                            <input type="text" value={profileData.displayName} onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                className={`w-full p-6 pl-14 rounded-2xl border-2 outline-none font-bold text-lg transition-all ${s.input}`} />
                        </div>

                        {/* Gender Selection Grid */}
                        <div className="relative">
                            <span className={`absolute -top-3 left-6 px-3 py-1 text-[9px] font-black uppercase rounded-full z-20 border tracking-widest ${s.label}`}>Orientation_Key</span>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: 'male', label: 'MALE', icon: <FaMars /> },
                                    { id: 'female', label: 'FEMALE', icon: <FaVenus /> },
                                    { id: 'other', label: 'NEUTRAL', icon: <FaGenderless /> }
                                ].map((g) => (
                                    <button key={g.id} type="button" onClick={() => setProfileData({ ...profileData, gender: g.id })}
                                        className={`flex flex-col items-center justify-center py-6 rounded-3xl border-2 transition-all 
                                        ${profileData.gender === g.id ? `${s.accentBg} ${s.accentBorder} text-white shadow-[0_0_20px_${s.accentGlow}]` : 'bg-transparent opacity-30'}`}
                                        style={{ borderColor: s.border }}
                                    >
                                        <span className="text-2xl mb-2">{g.icon}</span>
                                        <span className="font-black text-[9px] tracking-widest">{g.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Board & Class Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Board Dropdown */}
                            <div className="relative group" ref={boardRef}>
                                <span className={`absolute -top-2.5 left-6 px-2 py-0.5 text-[9px] font-black uppercase rounded-md z-20 border tracking-widest ${s.label}`}>Curriculum</span>
                                <FaBook className={`absolute left-6 top-1/2 -translate-y-1/2 text-lg opacity-40 pointer-events-none z-10 ${s.accent}`} />
                                <button
                                    type="button"
                                    onClick={() => { setBoardDropdownOpen(!boardDropdownOpen); setClassDropdownOpen(false); setLanguageDropdownOpen(false); }}
                                    className={`w-full p-6 pl-14 rounded-2xl border-2 outline-none font-black cursor-pointer transition-all flex items-center justify-between ${s.input} ${boardDropdownOpen ? s.accentBorder : ''}`}
                                    style={boardDropdownOpen ? { boxShadow: `0 0 20px ${s.accentGlow}` } : {}}
                                >
                                    <span>{profileData.board}</span>
                                    <motion.div animate={{ rotate: boardDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="opacity-40">
                                        <FaChevronDown size={14} />
                                    </motion.div>
                                </button>

                                <AnimatePresence>
                                    {boardDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className={`absolute top-full left-0 right-0 mt-2 py-2 rounded-2xl border-2 z-50 overflow-hidden backdrop-blur-xl ${s.card}`}
                                            style={{ boxShadow: `0 0 30px ${s.accentGlow}` }}
                                        >
                                            {['CBSE', 'ICSE'].map((board) => (
                                                <button
                                                    key={board}
                                                    type="button"
                                                    onClick={() => { setProfileData({ ...profileData, board }); setBoardDropdownOpen(false); }}
                                                    className={`w-full px-6 py-3 text-left font-black text-sm flex items-center justify-between transition-all`}
                                                    style={{ color: profileData.board === board ? s.primary : s.text }}
                                                >
                                                    <span>{board}</span>
                                                    {profileData.board === board && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: s.primary }}>
                                                            <FaCheck size={12} />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Class Level Dropdown */}
                            <div className="relative group" ref={classRef}>
                                <span className={`absolute -top-2.5 left-6 px-2 py-0.5 text-[9px] font-black uppercase rounded-md z-20 border tracking-widest ${s.label}`}>Neural_Level</span>
                                <FaGraduationCap className={`absolute left-6 top-1/2 -translate-y-1/2 text-lg opacity-40 pointer-events-none z-10 ${s.accent}`} />
                                <button
                                    type="button"
                                    onClick={() => { setClassDropdownOpen(!classDropdownOpen); setBoardDropdownOpen(false); setLanguageDropdownOpen(false); }}
                                    className={`w-full p-6 pl-14 rounded-2xl border-2 outline-none font-black cursor-pointer transition-all flex items-center justify-between ${s.input} ${classDropdownOpen ? s.accentBorder : ''}`}
                                    style={classDropdownOpen ? { boxShadow: `0 0 20px ${s.accentGlow}` } : {}}
                                >
                                    <span>Class {profileData.classLevel}</span>
                                    <motion.div animate={{ rotate: classDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="opacity-40">
                                        <FaChevronDown size={14} />
                                    </motion.div>
                                </button>

                                <AnimatePresence>
                                    {classDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className={`absolute top-full left-0 right-0 mt-2 py-2 rounded-2xl border-2 z-50 overflow-hidden max-h-[300px] overflow-y-auto backdrop-blur-xl ${s.card}`}
                                            style={{ boxShadow: `0 0 30px ${s.accentGlow}` }}
                                        >
                                            {['8', '9', '10', '11', '12'].map((n) => (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => { setProfileData({ ...profileData, classLevel: n }); setClassDropdownOpen(false); }}
                                                    className={`w-full px-6 py-3 text-left font-black text-sm flex items-center justify-between transition-all`}
                                                    style={{ color: profileData.classLevel === n ? s.primary : s.text }}
                                                >
                                                    <span>Class {n}</span>
                                                    {profileData.classLevel === n && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: s.primary }}>
                                                            <FaCheck size={12} />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Language Selection */}
                        <div className="relative mt-4" ref={languageRef}>
                            <span className={`absolute -top-3 left-6 px-3 py-1 text-[9px] font-black uppercase rounded-full z-20 border tracking-widest ${s.label}`}>Language_Linguistics</span>

                            <button
                                type="button"
                                onClick={() => { setLanguageDropdownOpen(!languageDropdownOpen); setBoardDropdownOpen(false); setClassDropdownOpen(false); }}
                                className={`w-full p-4 rounded-[35px] border-2 transition-all flex items-center justify-between ${languageDropdownOpen ? `${s.accentBorder} ${s.accentBg}` : ''}`}
                                style={{ borderColor: s.border, backgroundColor: languageDropdownOpen ? s.btnBg : 'transparent' }}
                            >
                                <div className="flex items-center gap-3 px-2">
                                    <FaGlobe style={{ color: profileData.language ? s.primary : undefined, opacity: profileData.language ? 1 : 0.3 }} />
                                    <span className="font-black text-sm" style={{ color: profileData.language ? s.text : undefined, opacity: profileData.language ? 1 : 0.3 }}>
                                        {profileData.language || 'Select Language'}
                                    </span>
                                </div>
                                <motion.div animate={{ rotate: languageDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ opacity: 0.4, color: s.text }}>
                                    <FaChevronDown size={14} />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {languageDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className={`absolute top-full left-0 right-0 mt-2 p-4 rounded-[25px] border-2 z-50 max-h-[350px] overflow-y-auto backdrop-blur-xl ${s.card}`}
                                        style={{ boxShadow: `0 0 40px ${s.accentGlow}` }}
                                    >
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {languages.map((lang) => (
                                                <button key={lang.name} type="button" onClick={() => { setProfileData({ ...profileData, language: lang.name }); setLanguageDropdownOpen(false); }}
                                                    className={`p-3 rounded-xl border-2 transition-all text-left relative overflow-hidden ${profileData.language === lang.name ? `${s.accentBorder} ${s.accentBg}` : ''}`}
                                                    style={{ borderColor: profileData.language === lang.name ? s.primary : s.border, backgroundColor: profileData.language === lang.name ? s.btnBg : s.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black tracking-tight" style={{ color: profileData.language === lang.name ? s.primary : s.text }}>
                                                            {lang.name}
                                                        </span>
                                                        <span className="text-[7px] font-bold uppercase tracking-widest" style={{ opacity: 0.5, color: profileData.language === lang.name ? s.sub : s.text }}>
                                                            {lang.type}
                                                        </span>
                                                    </div>
                                                    {profileData.language === lang.name && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`absolute top-1 right-1 ${s.accent}`}>
                                                            <FaCheck size={10} />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.button
                            onClick={handleSave} disabled={loading}
                            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            style={{ backgroundSize: "200% 200%", backgroundColor: s.primary, color: s.isDark ? '#000' : '#fff' }}
                            className={`w-full py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.5em] shadow-2xl flex items-center justify-center gap-4 bg-gradient-to-r ${s.btnGradient}`}
                        >
                            {loading ? <FaSyncAlt className="animate-spin" /> : <FaSave className="text-xl" />} Initialize_Sync
                        </motion.button>
                    </div>

                    {/* Security */}
                    <div className="mt-32 pt-16 border-t" style={{ borderColor: s.border }}>
                        <div className="flex items-center gap-4 mb-10">
                            <div className={`p-3 rounded-xl ${hasPassword ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                <FaShieldAlt className="text-2xl" />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40" style={{ color: s.text }}>Security_Protocol</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6 max-w-xl mx-auto">
                            {hasPassword && (
                                <input type="password" placeholder="CURRENT ACCESS KEY" value={passwords.oldPass} onChange={(e) => setPasswords({ ...passwords, oldPass: e.target.value })}
                                    className={`w-full p-6 rounded-2xl border-2 outline-none font-black text-[11px] tracking-widest ${s.input}`} />
                            )}
                            <div className="relative">
                                <input type={showPass ? "text" : "password"} placeholder={hasPassword ? "NEW SECURITY HASH" : "INITIALIZE NEW KEY"} value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                                    className={`w-full p-6 rounded-2xl border-2 outline-none font-black text-[11px] tracking-widest ${s.input}`} />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity" style={{ color: s.text }}>
                                    {showPass ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                                </button>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                onClick={handlePasswordUpdate} disabled={loading}
                                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                style={{ backgroundSize: "200% 200%" }}
                                className={`w-full py-6 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 bg-gradient-to-r ${hasPassword ? s.warnGradient : s.safeGradient}`}
                            >
                                {loading ? <FaSyncAlt className="animate-spin" /> : <FaKey />} {hasPassword ? "Rotate_Keys" : "Establish_Node"}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
