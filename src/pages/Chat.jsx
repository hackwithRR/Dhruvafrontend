import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaTimes, FaPlus, FaHistory, 
    FaBookOpen, FaSyncAlt, FaPalette,
    FaCamera, FaImage, FaLayerGroup, FaLightbulb
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";

import 'katex/dist/katex.min.css';

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- THE 8 THEMES ENGINE (APPLIES TO FULL CHAT) ---
const THEME_PRESETS = {
    DeepSpace: { container: "bg-[#050505] text-white", aiBubble: "bg-white/5 border-white/10", userBubble: "bg-indigo-600 shadow-indigo-500/20", accent: "text-indigo-400", btn: "bg-indigo-600", sidebar: "bg-[#080808]", input: "bg-white/5 border-white/10" },
    Sakura: { container: "bg-[#1a0f12] text-rose-100", aiBubble: "bg-rose-500/10 border-rose-500/20", userBubble: "bg-rose-600 shadow-rose-500/20", accent: "text-rose-400", btn: "bg-rose-600", sidebar: "bg-[#221418]", input: "bg-rose-900/20 border-rose-500/20" },
    Forest: { container: "bg-[#0a120a] text-emerald-100", aiBubble: "bg-emerald-500/10 border-emerald-500/20", userBubble: "bg-emerald-600 shadow-emerald-500/20", accent: "text-emerald-400", btn: "bg-emerald-600", sidebar: "bg-[#0e1a0e]", input: "bg-emerald-900/20 border-emerald-500/20" },
    Cyberpunk: { container: "bg-[#0a0512] text-cyan-100", aiBubble: "bg-fuchsia-500/10 border-cyan-500/30", userBubble: "bg-fuchsia-600 shadow-fuchsia-500/20", accent: "text-fuchsia-400", btn: "bg-cyan-600", sidebar: "bg-[#120a1a]", input: "bg-fuchsia-900/20 border-fuchsia-500/20" },
    Midnight: { container: "bg-[#000000] text-blue-100", aiBubble: "bg-blue-900/20 border-blue-500/20", userBubble: "bg-blue-700 shadow-blue-500/20", accent: "text-blue-400", btn: "bg-blue-700", sidebar: "bg-[#050510]", input: "bg-blue-900/10 border-blue-500/20" },
    Sunset: { container: "bg-[#120a05] text-orange-100", aiBubble: "bg-orange-500/10 border-orange-500/20", userBubble: "bg-orange-600 shadow-orange-500/20", accent: "text-orange-400", btn: "bg-orange-600", sidebar: "bg-[#1a0f0a]", input: "bg-orange-900/20 border-orange-500/20" },
    Lavender: { container: "bg-[#0f0a12] text-purple-100", aiBubble: "bg-purple-500/10 border-purple-500/20", userBubble: "bg-purple-600 shadow-purple-500/20", accent: "text-purple-400", btn: "bg-purple-600", sidebar: "bg-[#160e1c]", input: "bg-purple-900/20 border-purple-500/20" },
    Ghost: { container: "bg-[#0a0a0a] text-gray-100", aiBubble: "bg-white/5 border-white/5", userBubble: "bg-gray-700 shadow-white/5", accent: "text-gray-400", btn: "bg-gray-800", sidebar: "bg-[#111111]", input: "bg-white/5 border-white/5" }
};

