import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaMicrophone, 
    FaImage, FaPlus, FaHistory, FaUnlock, FaYoutube, FaTrash, 
    FaClock, FaPlay, FaStop, FaVolumeUp, FaMedal, FaTrophy, FaStar 
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- UX ENHANCED STUDY TIMER ---
const StudyTimer = ({ currentTheme, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            onComplete();
            toast.success("Focus Session Complete! Points Earned! 🏆");
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft, onComplete]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <motion.div drag dragMomentum={false} className="fixed z-[100] right-6 top-24 hidden md:block">
            <motion.div 
                animate={{ width: isOpen ? "220px" : "54px", height: isOpen ? "240px" : "54px", borderRadius: isOpen ? "24px" : "50%" }}
                className={`flex flex-col overflow-hidden border shadow-2xl backdrop-blur-2xl ${currentTheme.aiBubble} border-white/10 cursor-pointer`}
            >
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-400"><FaClock size={20}/></button>
                ) : (
                    <div className="p-4 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[9px] font-black uppercase opacity-50 tracking-tighter">Deep Focus</span>
                            <button onClick={() => setIsOpen(false)}><FaTimes size={12}/></button>
                        </div>
                        <h2 className="text-4xl font-black mb-4 text-center font-mono">{formatTime(timeLeft)}</h2>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {[25, 45].map(m => (
                                <button key={m} onClick={() => {setTimeLeft(m*60); setIsActive(true)}} className="py-2.5 rounded-xl bg-white/5 hover:bg-indigo-600 text-[10px] font-bold transition-all">{m}m</button>
                            ))}
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setIsActive(!isActive)} className="p-4 rounded-full bg-indigo-600 text-white shadow-lg"><FaPlay size={12}/></button>
                            <button onClick={() => {setTimeLeft(0); setIsActive(false)}} className="p-4 rounded-full bg-red-500/20 text-red-500"><FaStop size={12}/></button>
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
    const [userData, setUserData] = useState({ board: "", class: "", language: "English", xp: 0 });
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
        DeepSpace: { container: "bg-[#050505] text-white", aiBubble: "bg-white/[0.03] border-white/10", userBubble: "bg-indigo-600", input: "bg-white/[0.02] border-white/10", button: "bg-indigo-600", sidebar: "bg-[#0A0A0A] border-white/5" },
        Light: { container: "bg-gray-50 text-gray-900", aiBubble: "bg-white border-gray-200 shadow-sm", userBubble: "bg-indigo-600 text-white", input: "bg-white border-gray-300", button: "bg-indigo-600", sidebar: "bg-white border-gray-200" },
        Sakura: { container: "bg-[#1a0f12] text-rose-50", aiBubble: "bg-rose-500/10 border-rose-500/20", userBubble: "bg-rose-600", input: "bg-rose-500/5 border-rose-500/10", button: "bg-rose-600", sidebar: "bg-[#221418] border-rose-500/10" },
        Cyberpunk: { container: "bg-[#0a0512] text-cyan-50", aiBubble: "bg-cyan-500/10 border-cyan-500/30", userBubble: "bg-fuchsia-600", input: "bg-cyan-500/5 border-cyan-500/10", button: "bg-cyan-600", sidebar: "bg-[#120a1a] border-cyan-500/20" }
    };
    const currentTheme = themes[theme] || themes.DeepSpace;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

    const fetchSessions = async () => {
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const handleAchievement = async () => {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, { xp: increment(10) });
        setUserData(prev => ({ ...prev, xp: prev.xp + 10 }));
    };

    const sendMessage = async () => {
        if (isSending || (!input.trim() && !selectedFile)) return;
        setIsSending(true);
        const textToSend = input;
        const file = selectedFile;
        setInput(""); setSelectedFile(null);

        const userMsg = { role: "user", content: textToSend || "Image Analysis", image: file ? URL.createObjectURL(file) : null };
        const updatedMsgs = [...messages, userMsg];
        setMessages(updatedMsgs);

        try {
            const payload = { 
                userId: currentUser.uid, 
                message: textToSend, 
                mode, 
                subject: subjectInput, 
                chapter: chapterInput, 
                language: userData.language, 
                classLevel: userData.class, 
                board: userData.board 
            };
            let res;
            if (file) {
                const compressed = await imageCompression(file, { maxSizeMB: 0.4 });
                const fd = new FormData();
                fd.append("photo", compressed);
                Object.keys(payload).forEach(k => fd.append(k, payload[k]));
                res = await axios.post(`${API_BASE}/chat/photo`, fd);
            } else {
                res = await axios.post(`${API_BASE}/chat`, payload);
            }

            const ytQuery = `${userData.board} class ${userData.class} ${subjectInput} ${chapterInput} lesson`.trim();
            const aiMsg = { 
                role: "ai", 
                content: res.data.reply, 
                ytLink: subjectInput ? `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}` : null 
            };
            
            const finalMsgs = [...updatedMsgs, aiMsg];
            setMessages(finalMsgs);
            
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: finalMsgs, lastUpdate: Date.now(), title: subjectInput || textToSend.slice(0, 15)
            }, { merge: true });
            fetchSessions();
            handleAchievement();
        } catch (e) { toast.error("Error connecting to AI"); }
        setIsSending(false);
    };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-500 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" />
            
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[200] w-72 h-full flex flex-col p-6 shadow-2xl backdrop-blur-xl ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-2">
                                <FaMedal className="text-yellow-500"/>
                                <span className="text-[10px] font-black uppercase tracking-widest">{userData.xp} XP</span>
                            </div>
                            <button onClick={() => setShowSidebar(false)} className="p-2 opacity-50"><FaTimes/></button>
                        </div>
                        <button onClick={() => {setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false)}} className="w-full py-4 mb-6 rounded-2xl bg-indigo-600 text-white font-bold text-xs tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <FaPlus size={10}/> NEW CHAT
                        </button>
                        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                            {sessions.map(s => (
                                <div key={s.id} onClick={() => {setCurrentSessionId(s.id); setMessages(s.messages || []); setShowSidebar(false)}} className={`group p-4 rounded-xl cursor-pointer transition-all border ${currentSessionId === s.id ? 'bg-indigo-600/10 border-indigo-600/20' : 'border-transparent hover:bg-black/5'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold truncate pr-4">{s.title || "Study Session"}</span>
                                        <FaTrash onClick={(e) => {e.stopPropagation(); deleteDoc(doc(db, `users/${currentUser.uid}/sessions`, s.id)); fetchSessions();}} className="opacity-0 group-hover:opacity-100 text-red-500 text-[10px]"/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col h-full relative min-w-0">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
                <StudyTimer currentTheme={currentTheme} onComplete={handleAchievement} />

                {/* MODE SELECTOR */}
                <div className="w-full max-w-5xl mx-auto px-4 pt-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className={`flex-1 flex items-center gap-2 p-1.5 rounded-2xl border ${currentTheme.input} shadow-sm backdrop-blur-md`}>
                            <input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject" className="flex-1 bg-transparent px-3 py-1 text-xs font-bold outline-none" />
                            <input disabled={isLocked} value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Chapter" className="flex-1 bg-transparent px-3 py-1 text-xs font-bold outline-none border-l border-white/10" />
                            <button onClick={() => setIsLocked(!isLocked)} className={`p-2.5 rounded-xl transition-all ${isLocked ? 'bg-emerald-600 text-white' : 'text-indigo-500 bg-white/10'}`}>
                                {isLocked ? <FaLock size={12}/> : <FaUnlock size={12}/>}
                            </button>
                        </div>
                        <div className={`flex flex-wrap p-1 rounded-2xl border ${currentTheme.input} gap-1`}>
                            {["Explain", "Quiz", "Summary", "Homework"].map(m => (
                                <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MESSAGES */}
                <div className="flex-1 overflow-y-auto px-4 py-8 no-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {messages.map((msg, i) => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[90%] p-6 rounded-[2rem] shadow-xl ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none text-white` : `${currentTheme.aiBubble} rounded-tl-none backdrop-blur-md border-white/5`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-2xl mb-4 max-h-60 w-full object-cover shadow-lg" alt="upload" />}
                                    <div className="prose prose-sm prose-invert max-w-none text-sm font-medium leading-relaxed tracking-tight">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                    </div>
                                    {msg.role === "ai" && msg.ytLink && (
                                        <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-3 p-3 bg-red-600/10 text-red-500 rounded-xl text-[10px] font-black hover:bg-red-600/20 transition-all border border-red-500/20 uppercase tracking-widest">
                                            <FaYoutube size={16}/> View Visual Guide
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {isSending && <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 animate-pulse px-4">Dhruva is processing...</div>}
                        <div ref={messagesEndRef} className="h-10" />
                    </div>
                </div>

                {/* TRIPLE INPUT DOCK */}
                <div className="p-4 md:p-8">
                    <div className="max-w-3xl mx-auto relative">
                        {selectedFile && (
                            <div className="absolute bottom-full mb-4 left-0 group">
                                <img src={URL.createObjectURL(selectedFile)} className="w-24 h-24 object-cover rounded-2xl border-2 border-indigo-600 shadow-2xl" alt="preview" />
                                <button onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg"><FaTimes size={10}/></button>
                            </div>
                        )}
                        <div className={`flex items-center gap-1 p-2 rounded-[2.5rem] border shadow-2xl backdrop-blur-3xl ${currentTheme.input}`}>
                            <button onClick={() => setShowSidebar(true)} className="p-4 text-indigo-500 lg:hidden hover:bg-white/5 rounded-full"><FaHistory/></button>
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder={`Ask for ${mode.toLowerCase()}...`} className="flex-1 bg-transparent px-4 py-2 outline-none text-sm font-bold placeholder:opacity-30" />
                            
                            <div className="flex items-center gap-1 sm:gap-2 pr-2">
                                <button onClick={() => setIsCameraOpen(true)} className="p-2.5 text-indigo-500 opacity-50 hover:opacity-100 transition-all"><FaCamera size={18}/></button>
                                <input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])} />
                                <button onClick={() => fileInputRef.current.click()} className="p-2.5 text-indigo-500 opacity-50 hover:opacity-100 transition-all"><FaImage size={18}/></button>
                                <button onClick={sendMessage} disabled={isSending} className={`p-5 rounded-full ${currentTheme.button} text-white shadow-lg active:scale-90 transition-all flex items-center justify-center`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" size={14}/> : <FaPaperPlane size={14}/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CAMERA */}
                <AnimatePresence>
                    {isCameraOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black flex flex-col">
                            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="p-10 flex justify-between items-center bg-black/90 backdrop-blur-xl">
                                <button onClick={() => setIsCameraOpen(false)} className="p-5 bg-white/10 rounded-full text-white"><FaTimes size={20}/></button>
                                <button onClick={() => {
                                    const context = canvasRef.current.getContext("2d");
                                    canvasRef.current.width = videoRef.current.videoWidth;
                                    canvasRef.current.height = videoRef.current.videoHeight;
                                    context.drawImage(videoRef.current, 0, 0);
                                    canvasRef.current.toBlob(blob => {
                                        setSelectedFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
                                        setIsCameraOpen(false);
                                    }, "image/jpeg", 0.7);
                                }} className="w-20 h-20 bg-white rounded-full border-[6px] border-white/30 shadow-2xl active:scale-90 transition-all" />
                                <div className="w-10" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
