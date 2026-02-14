import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaTimes, FaMicrophone, FaVolumeUp, FaBrain, FaStop,
    FaWifi, FaChevronDown, FaBolt, FaMagic, FaRobot, FaSignal, FaChartLine
} from "react-icons/fa";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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
        blob1: "bg-rose-600/20",
        blob2: "bg-pink-600/20",
        grid: "rgba(244, 63, 94, 0.05)",
        scan: "via-rose-500/20",
        glow: "rgba(244, 63, 94, 0.15)"
    },
    Cyberpunk: {
        blob1: "bg-cyan-600/20",
        blob2: "bg-fuchsia-600/20",
        grid: "rgba(6, 182, 212, 0.05)",
        scan: "via-cyan-500/30",
        glow: "rgba(6, 182, 212, 0.15)"
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
        bg: "bg-[#1a0f12]",
        hex: "#1a0f12",
        primary: "rose-500",
        primaryHex: "#f43f5e",
        primaryLight: "#fb7185",
        accent: "text-rose-400",
        text: "text-rose-50",
        card: "bg-rose-950/20",
        border: "border-rose-500/20",
        isDark: true,
        glow: "rgba(244, 63, 94, 0.4)"
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
    }
};

const API_BASE = "https://dhruva-backend-production.up.railway.app";

const MODE = {
    IDLE: "idle",
    LISTENING: "listening",
    PROCESSING: "processing",
    SPEAKING: "speaking",
    ERROR: "error"
};