export default function Chat() {
    const { currentUser, logout, theme, setTheme } = useAuth();
    
    // Core Logic States
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [subject, setSubject] = useState("");
    const [chapter, setChapter] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    
    // Media States
    const [selectedImage, setSelectedImage] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);

    // Grab current theme object
    const currentTheme = THEME_PRESETS[theme] || THEME_PRESETS.DeepSpace;

    // Scroll chat to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Camera Management
    const startCamera = async () => {
        setIsCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            toast.error("Camera access denied!");
            setIsCameraActive(false);
        }
    };

    const capturePhoto = () => {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
        setSelectedImage(canvas.toDataURL("image/jpeg"));
        stopCamera();
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setIsCameraActive(false);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024 });
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => setSelectedImage(reader.result);
    };

    // Communication Logic
    const sendMessage = async () => {
        if (isSending || (!input.trim() && !selectedImage)) return;
        setIsSending(true);
        const img = selectedImage;
        const txt = input;
        setSelectedImage(null);
        setInput("");

        setMessages(prev => [...prev, { role: "user", content: txt, image: img }]);

        try {
            const res = await axios.post(`${API_BASE}/chat`, { 
                userId: currentUser.uid, 
                message: txt,
                mode, subject, chapter,
                image: img
            });
            setMessages(prev => [...prev, { role: "ai", content: res.data.reply }]);
        } catch (e) { 
            toast.error("Something went wrong with the AI!"); 
        }
        setIsSending(false);
    };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-500 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" />
            
            {/* SIDEBAR FOR THEMES & HISTORY */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[150] w-72 h-full p-6 border-r border-white/10 ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-10"><span className="text-[10px] font-black uppercase opacity-40">Options</span><button onClick={() => setShowSidebar(false)}><FaTimes /></button></div>
                        <h4 className="text-[10px] font-bold uppercase mb-4 opacity-50">Choose Vibe</h4>
                        <div className="grid grid-cols-4 gap-2 mb-8">
                            {Object.keys(THEME_PRESETS).map((t) => (
                                <button 
                                    key={t} 
                                    onClick={() => setTheme(t)} 
                                    className={`h-10 w-full rounded-lg border-2 ${theme === t ? 'border-white' : 'border-transparent'} ${THEME_PRESETS[t].container} transition-all active:scale-90`} 
                                />
                            ))}
                        </div>
                        <button onClick={() => setMessages([])} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                            <FaPlus /> New Session
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />

                {/* --- CLASSIC OLD UI TOP BAR (Subject, Chapter, Mode) --- */}
                <div className="max-w-6xl mx-auto w-full px-4 pt-4 grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
                    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${currentTheme.input}`}>
                        <FaBookOpen className={`text-xs ${currentTheme.accent}`} />
                        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject..." className="bg-transparent text-xs font-bold outline-none flex-1 text-white" />
                    </div>
                    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${currentTheme.input}`}>
                        <FaLayerGroup className={`text-xs ${currentTheme.accent}`} />
                        <input value={chapter} onChange={e => setChapter(e.target.value)} placeholder="Chapter..." className="bg-transparent text-xs font-bold outline-none flex-1 text-white" />
                    </div>
                    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${currentTheme.input}`}>
                        <FaLightbulb className={`text-xs ${currentTheme.accent}`} />
                        <select value={mode} onChange={e => setMode(e.target.value)} className="bg-transparent text-xs font-bold outline-none flex-1 text-white cursor-pointer appearance-none">
                            <option value="Explain" className="bg-stone-900 text-white">Mode: Explain</option>
                            <option value="Summarize" className="bg-stone-900 text-white">Mode: Summarize</option>
                            <option value="Q&A" className="bg-stone-900 text-white">Mode: Q&A</option>
                        </select>
                    </div>
                </div>

                {/* CHAT AREA WITH DYNAMIC THEME BUBBLES */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8 pb-10">
                        {messages.length === 0 && (
                            <div className="h-full flex items-center justify-center opacity-20 py-20">
                                <p className="text-sm font-black tracking-widest uppercase italic">Start your doubt session buddy...</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[85%] p-5 rounded-2xl shadow-xl border transition-all ${msg.role === "user" ? `${currentTheme.userBubble} border-white/10 rounded-tr-none` : `${currentTheme.aiBubble} rounded-tl-none`}`}>
                                    {msg.image && <img src={msg.image} alt="study-img" className="mb-3 rounded-lg max-h-64 shadow-md border border-white/5" />}
                                    <div className="text-sm leading-relaxed prose prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* INPUT BAR WITH ATTACHMENTS */}
                <div className="p-4 md:p-8 shrink-0">
                    <div className="max-w-4xl mx-auto">
                        {selectedImage && (
                            <div className="mb-3 relative inline-block animate-pulse">
                                <img src={selectedImage} alt="preview" className="h-20 w-20 object-cover rounded-xl border-2 border-white/20 shadow-lg" />
                                <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white shadow-md hover:scale-110 transition-transform"><FaTimes size={10}/></button>
                            </div>
                        )}
                        <div className={`flex items-center p-2 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${currentTheme.input}`}>
                            <button onClick={() => setShowSidebar(!showSidebar)} className="p-4 text-white opacity-40 hover:opacity-100 transition-all"><FaHistory /></button>
                            <input value={input} onChange={e => setInput(e.target.value)} placeholder="What's your doubt?" className="flex-1 bg-transparent px-4 py-4 outline-none font-bold text-sm text-white" onKeyDown={e => e.key === "Enter" && sendMessage()} />
                            <div className="flex items-center gap-2 pr-2">
                                <button onClick={() => fileInputRef.current.click()} className="p-3 text-white opacity-40 hover:opacity-100 transition-all"><FaImage /></button>
                                <button onClick={startCamera} className="p-3 text-white opacity-40 hover:opacity-100 transition-all"><FaCamera /></button>
                                <button onClick={() => sendMessage()} disabled={isSending} className={`p-4 rounded-xl text-white font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center min-w-[50px] ${currentTheme.btn}`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" /> : <FaPaperPlane />}
                                </button>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                    </div>
                </div>
            </div>

            {/* FULLSCREEN CAMERA OVERLAY */}
            <AnimatePresence>
                {isCameraActive && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-4">
                        <video ref={videoRef} autoPlay playsInline className="w-full max-w-2xl rounded-3xl border-2 border-white/10 shadow-2xl" />
                        <div className="flex gap-8 mt-10">
                            <button onClick={stopCamera} className="p-5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"><FaTimes size={20}/></button>
                            <button onClick={capturePhoto} className="p-8 bg-white rounded-full text-black hover:scale-110 active:scale-90 transition-all shadow-white/20 shadow-xl"><FaCamera size={28} /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
