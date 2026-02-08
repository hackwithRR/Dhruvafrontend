import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaMicrophone, 
    FaImage, FaPlus, FaHistory, FaUnlock, FaYoutube, FaTrash, 
    FaClock, FaPlay, FaStop, FaTrophy, FaMagic 
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- STUDY TIMER (MOBILE OPTIMIZED) ---
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
            onComplete(true);
            toast.success("Focus Session Complete! Rank Points Added! 🏆");
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft, onComplete]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <motion.div drag dragMomentum={false} className="fixed z-[100] right-4 top-20 md:right-6 md:top-24 scale-90 md:scale-100">
            <motion.div 
                animate={{ width: isOpen ? "220px" : "48px", height: isOpen ? "250px" : "48px", borderRadius: isOpen ? "28px" : "50%" }}
                className={`flex flex-col overflow-hidden border shadow-2xl backdrop-blur-3xl ${currentTheme.aiBubble} border-white/10 cursor-pointer`}
            >
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-400"><FaClock size={18}/></button>
                ) : (
                    <div className="p-4 flex flex-col h-full items-center justify-between">
                        <div className="flex justify-between w-full items-center"><span className="text-[9px] font-black uppercase opacity-40">Zen Mode</span><button onClick={() => setIsOpen(false)}><FaTimes size={12}/></button></div>
                        <h2 className="text-4xl font-black font-mono">{formatTime(timeLeft)}</h2>
                        <div className="grid grid-cols-3 gap-1 w-full">{[10, 25, 45].map(m => (<button key={m} onClick={() => {setTimeLeft(m*60); setIsActive(true)}} className="py-1.5 rounded-lg bg-white/5 text-[8px] font-black">{m}m</button>))}</div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsActive(!isActive)} className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">{isActive ? <FaStop size={12}/> : <FaPlay size={12}/>}</button>
                            <button onClick={() => setTimeLeft(0)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><FaTrash size={12}/></button>
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
    const [isListening, setIsListening] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const recognitionRef = useRef(null);

    const themes = {
        DeepSpace: { container: "bg-[#050505] text-white", aiBubble: "bg-white/[0.03] border-white/10", userBubble: "bg-indigo-600", input: "bg-white/[0.02] border-white/10", button: "bg-indigo-600", sidebar: "bg-[#0A0A0A] border-white/5" },
        Light: { container: "bg-gray-50 text-gray-900", aiBubble: "bg-white border-gray-200 shadow-sm", userBubble: "bg-indigo-600 text-white", input: "bg-white border-gray-300 shadow-inner", button: "bg-indigo-600", sidebar: "bg-white border-gray-200" },
        Sakura: { container: "bg-[#1a0f12] text-rose-50", aiBubble: "bg-rose-500/10 border-rose-500/20", userBubble: "bg-rose-600", input: "bg-rose-500/5 border-rose-500/10", button: "bg-rose-600", sidebar: "bg-[#221418] border-rose-500/10" },
        Cyberpunk: { container: "bg-[#0a0512] text-cyan-50", aiBubble: "bg-cyan-500/10 border-cyan-500/30", userBubble: "bg-fuchsia-600", input: "bg-cyan-500/5 border-cyan-500/10", button: "bg-cyan-600", sidebar: "bg-[#120a1a] border-cyan-500/20" }
    };
    const currentTheme = themes[theme] || themes.DeepSpace;

    // --- CONTINUOUS VOICE LOOP ---
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.onresult = (e) => setInput(Array.from(e.results).map(r => r[0].transcript).join(''));
            recognitionRef.current.onend = () => isListening && recognitionRef.current.start();
        }
    }, [isListening]);

    const toggleVoice = () => {
        if (isListening) { recognitionRef.current.stop(); setIsListening(false); if (input.trim()) sendMessage(); }
        else { setInput(""); recognitionRef.current.start(); setIsListening(true); }
    };

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isSending]);

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

    const handleAchievement = async (isTimer = false) => {
        const userRef = doc(db, "users", currentUser.uid);
        const xpGain = isTimer ? 50 : 10;
        await updateDoc(userRef, { xp: increment(xpGain) });
        setUserData(prev => ({ ...prev, xp: prev.xp + xpGain }));
    };

    const sendMessage = async (customInput = null) => {
        const textToUse = customInput || input;
        if (isSending || (!textToUse.trim() && !selectedFile)) return;
        
        setIsSending(true);
        const textToSend = textToUse;
        const file = selectedFile;
        setInput(""); setSelectedFile(null);

        const userMsg = { role: "user", content: textToSend || "Analyzing Image", image: file ? URL.createObjectURL(file) : null };
        const updatedMsgs = [...messages, userMsg];
        setMessages(updatedMsgs);

        try {
            // Standardize Maths/Mathematics
            const standardizedSubject = subjectInput.toLowerCase().startsWith("math") ? "Mathematics" : subjectInput;

            const payload = { 
                userId: currentUser.uid, 
                message: textToSend, 
                mode, 
                subject: standardizedSubject, 
                chapter: chapterInput, 
                language: userData.language, 
                classLevel: userData.class, 
                board: userData.board,
                systemContext: "Strictly follow CBSE/ICSE chapter list provided in history. Ensure accurate numbering."
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

            // SMART YOUTUBE LOGIC: Only for specific educational triggers
            const eduTriggers = /(how|explain|steps|tutorial|visual|mechanism|derivation|diagram|experiment)/i;
            const needsVideo = eduTriggers.test(textToSend) || mode === "Explain";
            const ytQuery = `${userData.board} class ${userData.class} ${standardizedSubject} ${chapterInput} ${textToSend}`.trim();
            
            const aiMsg = { 
                role: "ai", 
                content: res.data.reply, 
                ytLink: needsVideo ? `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}` : null,
                suggestions: ["Give Example", "Key Formula", "Quiz Me"]
            };
            
            const finalMsgs = [...updatedMsgs, aiMsg];
            setMessages(finalMsgs);
            
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: finalMsgs, lastUpdate: Date.now(), title: subjectInput || textToSend.slice(0, 15)
            }, { merge: true });
            fetchSessions();
            handleAchievement();
        } catch (e) { toast.error("Synthesis failed. Check connection."); }
        setIsSending(false);
    };

    return (
        <div className={`flex h-[100dvh] w-full overflow-hidden transition-all duration-500 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" autoClose={2000} hideProgressBar />
            
            {/* SIDEBAR OVERLAY */}
            <AnimatePresence>
                {showSidebar && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/70 z-[150] backdrop-blur-md lg:hidden" />
                        <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[200] w-[85%] md:w-72 h-full flex flex-col p-6 shadow-2xl ${currentTheme.sidebar}`}>
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-2"><FaTrophy className="text-yellow-500"/><span className="text-xs font-black uppercase italic tracking-widest">{userData.xp} XP</span></div>
                                <button onClick={() => setShowSidebar(false)} className="p-2 opacity-30"><FaTimes/></button>
                            </div>
                            <button onClick={() => {setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false)}} className="w-full py-4 mb-6 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest uppercase shadow-lg shadow-indigo-600/20"><FaPlus className="inline mr-2"/> New Session</button>
                            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                                {sessions.map(s => (
                                    <div key={s.id} onClick={() => {setCurrentSessionId(s.id); setMessages(s.messages || []); setShowSidebar(false)}} className={`p-4 rounded-xl border transition-all ${currentSessionId === s.id ? 'bg-indigo-600/10 border-indigo-600/20' : 'border-transparent hover:bg-white/5'}`}>
                                        <span className="text-[10px] font-black truncate block uppercase tracking-tighter">{s.title || "Study Session"}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col h-full relative min-w-0">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} userData={userData}/>
                <StudyTimer currentTheme={currentTheme} onComplete={handleAchievement} />

                {/* SELECTORS (NON-CONGESTED MOBILE UI) */}
                <div className="w-full max-w-5xl mx-auto px-4 pt-4 flex flex-col gap-3">
                    <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${currentTheme.input} backdrop-blur-md shadow-sm`}>
                        <input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject" className="w-[35%] bg-transparent px-2 py-1 text-[10px] font-black uppercase outline-none placeholder:opacity-20" />
                        <div className="h-4 w-[1px] bg-white/10"/>
                        <input disabled={isLocked} value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Topic / Chapter" className="flex-1 bg-transparent px-2 py-1 text-[10px] font-black uppercase outline-none placeholder:opacity-20" />
                        <button onClick={() => setIsLocked(!isLocked)} className={`p-2.5 rounded-lg transition-all ${isLocked ? 'bg-emerald-600 shadow-lg text-white' : 'bg-white/5 text-indigo-500'}`}><FaLock size={10}/></button>
                    </div>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                        {["Explain", "Quiz", "Summary", "Homework"].map(m => (
                            <button key={m} onClick={() => setMode(m)} className={`px-5 py-2.5 text-[9px] font-black uppercase rounded-lg transition-all whitespace-nowrap ${mode === m ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white/5 opacity-40 hover:opacity-100'}`}>{m}</button>
                        ))}
                    </div>
                </div>

                {/* MESSAGES (RESPONSIVE) */}
                <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {messages.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center opacity-10 text-center">
                                <FaMagic size={32} className="mb-4"/><h3 className="font-black uppercase tracking-[0.3em] text-xs">Neural Engine Ready</h3>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[94%] md:max-w-[85%] p-6 rounded-2xl md:rounded-[2.5rem] shadow-xl ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none text-white` : `${currentTheme.aiBubble} rounded-tl-none border-white/5 backdrop-blur-md`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-xl mb-4 max-h-64 w-full object-cover shadow-lg border border-white/10" alt="upload" />}
                                    <div className="prose prose-sm prose-invert max-w-none text-xs md:text-sm font-medium leading-relaxed">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                    </div>
                                    {msg.role === "ai" && msg.ytLink && (
                                        <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-5 flex items-center justify-center gap-3 py-3.5 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:brightness-110 transition-all">
                                            <FaYoutube size={16}/> Stream Simulation
                                        </a>
                                    )}
                                    {msg.role === "ai" && i === messages.length - 1 && (
                                        <div className="mt-6 flex flex-wrap gap-2">
                                            {msg.suggestions?.map((s, idx) => (<button key={idx} onClick={() => sendMessage(s)} className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-[8px] font-black uppercase hover:bg-indigo-600 transition-all">{s}</button>))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {isSending && <div className="flex items-center gap-2 px-4 text-[8px] font-black uppercase tracking-[0.2em] text-indigo-500 animate-pulse"><FaSyncAlt className="animate-spin"/> Synthesis...</div>}
                        <div ref={messagesEndRef} className="h-24" />
                    </div>
                </div>

                {/* BOTTOM ACTION BAR (MOBILE FIXED) */}
                <div className="p-3 md:p-10 relative bg-gradient-to-t from-black/40 via-transparent to-transparent">
                    <div className="max-w-3xl mx-auto relative">
                        {isListening && <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-5 py-2 rounded-full text-[9px] font-black animate-bounce shadow-xl">LISTENING...</div>}
                        <div className={`flex items-center gap-1 p-1.5 rounded-[2.5rem] border shadow-2xl backdrop-blur-3xl transition-all ${currentTheme.input}`}>
                            <button onClick={() => setShowSidebar(true)} className="p-4 text-indigo-500 lg:hidden active:scale-75 transition-transform"><FaHistory size={18}/></button>
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask Dhruva AI..." className="flex-1 bg-transparent px-3 py-2 outline-none text-xs md:text-sm font-bold placeholder:opacity-20" />
                            <div className="flex items-center gap-1 pr-1">
                                <button onClick={toggleVoice} className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'text-indigo-500 hover:bg-white/5'}`}><FaMicrophone size={18}/></button>
                                <button onClick={() => setIsCameraOpen(true)} className="p-3 text-indigo-500 hover:bg-white/5 rounded-full hidden xs:block"><FaCamera size={18}/></button>
                                <input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])} />
                                <button onClick={() => fileInputRef.current.click()} className="p-3 text-indigo-500 hover:bg-white/5 rounded-full"><FaImage size={18}/></button>
                                <button onClick={() => sendMessage()} disabled={isSending} className={`p-5 rounded-full ${currentTheme.button} text-white shadow-xl flex items-center justify-center active:scale-75 transition-all hover:brightness-125`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" size={14}/> : <FaPaperPlane size={14}/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CAMERA OVERLAY */}
                <AnimatePresence>
                    {isCameraOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex flex-col">
                            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="p-10 flex justify-between items-center bg-black/90 backdrop-blur-xl border-t border-white/10">
                                <button onClick={() => setIsCameraOpen(false)} className="p-5 bg-white/10 rounded-full text-white hover:bg-red-500 transition-all"><FaTimes size={20}/></button>
                                <button onClick={() => {
                                    const ctx = canvasRef.current.getContext("2d");
                                    canvasRef.current.width = videoRef.current.videoWidth;
                                    canvasRef.current.height = videoRef.current.videoHeight;
                                    ctx.drawImage(videoRef.current, 0, 0);
                                    canvasRef.current.toBlob(b => { setSelectedFile(new File([b], "shot.jpg", {type: "image/jpeg"})); setIsCameraOpen(false); }, "image/jpeg", 0.8);
                                }} className="w-20 h-20 bg-white rounded-full border-[6px] border-white/20 shadow-2xl active:scale-90 transition-all" />
                                <div className="w-10" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
