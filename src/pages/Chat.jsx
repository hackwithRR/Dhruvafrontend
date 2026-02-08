import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane, FaCamera, FaSyncAlt, FaTimes, FaMicrophone,
    FaImage, FaPlus, FaHistory, FaYoutube, FaTrash,
    FaClock, FaPlay, FaStop, FaTrophy, FaCheckCircle,
    FaWaveSquare, FaEdit, FaChevronLeft, FaHeadphones, FaCheck, FaCoins, FaBullseye, FaFire
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, deleteDoc, updateDoc, increment, limit } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- Rank & Goal Component ---
const RankBadge = ({ xp, level, dailyXP, streak }) => {
    const progress = (xp % 500) / 5;
    const dailyProgress = Math.min((dailyXP / 50) * 100, 100);
    return (
        <div className="space-y-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-fuchsia-600/10 rounded-3xl border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg"><FaTrophy className="text-white" size={16} /></div>
                        <div>
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Level {level}</h4>
                            <h3 className="text-md font-black text-white leading-none">{xp} Total XP</h3>
                        </div>
                    </div>
                    {streak > 0 && (
                        <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-1 rounded-full border border-orange-500/30">
                            <FaFire className="text-orange-500" size={10} />
                            <span className="text-[10px] font-black text-orange-500">{streak}d</span>
                        </div>
                    )}
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                </div>
            </div>
            
            <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase"><FaBullseye /> Daily Goal</div>
                    <span className="text-[10px] text-white/50">{dailyXP}/50 XP</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${dailyProgress}%` }} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
            </div>
        </div>
    );
};

export default function Chat() {
    const { currentUser, logout } = useAuth();
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [isSending, setIsSending] = useState(false);
    const [theme, setTheme] = useState("DeepSpace");
    const [userData, setUserData] = useState({ board: "CBSE", class: "10", xp: 0, dailyXP: 0, streak: 0, lastLogin: Date.now() });
    const [showSidebar, setShowSidebar] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const fileInputRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);

    // --- REWARD & STREAK SYSTEM ---
    const awardXP = async (amt) => {
        if (amt <= 0) return;
        const streakBonus = userData.streak >= 3 ? 1.2 : 1.0;
        const finalAmt = Math.round(amt * streakBonus);
        
        const newDaily = (userData.dailyXP || 0) + finalAmt;
        
        await updateDoc(doc(db, "users", currentUser.uid), { 
            xp: increment(finalAmt),
            dailyXP: increment(finalAmt)
        });
        
        setUserData(p => ({ ...p, xp: p.xp + finalAmt, dailyXP: newDaily }));
        
        if (newDaily >= 50 && userData.dailyXP < 50) {
            toast.success("🏆 Daily Goal Achieved! +50 Bonus XP");
            awardXP(50);
        }
    };

    // --- VOICE ENGINE (Fixed Speech/Mic Loop) ---
    const speak = (text) => {
        if (!isLiveMode) return;
        
        synthesisRef.current.cancel(); 
        const cleanText = text.replace(/[*#_]/g, "").replace(/\[.*?\]/g, "");
        const utter = new SpeechSynthesisUtterance(cleanText);
        
        const voices = synthesisRef.current.getVoices();
        utter.voice = voices.find(v => v.name.includes("Google") && v.lang.includes("en")) || voices[0];
        utter.rate = 1.0;
        utter.pitch = 1.1;

        utter.onstart = () => {
            setIsAiSpeaking(true);
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch(e) {}
            }
        };

        utter.onend = () => {
            setIsAiSpeaking(false);
            if (isLiveMode) {
                setTimeout(() => {
                    try { recognitionRef.current.start(); setIsListening(true); } catch(e) {}
                }, 800);
            }
        };

        synthesisRef.current.speak(utter);
    };

    // --- MIC INITIALIZATION ---
    useEffect(() => {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (Speech) {
            recognitionRef.current = new Speech();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            
            recognitionRef.current.onresult = (e) => {
                const transcript = e.results[0][0].transcript;
                setInput(transcript);
                if (transcript.length > 2) sendMessage(transcript);
            };
            
            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onerror = () => setIsListening(false);
        }
    }, [isLiveMode]);

    // --- DATA LOADING & DAILY RESET ---
    useEffect(() => {
        if (!currentUser) return;
        const fetchData = async () => {
            const userRef = doc(db, "users", currentUser.uid);
            const snap = await getDoc(userRef);
            
            if (snap.exists()) {
                const data = snap.data();
                const today = new Date().toDateString();
                const lastDate = data.lastLoginDate || "";
                
                // Streak Logic
                let newStreak = data.streak || 0;
                if (lastDate !== today) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (lastDate === yesterday.toDateString()) {
                        newStreak += 1;
                    } else {
                        newStreak = 1;
                    }
                    // Reset Daily XP on new day
                    await updateDoc(userRef, { dailyXP: 0, lastLoginDate: today, streak: newStreak });
                    setUserData({ ...data, dailyXP: 0, streak: newStreak });
                } else {
                    setUserData(data);
                }
            }

            // Load Leaderboard
            const qLead = query(collection(db, "users"), orderBy("xp", "desc"), limit(5));
            const leadSnap = await getDocs(qLead);
            setLeaderboard(leadSnap.docs.map(d => d.data()));
        };
        fetchData();
    }, [currentUser]);

    const sendMessage = async (override = null) => {
        const text = override || input;
        if (isSending || (!text.trim() && !selectedFile)) return;
        setIsSending(true);
        setInput("");

        const userMsg = { role: "user", content: text, image: selectedFile ? URL.createObjectURL(selectedFile) : null };
        setMessages(prev => [...prev, userMsg]);

        try {
            const payload = { 
                userId: currentUser.uid, message: text, mode, 
                subject: subjectInput, chapter: chapterInput,
                board: userData.board, classLevel: userData.class 
            };
            const res = await axios.post(`${API_BASE}/chat`, payload);
            const reply = res.data.reply;

            // Contextual YouTube Links
            let yt = null;
            if (text.length > 4) {
                if (mode === "Explain") {
                    yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} Class ${userData.class} ${subjectInput} ${text} concept explanation`)}`;
                } else if (mode === "Homework" || mode === "Quiz") {
                    yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to solve: ${text}`)}`;
                }
            }

            // Tiered Points Logic
            let pts = 0;
            if (mode === "Quiz" && (reply.toLowerCase().includes("correct") || reply.toLowerCase().includes("right"))) pts = 20;
            else if (mode === "Explain") pts = 5;

            const aiMsg = { role: "ai", content: reply, ytLink: yt };
            setMessages(prev => [...prev, aiMsg]);
            
            if (isLiveMode) speak(reply);
            if (pts > 0) awardXP(pts);

            // Save session
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), { 
                messages: [...messages, userMsg, aiMsg], 
                lastUpdate: Date.now(),
                title: messages.length === 0 ? text.slice(0, 20) : null
            }, { merge: true });

        } catch (err) { toast.error("Connection Error"); }
        setIsSending(false);
    };

    return (
        <div className="flex h-[100dvh] w-full bg-[#050505] text-white overflow-hidden">
            <ToastContainer theme="dark" position="top-center" autoClose={1500} />
            
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="fixed inset-y-0 left-0 w-80 bg-[#0a0a0a] border-r border-white/10 z-[100] p-6 shadow-2xl flex flex-col">
                        <div className="flex justify-between items-center mb-8"><span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Student Profile</span><button onClick={() => setShowSidebar(false)} className="p-2 bg-white/5 rounded-full"><FaChevronLeft/></button></div>
                        
                        <RankBadge xp={userData.xp} level={Math.floor((userData.xp||0)/500)+1} dailyXP={userData.dailyXP} streak={userData.streak} />
                        
                        <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
                            <div>
                                <h3 className="text-[10px] font-black opacity-30 uppercase mb-4 flex items-center gap-2"><FaTrophy className="text-yellow-500"/> Global Leaderboard</h3>
                                <div className="space-y-2">
                                    {leaderboard.map((user, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                            <span className="text-xs font-bold text-white/70">#{idx+1} {user.displayName?.split(' ')[0]}</span>
                                            <span className="text-[10px] font-black text-indigo-400">LVL {Math.floor(user.xp/500)+1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col h-full relative">
                <Navbar currentUser={currentUser} userData={userData} />
                
                {/* Board/Subject Banner */}
                <div className="w-full max-w-3xl mx-auto px-4 mt-4">
                    <div className="flex items-center justify-between p-2 px-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
                        <div className="flex gap-4 text-[9px] font-black uppercase text-indigo-400">
                            <span>{userData.board} • CLASS {userData.class}</span>
                            <span>{subjectInput || "Select Subject"}</span>
                        </div>
                        <div className="flex gap-2">
                            {["Explain", "Quiz", "Homework"].map(m => (
                                <button key={m} onClick={() => setMode(m)} className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all ${mode === m ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/30'}`}>{m}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Message Space */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 text-center opacity-20">
                                <FaWaveSquare size={40} className="mb-4 animate-pulse" />
                                <p className="text-xs font-black uppercase tracking-[0.3em]">Neural Link Ready</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`p-6 rounded-[2.5rem] max-w-[90%] shadow-2xl ${msg.role === "user" ? "bg-indigo-600 rounded-tr-none text-white shadow-indigo-500/20" : "bg-white/[0.03] border border-white/10 rounded-tl-none backdrop-blur-xl"}`}>
                                    {msg.image && <img src={msg.image} className="rounded-3xl mb-4 max-h-64 w-full object-cover border border-white/10" alt="input" />}
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="prose prose-invert text-sm leading-relaxed">{msg.content}</ReactMarkdown>
                                    {msg.ytLink && (
                                        <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 py-3 bg-red-600/10 hover:bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase border border-red-600/20 transition-all">
                                            <FaYoutube size={16}/> Visual Academy Link
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} className="h-20" />
                    </div>
                </div>

                {/* --- FLOATING GEMINI STYLE INPUT --- */}
                <div className="p-4 md:pb-10 bg-gradient-to-t from-black via-black/90 to-transparent">
                    <div className="max-w-3xl mx-auto relative">
                        <div className="bg-[#111] border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 px-4 flex items-end gap-2 focus-within:border-indigo-500/50 transition-all">
                            <button onClick={() => fileInputRef.current.click()} className="p-3 text-white/30 hover:text-indigo-400 transition-colors">
                                <FaImage size={20}/>
                                <input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])} />
                            </button>
                            
                            <textarea
                                value={input}
                                rows="1"
                                onChange={(e) => setInput(e.target.value)}
                                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                                placeholder={isLiveMode ? "Listening..." : "Ask Dhruva anything..."}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4 max-h-40 overflow-y-auto no-scrollbar font-medium"
                                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                            />

                            <div className="flex items-center gap-1 mb-1">
                                <div className={`flex gap-0.5 px-3 transition-opacity duration-300 ${isAiSpeaking || isListening ? 'opacity-100' : 'opacity-0'}`}>
                                    {[1,2,3,4].map(i => <motion.div key={i} animate={{ height: [4, 16, 4] }} transition={{ repeat: Infinity, duration: 0.5, delay: i*0.1 }} className="w-1 bg-indigo-500 rounded-full"/>)}
                                </div>
                                
                                <button 
                                    onClick={() => { setIsLiveMode(!isLiveMode); if(!isLiveMode) { try { recognitionRef.current.start(); setIsListening(true); } catch(e){} } else { synthesisRef.current.cancel(); recognitionRef.current.stop(); } }} 
                                    className={`p-4 rounded-full transition-all ${isLiveMode ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/50' : 'text-white/30 hover:bg-white/5'}`}
                                >
                                    <FaHeadphones size={20}/>
                                </button>
                                
                                <button 
                                    onClick={() => sendMessage()} 
                                    className={`p-4 rounded-full transition-all ${!input.trim() && !selectedFile ? 'bg-white/5 text-white/10' : 'bg-white text-black scale-105 shadow-xl hover:bg-indigo-50 active:scale-95'}`}
                                >
                                    {isSending ? <FaSyncAlt className="animate-spin" size={16}/> : <FaPaperPlane size={16}/>}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center px-6 mt-4">
                            <button onClick={() => setShowSidebar(true)} className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] hover:opacity-100 transition-opacity flex items-center gap-2">
                                <FaHistory /> Statistics
                            </button>
                            {selectedFile && (
                                <div className="flex items-center gap-2 bg-indigo-600/20 px-3 py-1 rounded-full border border-indigo-500/30">
                                    <span className="text-[9px] font-bold text-indigo-400">Image Attached</span>
                                    <button onClick={() => setSelectedFile(null)}><FaTimes size={10}/></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
