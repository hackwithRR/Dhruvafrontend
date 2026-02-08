import React, { useEffect, useState, useRef, useMemo } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane, FaTimes, FaImage, FaHistory, FaYoutube, FaTrash,
    FaTrophy, FaChevronLeft, FaHeadphones, FaChartLine,
    FaLayerGroup, FaClock, FaSignOutAlt, FaMedal, FaBrain
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import {
    doc, setDoc, collection, query, updateDoc, increment,
    onSnapshot, orderBy, limit, deleteDoc
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

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
    Aurora: {
        bg: "bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]",
        text: "text-emerald-50",
        card: "bg-emerald-900/20",
        border: "border-emerald-500/20",
        isDark: true
    },
    Cyberpunk: {
        bg: "bg-[#0a0a0f]",
        text: "text-cyan-50",
        card: "bg-cyan-950/20",
        border: "border-cyan-500/20",
        isDark: true
    },
    Matrix: {
        bg: "bg-black",
        text: "text-green-400",
        card: "bg-green-950/20",
        border: "border-green-500/20",
        isDark: true
    },
    Sunset: {
        bg: "bg-gradient-to-br from-[#ff512f] to-[#dd2476]",
        text: "text-white",
        card: "bg-white/10",
        border: "border-white/20",
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
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [theme, setTheme] = useState("DeepSpace");

    /* Voice states */
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);
    const messagesEndRef = useRef(null);

    const activeTheme = themes[theme];

/* ================= UTILITIES ================= */

const triggerHaptic = (type = "tap") => {
    if (!navigator.vibrate) return;
    if (type === "ai") navigator.vibrate([30, 40, 30]);
    else if (type === "listen") navigator.vibrate(15);
    else navigator.vibrate(10);
};

const getMaleVoice = () => {
    const voices = synthesisRef.current.getVoices();
    return (
        voices.find(v =>
            v.lang === "en-IN" &&
            (v.name.toLowerCase().includes("google") ||
             v.name.toLowerCase().includes("male"))
        ) ||
        voices.find(v => v.lang === "en-IN") ||
        voices[0]
    );
};

const detectEmotion = (text = "") => {
    const t = text.toLowerCase();
    if (t.includes("excellent") || t.includes("great")) return "excited";
    if (t.includes("mistake") || t.includes("wrong")) return "serious";
    if (t.includes("calm") || t.includes("easy")) return "calm";
    if (t.includes("important")) return "firm";
    return "neutral";
};

/* ================= VOICE ENGINE ================= */

const startListening = () => {
    if (!isLiveMode || isAiSpeaking) return;

    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return toast.error("Speech not supported");

    recognitionRef.current = new Speech();
    recognitionRef.current.lang = "en-IN";
    recognitionRef.current.continuous = true;

    recognitionRef.current.onstart = () => {
        setIsListening(true);
        triggerHaptic("listen");
    };

    recognitionRef.current.onresult = (e) => {
        const text = e.results[e.results.length - 1][0].transcript.trim();
        if (text) sendMessage(text);
    };

    recognitionRef.current.onend = () => {
        setIsListening(false);
        if (isLiveMode && !isAiSpeaking)
            setTimeout(startListening, 600);
    };

    recognitionRef.current.start();
};

const speak = (text) => {
    synthesisRef.current.cancel();
    recognitionRef.current?.stop();

    const clean = text.replace(/[*#_~]/g, "");
    const emotion = detectEmotion(clean);

    const utter = new SpeechSynthesisUtterance(clean);
    utter.voice = getMaleVoice();

    if (emotion === "excited") { utter.rate = 1.05; utter.pitch = 1.15; }
    else if (emotion === "serious") { utter.rate = 0.85; utter.pitch = 0.8; }
    else if (emotion === "calm") { utter.rate = 0.8; }
    else if (emotion === "firm") { utter.rate = 0.9; utter.pitch = 0.9; }
    else { utter.rate = 0.95; }

    utter.onstart = () => {
        setIsAiSpeaking(true);
        triggerHaptic("ai");
    };

    utter.onend = () => {
        setIsAiSpeaking(false);
        if (isLiveMode) setTimeout(startListening, 700);
    };

    synthesisRef.current.speak(utter);
};

const toggleLiveMode = () => {
    if (!isLiveMode) {
        setIsLiveMode(true);
        const intro = new SpeechSynthesisUtterance(
            "Neural link established. Speak now."
        );
        intro.voice = getMaleVoice();
        intro.onend = () => startListening();
        synthesisRef.current.speak(intro);
    } else {
        setIsLiveMode(false);
        synthesisRef.current.cancel();
        recognitionRef.current?.stop();
    }
};

/* ================= CHAT ================= */

const sendMessage = async (text) => {
    triggerHaptic("tap");

    const userMsg = { role: "user", content: text };
    setMessages(m => [...m, userMsg]);

    try {
        const res = await axios.post(`${API_BASE}/chat`, {
            userId: currentUser.uid,
            message: text
        });

        const aiMsg = { role: "ai", content: res.data.reply };
        setMessages(m => [...m, aiMsg]);
        speak(res.data.reply);

    } catch {
        toast.error("Connection lost");
    }
};

/* ================= UI ================= */

const ringState = isAiSpeaking ? "ai" : isListening ? "user" : "idle";

useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

return (
<div className={`h-screen w-full ${activeTheme.bg} ${activeTheme.text}`}>
<ToastContainer theme={activeTheme.isDark ? "dark" : "light"} />

<div className="flex flex-col h-full max-w-3xl mx-auto p-6">

{/* THEME SWITCHER */}
<select
    value={theme}
    onChange={e => setTheme(e.target.value)}
    className="mb-4 p-2 rounded-xl bg-white/10 text-xs"
>
    {Object.keys(themes).map(t => (
        <option key={t}>{t}</option>
    ))}
</select>

{/* CHAT */}
<div className="flex-1 overflow-y-auto space-y-6">
{messages.map((m, i) => (
    <div key={i} className={m.role === "user" ? "text-right" : ""}>
        <div className={`inline-block p-4 rounded-2xl ${m.role === "user" ? "bg-indigo-600 text-white" : activeTheme.card}`}>
            <ReactMarkdown>{m.content}</ReactMarkdown>
        </div>
    </div>
))}
<div ref={messagesEndRef}/>
</div>

{/* INPUT */}
<div className="mt-4 flex gap-2">
<textarea
    value={input}
    onChange={e => setInput(e.target.value)}
    onKeyDown={e => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage(input);
            setInput("");
        }
    }}
    className="flex-1 p-4 rounded-2xl bg-white/10 resize-none"
/>

<button
    onClick={toggleLiveMode}
    className={`p-4 rounded-full ${isLiveMode ? "bg-indigo-600" : "bg-white/10"}`}
>
    <FaHeadphones/>
</button>

<button
    onClick={() => { sendMessage(input); setInput(""); }}
    className="p-4 rounded-full bg-indigo-600 text-white"
>
    <FaPaperPlane/>
</button>
</div>

{/* AVATAR RING */}
<motion.div
    animate={{
        scale: ringState === "ai" ? [1,1.08,1] : ringState === "user" ? [1,1.04,1] : 1,
        borderColor: ringState === "ai" ? "#6366f1" :
                     ringState === "user" ? "#10b981" :
                     "rgba(255,255,255,0.1)"
    }}
    transition={{ repeat: Infinity, duration: 1.4 }}
    className="mx-auto mt-6 w-40 h-40 rounded-full border"
/>

</div>
</div>
);
}
