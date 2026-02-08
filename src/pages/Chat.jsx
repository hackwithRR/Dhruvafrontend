import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane,
    FaHeadphones,
    FaMedal,
    FaTrophy
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";

/* ================= CONFIG ================= */

const API_BASE = (process.env.REACT_APP_API_URL ||
    "https://dhruva-backend-production.up.railway.app"
).replace(/\/$/, "");

/* ================= THEMES ================= */

const themes = {
    DeepSpace: {
        bg: "bg-[#050505]",
        text: "text-white",
        card: "bg-white/[0.03]",
        border: "border-white/10",
        isDark: true
    },
    Light: {
        bg: "bg-[#f8fafc]",
        text: "text-slate-900",
        card: "bg-white shadow-md",
        border: "border-slate-200",
        isDark: false
    }
};

/* ================= COMPONENT ================= */

export default function Chat() {
    const { currentUser } = useAuth();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [theme, setTheme] = useState("DeepSpace");

    const [leaderboard, setLeaderboard] = useState([]);

    /* Voice states */
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);
    const messagesEndRef = useRef(null);

    const activeTheme = themes[theme];

    /* ================= LEADERBOARD ================= */

    useEffect(() => {
        const q = query(
            collection(db, "users"),
            orderBy("xp", "desc"),
            limit(5)
        );

        const unsub = onSnapshot(q, snap => {
            setLeaderboard(
                snap.docs.map(d => ({ id: d.id, ...d.data() }))
            );
        });

        return () => unsub();
    }, []);

    /* ================= UTILITIES ================= */

    const triggerHaptic = () => {
        if (navigator.vibrate) navigator.vibrate(10);
    };

    const getMaleVoice = () => {
        const voices = synthesisRef.current.getVoices();
        return (
            voices.find(v => v.lang === "en-IN") ||
            voices.find(v => v.lang.startsWith("en")) ||
            voices[0]
        );
    };

    /* ================= VOICE ================= */

    const startListening = () => {
        if (!isLiveMode || isAiSpeaking) return;

        const Speech =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Speech) return;

        recognitionRef.current = new Speech();
        recognitionRef.current.lang = "en-IN";
        recognitionRef.current.continuous = true;

        recognitionRef.current.onstart = () => setIsListening(true);

        recognitionRef.current.onresult = e => {
            const t = e.results[e.results.length - 1][0].transcript.trim();
            if (t) sendMessage(t);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
            if (isLiveMode && !isAiSpeaking)
                setTimeout(startListening, 500);
        };

        recognitionRef.current.start();
    };

    const speak = text => {
        synthesisRef.current.cancel();
        recognitionRef.current?.stop();

        const utter = new SpeechSynthesisUtterance(text);
        utter.voice = getMaleVoice();
        utter.rate = 0.95;

        utter.onstart = () => setIsAiSpeaking(true);
        utter.onend = () => {
            setIsAiSpeaking(false);
            if (isLiveMode) startListening();
        };

        synthesisRef.current.speak(utter);
    };

    const toggleLiveMode = () => {
        if (isLiveMode) {
            setIsLiveMode(false);
            synthesisRef.current.cancel();
            recognitionRef.current?.stop();
        } else {
            setIsLiveMode(true);
            const intro = new SpeechSynthesisUtterance(
                "Neural link established. Speak now."
            );
            intro.voice = getMaleVoice();
            intro.onend = startListening;
            synthesisRef.current.speak(intro);
        }
    };

    /* ================= CHAT ================= */

    const sendMessage = async text => {
        if (!text.trim()) return;
        triggerHaptic();

        setMessages(m => [...m, { role: "user", content: text }]);
        setInput("");

        try {
            const res = await axios.post(`${API_BASE}/chat`, {
                userId: currentUser?.uid,
                message: text
            });

            setMessages(m => [...m, { role: "ai", content: res.data.reply }]);
            if (isLiveMode) speak(res.data.reply);
        } catch {
            toast.error("Connection lost");
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const ringState = isAiSpeaking ? "ai" : isListening ? "user" : "idle";

    /* ================= UI ================= */

    return (
        <div className={`h-screen w-full ${activeTheme.bg} ${activeTheme.text}`}>
            <ToastContainer theme={activeTheme.isDark ? "dark" : "light"} />

            <Navbar />

            <div className="flex h-full max-w-6xl mx-auto px-6">

                {/* CHAT */}
                <div className="flex flex-col flex-1 py-6">
                    <div className="flex-1 overflow-y-auto space-y-6">
                        {messages.map((m, i) => (
                            <div key={i} className={m.role === "user" ? "text-right" : ""}>
                                <div
                                    className={`inline-block p-4 rounded-2xl ${
                                        m.role === "user"
                                            ? "bg-indigo-600 text-white"
                                            : activeTheme.card
                                    }`}
                                >
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* INPUT */}
                    <div className="mt-4 flex gap-2">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage(input);
                                }
                            }}
                            className="flex-1 p-4 rounded-2xl bg-white/10 resize-none"
                        />

                        <button
                            onClick={toggleLiveMode}
                            className={`p-4 rounded-full ${
                                isLiveMode ? "bg-indigo-600" : "bg-white/10"
                            }`}
                        >
                            <FaHeadphones />
                        </button>

                        <button
                            onClick={() => sendMessage(input)}
                            className="p-4 rounded-full bg-indigo-600 text-white"
                        >
                            <FaPaperPlane />
                        </button>
                    </div>

                    {/* AVATAR */}
                    <motion.div
                        animate={{
                            scale:
                                ringState === "ai"
                                    ? [1, 1.08, 1]
                                    : ringState === "user"
                                    ? [1, 1.04, 1]
                                    : 1
                        }}
                        transition={{ repeat: Infinity, duration: 1.4 }}
                        className="mx-auto mt-6 w-40 h-40 rounded-full border"
                    />
                </div>

                {/* 🏆 LEADERBOARD */}
                <div className="hidden md:block w-72 py-6 pl-6">
                    <div className={`p-5 rounded-2xl ${activeTheme.card}`}>
                        <h3 className="text-sm font-black uppercase flex items-center gap-2 mb-4">
                            <FaTrophy /> Top Scholars
                        </h3>

                        {leaderboard.map((u, i) => (
                            <div
                                key={u.id}
                                className="flex justify-between items-center py-2 text-xs"
                            >
                                <span className="flex items-center gap-2">
                                    <FaMedal className={i === 0 ? "text-yellow-400" : "opacity-40"} />
                                    {u.displayName || "Anonymous"}
                                </span>
                                <span className="font-bold">{u.xp || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
