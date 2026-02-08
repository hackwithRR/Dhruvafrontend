import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane, FaCamera, FaSyncAlt, FaTimes, FaMicrophone,
    FaImage, FaPlus, FaHistory, FaYoutube, FaTrash,
    FaClock, FaPlay, FaStop, FaTrophy, FaCheckCircle,
    FaWaveSquare, FaEdit, FaChevronLeft, FaHeadphones, FaCheck
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

const MASTER_SYLLABUS = `
CBSE 8-10 MATH/SCIENCE: Full Syllabus Integrated.
ICSE 8-10 MATH/SCIENCE: Full Syllabus Integrated.
`;

// Shield against external noise
if (typeof window !== "undefined") {
    window.addEventListener('error', e => {
        if (e.message.toLowerCase().includes('neurolink')) e.stopImmediatePropagation();
    });
}

// --- UI COMPONENTS ---

const RankBadge = ({ xp, level }) => {
    const progress = (xp % 500) / 5;
    const ranks = ["Novice", "Scholar", "Sage", "Expert", "Master", "Grandmaster"];
    const currentRank = ranks[Math.min(Math.floor((level - 1) / 2), ranks.length - 1)];
    return (
        <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-fuchsia-600/10 rounded-3xl border border-white/10 shadow-xl mb-6">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg"><FaTrophy className="text-white" size={16} /></div>
                <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{currentRank}</h4>
                    <h3 className="text-md font-black text-white leading-none">Level {level}</h3>
                </div>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
            </div>
        </div>
    );
};