// Subtle floating particle component
const Particle = ({ theme }) => {
    const randomX = Math.random() * 100;
    const randomDelay = Math.random() * 8;
    const randomDuration = 8 + Math.random() * 6;
    const randomSize = 1 + Math.random() * 2;

    return (
        <motion.div
            initial={{ x: `${randomX}vw`, y: "110vh", opacity: 0 }}
            animate={{ y: "-10vh", opacity: [0, 0.3, 0] }}
            transition={{ duration: randomDuration, delay: randomDelay, repeat: Infinity, ease: "linear" }}
            className="absolute rounded-full"
            style={{
                width: randomSize,
                height: randomSize,
                left: `${randomX}%`,
                backgroundColor: theme.primaryHex,
                opacity: 0.3,
                filter: "blur(1px)"
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
            setStatus("Anthariksh is speaking...");
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
            // Auto-restart listening in continuous mode - increased delay to 1500ms
            if (isContinuousMode) {
                setTimeout(() => {
                    if (!speakingRef.current) {
                        startListeningRef.current(true);
                    }
                }, 1500);
            }
        };

        utterance.onerror = () => {
            speakingRef.current = false;
            setAppState(MODE.IDLE);
            setIsSpeaking(false);
            setStatus("Ready");
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

                const systemInstruction = `
ROLE: You are Anthariksh, a super-friendly AI tutor for Class ${userClass} (${userBoard} Board). 
Your student's name is ${userName}. 
Subject: ${subject}, Chapter: ${chapter}, Mode: Live Voice Conversation
Use ${userLang} language. Be brief, conversational, end with a question.
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
                    const res = await axios.post(`${API_BASE}/chat`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        timeout: 30000
                    });

                    // Add AI response to conversation history
                    const updatedHistory = getSessionHistory();
                    updatedHistory.push({ role: "assistant", content: res.data.reply });

                    // Keep history manageable - limit to last 10 exchanges (20 messages)
                    if (updatedHistory.length > 20) {
                        updatedHistory.splice(0, updatedHistory.length - 20);
                    }

                    conversationHistoryRef.current = updatedHistory;
                    setSessionHistory(updatedHistory);

                    speak(res.data.reply, true);

                } catch (err) {
                    console.error("API Error:", err);
                    // Note: User message is already in history, so next attempt will have context
                    setStatus("Connection Error");
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
            // Cleanup if needed
        };

        try {
            recognitionRef.current.start();
            return true;
        } catch (err) {
            console.error("Failed to start recognition:", err);
            return false;
        }
    }, [subject, chapter, speak, isContinuousMode, userClass, userBoard, userName, currentUser, userLang]);

    const handleStartListening = useCallback(() => {
        synthesisRef.current.cancel();
        startListening(false);
    }, [startListening]);

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
            if (!hasGreeted) {
                sessionStorage.setItem('liveMode_hasGreeted', 'true');
                hasGreetedRef.current = true;
                const intro = `Namaste ${userName}! Main Anthariksh hoon, aapka AI tutor. ${subject} ke baare mein kya jaanne chahte ho?`;
                speakRef.current(intro);
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
            case MODE.ERROR: return { color: "#f87171", glow: "rgba(248, 113, 113, 0.5)", icon: <FaTimes /> };
            default: return { color: activeTheme.isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)", glow: "transparent", icon: <FaMagic /> };
        }
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

    const getOrbAnimation = () => {
        if (appState === MODE.SPEAKING) return { scale: [1, 1.1, 1] };
        if (appState === MODE.LISTENING) return { scale: [1, 1.05, 1] };
        if (appState === MODE.PROCESSING) return { scale: [1, 1.06, 1] };
        return { scale: 1 };
    };

    const statusStyle = getStatusColor();

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

            {/* Subtle Floating Particles - Increased to 15 */}
            {[...Array(15)].map((_, i) => (
                <Particle key={i} theme={activeTheme} />
            ))}

            {/* Header - Clean and Modern */}
            <div className="w-full max-w-2xl mx-auto pt-6 px-4 relative z-10">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <motion.h1
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className={`text-3xl md:text-4xl font-black tracking-tight uppercase ${activeTheme.text}`}
                        >
                            {subject}
                        </motion.h1>
                        <p className={`text-[9px] font-bold uppercase tracking-[0.4em] mt-2 ${activeTheme.accent} flex items-center gap-2`}>
                            <motion.span
                                animate={{ rotate: [0, 360] }}
                                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                            >
                                <FaBolt size={10} />
                            </motion.span>
                            Neural Link Active
                        </p>
                    </div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${activeTheme.card} ${activeTheme.border} border`}
                    >
                        <motion.div
                            animate={{
                                scale: connectionStatus === "connected" ? [1, 1.15, 1] : 1,
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-2 h-2 rounded-full"
                            style={{
                                backgroundColor: connectionStatus === "connected" ? "#22c55e" : connectionStatus === "error" ? "#f87171" : "#fbbf24",
                            }}
                        />
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/50">
                            {connectionStatus}
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* Main Visualizer Area */}
            <div className="relative flex flex-col items-center justify-center flex-1 px-4">

                {/* Transcript Display - Shows when listening */}
                <AnimatePresence>
                    {appState === MODE.LISTENING && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-0 w-full max-w-lg mx-auto z-20"
                        >
                            <div className={`${activeTheme.card} ${activeTheme.border} border rounded-3xl p-6 backdrop-blur-xl`}>
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
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
                                    className={`text-center text-lg md:text-xl font-bold ${activeTheme.text} min-h-[40px] flex items-center justify-center`}
                                >
                                    {liveTranscript ? (
                                        <span>{liveTranscript}</span>
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

                {/* Outer pulsing glow */}
                <motion.div
                    animate={{
                        scale: appState === MODE.SPEAKING ? [1, 1.2, 1] : appState === MODE.LISTENING ? [1, 1.15, 1] : 1,
                        opacity: appState === MODE.IDLE ? 0.2 : 0.5
                    }}
                    transition={{ repeat: Infinity, duration: appState === MODE.IDLE ? 4 : 2 }}
                    className="absolute w-72 h-72 md:w-80 md:h-80 rounded-full blur-[60px]"
                    style={{
                        backgroundColor: activeTheme.primaryHex,
                        opacity: 0.25
                    }}
                />

                {/* Rotating ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: appState === MODE.IDLE ? 25 : 10, ease: "linear" }}
                    className="absolute w-64 h-64 md:w-72 md:h-72 rounded-full border border-dashed"
                    style={{
                        borderColor: statusStyle.color,
                        opacity: 0.4
                    }}
                />

                {/* Inner orb - Enhanced for all states */}
                <motion.div
                    animate={getOrbAnimation()}
                    transition={{ repeat: Infinity, duration: appState === MODE.IDLE ? 4 : 1.5, ease: "easeInOut" }}
                    className={`relative w-40 h-40 md:w-56 md:h-56 rounded-full ${activeTheme.card} border-2 z-10`}
                    style={{
                        borderColor: statusStyle.color,
                        boxShadow: `0 0 60px ${statusStyle.glow}, inset 0 0 30px ${statusStyle.glow}`
                    }}
                >
                    {/* Inner gradient overlay */}
                    <div
                        className="absolute inset-2 rounded-full opacity-30"
                        style={{ backgroundColor: activeTheme.primaryHex }}
                    />

                    {/* Audio Bars */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-1 items-end h-14">
                            {renderAudioBars()}
                        </div>
                    </div>

                    {/* Center Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={appState === MODE.LISTENING ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 1 }}
                        >
                            {appState === MODE.LISTENING ? (
                                <FaMicrophone className="text-3xl" style={{ color: "#22d3ee" }} />
                            ) : appState === MODE.SPEAKING ? (
                                <FaVolumeUp className="text-3xl" style={{ color: activeTheme.primaryHex }} />
                            ) : appState === MODE.PROCESSING ? (
                                <FaBrain className="text-3xl text-amber-400 animate-pulse" />
                            ) : (
                                <FaMagic className="text-3xl" style={{ color: activeTheme.primaryHex }} />
                            )}
                        </motion.div>
                    </div>
                </motion.div>

                {/* Status text */}
                <motion.div
                    key={status}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 text-center"
                >
                    <p className="text-sm font-bold uppercase tracking-widest" style={{ color: statusStyle.color }}>
                        {status}
                    </p>
                    {lastTranscript && appState !== MODE.LISTENING && appState !== MODE.PROCESSING && (
                        <p className={`text-[10px] mt-2 max-w-xs truncate ${activeTheme.isDark ? 'text-white/25' : 'text-black/30'}`}>
                            "{lastTranscript}"
                        </p>
                    )}
                </motion.div>
            </div>

            {/* Bottom Controls - Modern and Clean */}
            <div className="w-full max-w-md mx-auto pb-8 px-4 flex flex-col items-center gap-5 z-10">
                <div className="flex items-center gap-4">
                    {/* Stop Button */}
                    {isSpeaking && (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={stopSpeaking}
                            className="p-4 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all"
                        >
                            <FaStop size={16} />
                        </motion.button>
                    )}

                    {/* Main Microphone Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStartListening}
                        disabled={appState === MODE.PROCESSING}
                        className="p-6 rounded-full transition-all relative overflow-hidden"
                        style={{
                            background: appState === MODE.LISTENING
                                ? `linear-gradient(135deg, #22d3ee55, #22d3ee55)`
                                : appState === MODE.PROCESSING
                                    ? "rgba(251, 191, 36, 0.2)"
                                    : `linear-gradient(135deg, ${activeTheme.primaryHex}, ${activeTheme.primaryLight})`,
                            border: appState === MODE.LISTENING
                                ? "2px solid #22d3ee"
                                : appState === MODE.PROCESSING
                                    ? "2px solid #fbbf24"
                                    : "none",
                            boxShadow: `0 0 30px ${appState === MODE.LISTENING ? 'rgba(34, 211, 238, 0.5)' : activeTheme.glow}`,
                            cursor: appState === MODE.PROCESSING ? "not-allowed" : "pointer"
                        }}
                    >
                        {appState === MODE.LISTENING ? (
                            <div className="w-5 h-5 rounded-full bg-cyan-400" />
                        ) : appState === MODE.PROCESSING ? (
                            <FaBrain className="text-amber-400 animate-pulse" size={20} />
                        ) : (
                            <FaMicrophone size={20} className="text-white" />
                        )}
                    </motion.button>

                    {/* Settings Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowControls(!showControls)}
                        className={`p-4 rounded-full ${activeTheme.card} ${activeTheme.border} border text-white/60 hover:text-white hover:bg-white/10 transition-all`}
                    >
                        {showControls ? <FaChevronDown size={16} /> : <FaChartLine size={16} />}
                    </motion.button>
                </div>

                {/* Expandable Controls */}
                <AnimatePresence>
                    {showControls && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`w-full ${activeTheme.card} ${activeTheme.border} border rounded-2xl p-4 space-y-4`}
                        >
                            {/* Continuous Mode Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FaWifi className={isContinuousMode ? "text-green-400" : "text-white/40"} size={12} />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/80">Continuous Mode</span>
                                </div>
                                <button
                                    onClick={() => setIsContinuousMode(!isContinuousMode)}
                                    className={`w-11 h-6 rounded-full transition-all ${isContinuousMode ? "bg-green-500" : "bg-white/20"}`}
                                >
                                    <motion.div
                                        animate={{ x: isContinuousMode ? 22 : 2 }}
                                        className="w-5 h-5 bg-white rounded-full shadow-lg"
                                    />
                                </button>
                            </div>
                            <p className="text-[9px] text-white/40">
                                {isContinuousMode
                                    ? "Auto-listens after AI finishes speaking. Like real conversation."
                                    : "Manually start listening each time. More control."}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Terminate Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(-1)}
                    className={`group flex items-center gap-3 px-6 py-3 ${activeTheme.card} ${activeTheme.border} border rounded-full hover:bg-red-500/20 hover:border-red-500/40 transition-all`}
                >
                    <FaTimes className="group-hover:rotate-90 transition-transform text-white/60" size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white/80">Terminate Link</span>
                </motion.button>
            </div>
        </div>
    );
}
