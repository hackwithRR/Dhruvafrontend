import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaUndo, 
    FaImage, FaPlus, FaHistory, FaUnlock, FaYoutube, FaArrowDown, 
    FaTrash, FaClock, FaPlay, FaPause, FaStop 
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

const formatContent = (text) => text?.replace(/\$\$/g, '').replace(/\n\s*\n/g, '\n\n').trim() || "";

// --- UX ENHANCED STUDY TIMER ---
const StudyTimer = ({ currentTheme }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 1);
            setIsActive(false);
            toast.info("Time's up! Take a breather.");
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <motion.div drag dragMomentum={false} className="fixed z-[100] right-6 top-24 hidden md:block">
            <motion.div 
                animate={{ width: isOpen ? "220px" : "54px", height: isOpen ? "240px" : "54px", borderRadius: isOpen ? "24px" : "50%" }}
                className={`flex flex-col overflow-hidden border shadow-2xl backdrop-blur-2xl ${currentTheme.aiBubble} border-white/10`}
            >
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-400"><FaClock size={20}/></button>
                ) : (
                    <div className="p-4 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[9px] font-black uppercase opacity-50">Deep Focus</span>
                            <button onClick={() => setIsOpen(false)}><FaTimes size={12}/></button>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h2 className="text-4xl font-black mb-4 font-mono">{formatTime(timeLeft)}</h2>
                            {timeLeft === 0 ? (
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    {[25, 50].map(m => (
                                        <button key={m} onClick={() => {setTimeLeft(m*60); setIsActive(true)}} className="py-2.5 rounded-xl bg-white/5 hover:bg-indigo-600 text-[10px] font-bold">{m}m</button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button onClick={() => setIsActive(!isActive)} className="p-4 rounded-full bg-indigo-600 text-white"><FaPlay size={12}/></button>
                                    <button onClick={() => {setTimeLeft(0); setIsActive(false)}} className="p-4 rounded-full bg-red-500/20 text-red-500"><FaStop size={12}/></button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default function Chat() {
    const { currentUser, logout } = useAuth();
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [isSending, setIsSending] = useState(false);
    const [theme, setTheme] = useState("DeepSpace");
    const [userData, setUserData] = useState({ board: "", class: "", language: "English" });
    const [showSidebar, setShowSidebar] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const themes = {
        DeepSpace: { container: "bg-[#050505] text-white", aiBubble: "bg-white/[0.03] border-white/10", userBubble: "bg-indigo-600 shadow-indigo-500/20", input: "bg-white/[0.02] border-white/10", button: "bg-indigo-600", sidebar: "bg-[#0A0A0A] border-white/5" },
        Sakura: { container: "bg-[#1a0f12] text-rose-50", aiBubble: "bg-rose-500/10 border-rose-500/20", userBubble: "bg-rose-600 shadow-rose-500/20", input: "bg-rose-500/5 border-rose-500/10", button: "bg-rose-600", sidebar: "bg-[#221418] border-rose-500/10" },
        Forest: { container: "bg-[#0a120a] text-emerald-50", aiBubble: "bg-emerald-500/10 border-emerald-500/20", userBubble: "bg-emerald-600 shadow-emerald-500/20", input: "bg-emerald-500/5 border-emerald-500/10", button: "bg-emerald-600", sidebar: "bg-[#0e1a0e] border-emerald-500/10" },
        Cyberpunk: { container: "bg-[#0a0512] text-cyan-50", aiBubble: "bg-cyan-500/10 border-cyan-500/30", userBubble: "bg-fuchsia-600 shadow-fuchsia-500/20", input: "bg-cyan-500/5 border-cyan-500/10", button: "bg-cyan-600", sidebar: "bg-[#120a1a] border-cyan-500/20" },
        Midnight: { container: "bg-black text-blue-50", aiBubble: "bg-blue-500/10 border-blue-500/20", userBubble: "bg-blue-700 shadow-blue-500/20", input: "bg-blue-500/5 border-blue-500/10", button: "bg-blue-600", sidebar: "bg-[#050510] border-blue-500/10" },
        Sunset: { container: "bg-[#120a05] text-orange-50", aiBubble: "bg-orange-500/10 border-orange-500/20", userBubble: "bg-orange-600 shadow-orange-500/20", input: "bg-orange-500/5 border-orange-500/10", button: "bg-orange-600", sidebar: "bg-[#1a0f10] border-orange-500/10" },
        Lavender: { container: "bg-[#0f0a12] text-purple-50", aiBubble: "bg-purple-500/10 border-purple-500/20", userBubble: "bg-purple-600 shadow-purple-500/20", input: "bg-purple-500/5 border-purple-500/10", button: "bg-purple-600", sidebar: "bg-[#160e1c] border-purple-500/10" },
        Ghost: { container: "bg-[#0a0a0a] text-gray-100", aiBubble: "bg-white/[0.02] border-white/5", userBubble: "bg-gray-800 shadow-black/40", input: "bg-white/[0.01] border-white/5", button: "bg-white/10", sidebar: "bg-[#111111] border-white/5" }
    };
    const currentTheme = themes[theme] || themes.DeepSpace;

    // --- EFFECT HOOKS ---
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isSending]);

    useEffect(() => {
        if (!currentUser) return;
        const init = async () => {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            if (snap.exists()) setUserData(snap.data());
            fetchSessions();
        };
        init();
    }, [currentUser]);

    // --- CORE LOGIC ---
    const fetchSessions = async () => {
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const deleteSession = async (sid, e) => {
        e.stopPropagation();
        await deleteDoc(doc(db, `users/${currentUser.uid}/sessions`, sid));
        if (currentSessionId === sid) { setMessages([]); setCurrentSessionId(Date.now().toString()); }
        fetchSessions();
    };

    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (e) { toast.error("Camera access denied"); setIsCameraOpen(false); }
    };

    const capturePhoto = () => {
        const context = canvasRef.current.getContext("2d");
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        canvasRef.current.toBlob(blob => {
            setSelectedFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
            stopCamera();
        }, "image/jpeg", 0.8);
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }
        setIsCameraOpen(false);
    };

    const sendMessage = async () => {
        if (!currentUser || isSending || (!input.trim() && !selectedFile)) return;
        const text = input;
        const file = selectedFile;
        setIsSending(true); setInput(""); setSelectedFile(null);

        const userMsg = { 
            role: "user", 
            content: text || "Analyze this image", 
            image: file ? URL.createObjectURL(file) : null 
        };
        const updatedMsgs = [...messages, userMsg];
        setMessages(updatedMsgs);

        try {
            const payload = { userId: currentUser.uid, message: text || "Explain", mode, subject: subjectInput, chapter: chapterInput, language: userData.language, classLevel: userData.class };
            let res;
            if (file) {
                const compressed = await imageCompression(file, { maxSizeMB: 0.5 });
                const formData = new FormData();
                formData.append("photo", compressed);
                Object.keys(payload).forEach(k => formData.append(k, payload[k]));
                res = await axios.post(`${API_BASE}/chat/photo`, formData);
            } else {
                res = await axios.post(`${API_BASE}/chat`, payload);
            }

            const aiMsg = { 
                role: "ai", 
                content: res.data.reply, 
                ytLink: subjectInput ? `https://www.youtube.com/results?search_query=${encodeURIComponent(subjectInput + " lesson")}` : null 
            };
            const finalMsgs = [...updatedMsgs, aiMsg];
            setMessages(finalMsgs);
            
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: finalMsgs, lastUpdate: Date.now(), title: subjectInput || text.slice(0, 20)
            }, { merge: true });
            fetchSessions();
        } catch (e) { toast.error("Connection error"); }
        setIsSending(false);
    };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-colors duration-500 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" limit={1} />
            
            {/* --- SIDEBAR --- */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[200] w-80 h-full flex flex-col p-6 shadow-3xl backdrop-blur-xl ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-10">
                            <span className="text-[10px] font-black tracking-widest uppercase opacity-40">Learning Vault</span>
                            <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-white/5 rounded-full"><FaTimes/></button>
                        </div>
                        <button onClick={() => {setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false)}} className="w-full py-4 mb-8 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-3">
                            <FaPlus size={10}/> NEW SESSION
                        </button>
                        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                            {sessions.map(s => (
                                <div key={s.id} onClick={() => {setCurrentSessionId(s.id); setMessages(s.messages || []); setShowSidebar(false)}} className={`group p-4 rounded-2xl cursor-pointer transition-all border ${currentSessionId === s.id ? 'bg-indigo-600/10 border-indigo-600/30' : 'border-transparent hover:bg-white/5 opacity-60'}`}>
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs font-bold truncate uppercase pr-2">{s.title || "Untitled"}</div>
                                        <button onClick={(e) => deleteSession(s.id, e)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110"><FaTrash size={10}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
                <StudyTimer currentTheme={currentTheme} />

                {/* --- SUBJECT HEADER --- */}
                <div className="w-full max-w-4xl mx-auto px-4 pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className={`flex-1 flex items-center gap-2 p-1.5 rounded-[1.5rem] border transition-all ${isLocked ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10 bg-white/5'}`}>
                            <input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject" className="flex-1 bg-transparent px-4 py-2 text-xs font-bold outline-none" />
                            <div className="w-px h-4 bg-white/10" />
                            <input disabled={isLocked} value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Chapter" className="flex-1 bg-transparent px-4 py-2 text-xs font-bold outline-none" />
                            <button onClick={() => setIsLocked(!isLocked)} className={`p-3 rounded-xl ${isLocked ? 'bg-emerald-600' : 'bg-white/10 text-indigo-400'}`}>
                                {isLocked ? <FaLock size={12}/> : <FaUnlock size={12}/>}
                            </button>
                        </div>
                        <div className="flex bg-white/5 p-1 rounded-[1.5rem] border border-white/10">
                            {["Explain", "Quiz"].map(m => (
                                <button key={m} onClick={() => setMode(m)} className={`px-6 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${mode === m ? 'bg-indigo-600 text-white' : 'opacity-40'}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- CHAT AREA --- */}
                <div className="flex-1 overflow-y-auto px-4 py-10 no-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {messages.map((msg, i) => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[90%] p-6 rounded-[2rem] ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none` : `${currentTheme.aiBubble} rounded-tl-none border-white/5 backdrop-blur-md`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-2xl mb-4 max-h-60 w-full object-cover shadow-lg" alt="upload" />}
                                    <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed font-medium">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{formatContent(msg.content)}</ReactMarkdown>
                                    </div>
                                    {msg.role === "ai" && msg.ytLink && (
                                        <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-3 p-3 bg-red-600/10 text-red-500 rounded-xl text-[10px] font-black hover:bg-red-600/20 transition-all border border-red-500/20 uppercase">
                                            <FaYoutube size={16}/> View visual guide
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {isSending && <div className="text-[9px] font-black uppercase tracking-widest opacity-30 animate-pulse px-4">Dhruva is thinking...</div>}
                        <div ref={messagesEndRef} className="h-20" />
                    </div>
                </div>

                {/* --- CAMERA OVERLAY --- */}
                <AnimatePresence>
                    {isCameraOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black flex flex-col">
                            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="p-8 flex justify-around items-center bg-black/50 backdrop-blur-md">
                                <button onClick={stopCamera} className="p-4 bg-white/10 rounded-full text-white"><FaTimes size={24}/></button>
                                <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-8 border-white/20" />
                                <div className="w-12" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- INPUT BAR --- */}
                <div className="p-4 md:p-10">
                    <div className="max-w-3xl mx-auto relative">
                        <AnimatePresence>
                            {selectedFile && (
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute bottom-full mb-6 left-6">
                                    <div className="relative">
                                        <img src={URL.createObjectURL(selectedFile)} className="w-28 h-28 object-cover rounded-3xl border-2 border-indigo-600 shadow-2xl" alt="preview" />
                                        <button onClick={() => setSelectedFile(null)} className="absolute -top-3 -right-3 bg-red-600 p-2 rounded-full text-white"><FaTimes size={12}/></button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className={`flex items-center gap-2 p-2 rounded-[2.5rem] border backdrop-blur-3xl shadow-2xl ${currentTheme.input}`}>
                            <button onClick={() => setShowSidebar(true)} className="p-4 text-indigo-400 lg:hidden"><FaHistory/></button>
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="What are we learning today?" className="flex-1 bg-transparent px-4 py-4 outline-none font-bold text-sm" />
                            <div className="flex items-center gap-1 px-2">
                                <button onClick={startCamera} className="p-3 opacity-40 hover:opacity-100 transition-all text-indigo-400"><FaCamera size={18}/></button>
                                <input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])} />
                                <button onClick={() => fileInputRef.current.click()} className="p-3 opacity-40 hover:opacity-100 transition-all text-indigo-400"><FaImage size={18}/></button>
                                <button onClick={sendMessage} disabled={isSending} className={`p-5 rounded-full shadow-lg active:scale-90 transition-all ${currentTheme.button} text-white`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" size={14}/> : <FaPaperPlane size={14}/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