const StudyTimer = ({ currentTheme, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(() => Number(localStorage.getItem("dhruva_timeLeft")) || 0);
    const [isActive, setIsActive] = useState(() => localStorage.getItem("dhruva_timerActive") === "true");
    const [initialTime, setInitialTime] = useState(() => Number(localStorage.getItem("dhruva_initialTime")) || 0);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        localStorage.setItem("dhruva_timeLeft", timeLeft);
        localStorage.setItem("dhruva_timerActive", isActive);
        localStorage.setItem("dhruva_initialTime", initialTime);
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            handleComplete(true);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const handleComplete = (isFinished) => {
        const secondsStudied = initialTime - timeLeft;
        const earnedXP = Math.floor(secondsStudied / 60);
        if (earnedXP > 0) { onComplete(earnedXP); toast.success(`+${earnedXP} XP Earned`); }
        setIsActive(false); setTimeLeft(0); setInitialTime(0);
    };

    return (
        <motion.div drag dragMomentum={false} className="fixed z-[100] right-4 top-24">
            <motion.div animate={{ width: isOpen ? "220px" : "50px", height: isOpen ? "240px" : "50px", borderRadius: "25px" }} className={`flex flex-col overflow-hidden border shadow-2xl backdrop-blur-3xl ${currentTheme.aiBubble} border-white/10`}>
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-400">
                        {isActive ? <span className="text-[10px] font-bold animate-pulse">{Math.ceil(timeLeft / 60)}m</span> : <FaClock size={18} />}
                    </button>
                ) : (
                    <div className="p-4 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-center text-[8px] font-black uppercase opacity-40"><span>Focus</span><button onClick={() => setIsOpen(false)}><FaTimes /></button></div>
                        <div className="text-3xl font-mono font-black text-center">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>
                        <div className="grid grid-cols-3 gap-1">{[15, 25, 45].map(m => (<button key={m} onClick={() => { setTimeLeft(m * 60); setInitialTime(m * 60); setIsActive(true); }} className="py-2 rounded-xl bg-white/5 text-[9px] font-black hover:bg-indigo-600">{m}m</button>))}</div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsActive(!isActive)} className="flex-1 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">{isActive ? <FaStop /> : <FaPlay />}</button>
                            <button onClick={() => handleComplete(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><FaTrash size={12}/></button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

const VoiceWaveform = ({ isActive }) => (
    <div className={`flex items-center gap-0.5 h-4 px-2 ${isActive ? 'opacity-100' : 'opacity-0'} transition-all`}>
        {[1, 2, 3, 4, 5].map(i => (
            <motion.div
                key={i}
                animate={{ height: isActive ? [4, 16, 8, 14, 4] : 4 }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                className="w-0.5 bg-indigo-400 rounded-full"
            />
        ))}
    </div>
);

// --- MAIN CHAT COMPONENT ---

export default function Chat() {
    const { currentUser, logout } = useAuth();
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [isSending, setIsSending] = useState(false);
    const [theme, setTheme] = useState("DeepSpace");
    const [userData, setUserData] = useState({ board: "CBSE", class: "10", language: "English", xp: 0 });
    const [showSidebar, setShowSidebar] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isVoiceOn, setIsVoiceOn] = useState(true);
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [newSessionName, setNewSessionName] = useState("");

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const recognitionRef = useRef(null);

    const themes = {
        DeepSpace: { container: "bg-[#050505] text-white", aiBubble: "bg-white/[0.04] border-white/10", userBubble: "bg-indigo-600", input: "bg-[#111111] border-white/10", sidebar: "bg-[#080808] border-white/5" },
        Light: { container: "bg-gray-50 text-gray-900", aiBubble: "bg-white border-gray-200", userBubble: "bg-indigo-600 text-white", input: "bg-white border-gray-300", sidebar: "bg-white border-gray-200" },
        Sakura: { container: "bg-[#1a0f12] text-rose-50", aiBubble: "bg-rose-500/10 border-rose-500/20", userBubble: "bg-rose-600", input: "bg-[#221418] border-rose-500/10", sidebar: "bg-[#221418] border-rose-500/10" },
        Cyberpunk: { container: "bg-[#0a0512] text-cyan-50", aiBubble: "bg-cyan-500/10 border-cyan-500/30", userBubble: "bg-fuchsia-600", input: "bg-[#120a1a] border-cyan-500/10", sidebar: "bg-[#120a1a] border-cyan-500/20" }
    };
    const currentTheme = themes[theme] || themes.DeepSpace;
    const currentLevel = Math.floor((userData.xp || 0) / 500) + 1;

    // --- VOICE ENGINE ---
    const speak = (text) => {
        if (!isVoiceOn && !isLiveMode) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ""));
        utter.rate = 1.1;
        utter.onstart = () => setIsAiSpeaking(true);
        utter.onend = () => {
            setIsAiSpeaking(false);
            if (isLiveMode) handleVoiceToggle(true);
        };
        window.speechSynthesis.speak(utter);
    };

    useEffect(() => {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (Speech) {
            recognitionRef.current = new Speech();
            recognitionRef.current.continuous = false;
            recognitionRef.current.onresult = (e) => {
                const t = e.results[0][0].transcript;
                setInput(t);
                if (t.length > 2) setTimeout(() => sendMessage(t), 1000);
            };
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, []);

    const handleVoiceToggle = (forceStart = false) => {
        if (isListening && !forceStart) {
            recognitionRef.current.stop();
        } else {
            try { recognitionRef.current.start(); setIsListening(true); } catch(e) {}
        }
    };

    const toggleLiveMode = () => {
        if (!isLiveMode) {
            setIsLiveMode(true);
            setIsVoiceOn(true);
            handleVoiceToggle(true);
            toast.info("Live Mode Active");
        } else {
            setIsLiveMode(false);
            window.speechSynthesis.cancel();
            recognitionRef.current.stop();
        }
    };

    // --- SESSION OPS ---
    const loadSessions = async () => {
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const deleteSession = async (id) => {
        if (window.confirm("Delete this session forever?")) {
            await deleteDoc(doc(db, `users/${currentUser.uid}/sessions`, id));
            if (currentSessionId === id) {
                setMessages([]);
                setCurrentSessionId(Date.now().toString());
            }
            loadSessions();
            toast.error("Session Deleted");
        }
    };

    const renameSession = async (id) => {
        if (!newSessionName.trim()) return setEditingSessionId(null);
        await updateDoc(doc(db, `users/${currentUser.uid}/sessions`, id), { title: newSessionName });
        setEditingSessionId(null);
        loadSessions();
    };

    const sendMessage = async (override = null) => {
        const text = override || input;
        if (isSending || (!text.trim() && !selectedFile)) return;
        setIsSending(true);
        const file = selectedFile;
        setInput(""); setSelectedFile(null);

        const userMsg = { role: "user", content: text || "Processing...", image: file ? URL.createObjectURL(file) : null };
        const updatedMsgs = [...messages, userMsg];
        setMessages(updatedMsgs);

        try {
            const payload = {
                userId: currentUser.uid, message: text, mode, subject: subjectInput, chapter: chapterInput,
                language: userData.language, classLevel: userData.class, board: userData.board, syllabusRegistry: MASTER_SYLLABUS
            };
            let res;
            if (file) {
                const comp = await imageCompression(file, { maxSizeMB: 0.4 });
                const fd = new FormData();
                fd.append("photo", comp);
                Object.keys(payload).forEach(k => fd.append(k, payload[k]));
                res = await axios.post(`${API_BASE}/chat/photo`, fd);
            } else {
                res = await axios.post(`${API_BASE}/chat`, payload);
            }

            const aiMsg = { role: "ai", content: res.data.reply, ytLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} ${userData.class} ${subjectInput} ${text}`)}` };
            const finalMsgs = [...updatedMsgs, aiMsg];
            setMessages(finalMsgs);
            speak(res.data.reply);

            const sessionTitle = messages.length === 0 ? text.slice(0, 25) : null;
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), { messages: finalMsgs, lastUpdate: Date.now(), ...(sessionTitle && { title: sessionTitle }) }, { merge: true });
            loadSessions();
            awardXP(10);
        } catch (err) { toast.error("Connection failed"); }
        setIsSending(false);
    };

    useEffect(() => {
        if (!currentUser) return;
        (async () => {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            if (snap.exists()) setUserData(snap.data());
            loadSessions();
        })();
    }, [currentUser]);

    const awardXP = async (amt) => {
        await updateDoc(doc(db, "users", currentUser.uid), { xp: increment(amt) });
        setUserData(p => ({ ...p, xp: p.xp + amt }));
    };

    const openCamera = async () => {
        setIsCameraOpen(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) videoRef.current.srcObject = stream;
    };

    const capturePhoto = () => {
        const ctx = canvasRef.current.getContext("2d");
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        canvasRef.current.toBlob(b => { setSelectedFile(new File([b], "shot.jpg", { type: "image/jpeg" })); setIsCameraOpen(false); }, "image/jpeg", 0.7);
    };

    return (
        <div className={`flex h-[100dvh] w-full overflow-hidden ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" autoClose={2000} />

            {/* SIDEBAR */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} className={`fixed lg:relative z-[200] w-72 h-full flex flex-col p-6 border-r ${currentTheme.sidebar} backdrop-blur-2xl shadow-2xl`}>
                        <div className="flex justify-between items-center mb-6"><span className="text-[10px] font-black uppercase opacity-40">History</span><button onClick={() => setShowSidebar(false)} className="p-2 rounded-full hover:bg-white/5"><FaChevronLeft /></button></div>
                        <RankBadge xp={userData.xp} level={currentLevel} />
                        <button onClick={() => { setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false); }} className="w-full py-4 mb-6 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg"><FaPlus /> New Brainstorm</button>
                        
                        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                            {sessions.map(s => (
                                <div key={s.id} onClick={() => { if(editingSessionId !== s.id) { setCurrentSessionId(s.id); setMessages(s.messages || []); setShowSidebar(false); } }} className={`group p-4 rounded-2xl border transition-all cursor-pointer relative ${currentSessionId === s.id ? 'bg-indigo-600/10 border-indigo-600/40' : 'border-transparent hover:bg-white/5'}`}>
                                    {editingSessionId === s.id ? (
                                        <div className="flex items-center gap-2">
                                            <input autoFocus className="bg-transparent text-[10px] font-black uppercase outline-none w-full border-b border-indigo-500" value={newSessionName} onChange={e => setNewSessionName(e.target.value)} onKeyDown={e => e.key === 'Enter' && renameSession(s.id)} />
                                            <button onClick={() => renameSession(s.id)} className="text-emerald-500"><FaCheck /></button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black truncate block uppercase w-[70%]">{s.title || "Topic"}</span>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(s.id); setNewSessionName(s.title || ""); }} className="hover:text-indigo-400"><FaEdit size={12} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="hover:text-red-500"><FaTrash size={12} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col h-full relative min-w-0">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} userData={userData} />
                <StudyTimer currentTheme={currentTheme} onComplete={awardXP} />

                {/* HEADER INPUTS */}
                <div className="w-full max-w-4xl mx-auto px-4 pt-6 space-y-4">
                    <div className={`flex items-center gap-2 p-1 rounded-2xl border ${currentTheme.input}`}>
                        <input value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject" className="w-24 bg-transparent px-4 py-2 text-[10px] font-black uppercase outline-none" />
                        <div className="h-4 w-[1px] bg-white/10" />
                        <input value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Chapter" className="flex-1 bg-transparent px-4 py-2 text-[10px] font-black uppercase outline-none" />
                        <button onClick={() => setIsLocked(!isLocked)} className={`p-2 rounded-xl ${isLocked ? 'bg-emerald-600' : 'bg-white/5'}`}><FaCheckCircle size={10} /></button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {["Explain", "Quiz", "Summary", "Homework"].map(m => (
                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${mode === m ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/5 border-white/5 opacity-50'}`}>{m}</button>
                        ))}
                    </div>
                </div>

                {/* MESSAGES */}
                <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {messages.length === 0 && <div className="flex flex-col items-center justify-center h-48 opacity-10 text-[10px] uppercase tracking-widest"><FaWaveSquare size={30} className="mb-4" /> Start learning</div>}
                        {messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-2xl ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none text-white` : `${currentTheme.aiBubble} rounded-tl-none border border-white/5 backdrop-blur-3xl`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-2xl mb-4 max-h-64 w-full object-cover shadow-lg" alt="attachment" />}
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="prose prose-sm prose-invert text-sm leading-relaxed">{msg.content}</ReactMarkdown>
                                    {msg.role === "ai" && msg.ytLink && (<a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 py-4 bg-red-600/10 hover:bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase border border-red-600/20 transition-all"><FaYoutube size={16} /> Visual Lab</a>)}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} className="h-20" />
                    </div>
                </div>

                {/* ADAPTIVE CHAT BAR */}
                <div className="p-4 md:p-8 bg-gradient-to-t from-black to-transparent">
                    <div className="max-w-4xl mx-auto">
                        <div className={`relative flex flex-col w-full rounded-[2.5rem] border shadow-2xl transition-all ${currentTheme.input} focus-within:ring-1 ring-indigo-500/50`}>
                            {selectedFile && (
                                <div className="p-4 pb-0">
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 shadow-xl">
                                        <img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" />
                                        <button onClick={() => setSelectedFile(null)} className="absolute inset-0 bg-black/60 flex items-center justify-center text-white"><FaTimes size={12}/></button>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-end gap-1 p-2">
                                <div className="flex pb-1">
                                    <button onClick={() => fileInputRef.current.click()} className="p-3 text-white/40 hover:text-indigo-400"><FaImage size={18} /><input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])} /></button>
                                    <button onClick={openCamera} className="p-3 text-white/40 hover:text-indigo-400 hidden sm:block"><FaCamera size={18} /></button>
                                </div>
                                <textarea 
                                    rows="1"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                                    placeholder={isLiveMode ? "Listening..." : "Ask Dhruva..."}
                                    className="flex-1 bg-transparent py-3 px-2 outline-none text-sm font-medium resize-none max-h-32"
                                    onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                                />
                                <div className="flex items-center gap-1 pb-1 pr-1">
                                    <VoiceWaveform isActive={isListening || isAiSpeaking} />
                                    <button onClick={toggleLiveMode} className={`p-3 rounded-full transition-all ${isLiveMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'text-white/40 hover:bg-white/5'}`}><FaHeadphones size={18} /></button>
                                    <button onClick={() => handleVoiceToggle()} className={`p-3 rounded-full transition-all ${isListening ? 'text-red-500 animate-pulse' : 'text-white/40'}`}><FaMicrophone size={18} /></button>
                                    <button onClick={() => sendMessage()} disabled={isSending} className={`p-3.5 rounded-full transition-all ${isSending || (!input.trim() && !selectedFile) ? 'bg-white/5 text-white/20' : 'bg-white text-black ml-1 active:scale-95'}`}>
                                        {isSending ? <FaSyncAlt className="animate-spin" size={14} /> : <FaPaperPlane size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center mt-3"><button onClick={() => setShowSidebar(true)} className="text-[9px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2 hover:opacity-100 transition-opacity"><FaHistory /> View Sessions</button></div>
                    </div>
                </div>

                {/* CAMERA VIEW */}
                <AnimatePresence>
                    {isCameraOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex flex-col">
                            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
                            <div className="p-10 flex justify-between items-center bg-black/95">
                                <button onClick={() => setIsCameraOpen(false)} className="p-6 bg-white/10 rounded-full text-white"><FaTimes size={24} /></button>
                                <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-8 border-white/20 active:scale-90" />
                                <div className="w-16" />
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
