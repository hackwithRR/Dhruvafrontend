import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaUndo, FaImage, FaPlus, FaHistory, FaUnlock, FaChevronDown, FaYoutube } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- TYPEWRITER COMPONENT (Only for latest message) ---
const Typewriter = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [cursor, setCursor] = useState(true);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.substring(0, i + 1));
            i++;
            if (i >= text.length) {
                clearInterval(interval);
                setCursor(false);
                if (onComplete) onComplete();
            }
        }, 20); 
        return () => clearInterval(interval);
    }, [text]);

    return (
        <div className="relative">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedText}</ReactMarkdown>
            {cursor && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} className="inline-block w-1 h-5 bg-indigo-500 ml-1" />}
        </div>
    );
};

export default function Chat() {
    const { currentUser, logout } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [isSending, setIsSending] = useState(false);
    const [theme, setTheme] = useState("dark");
    const [userData, setUserData] = useState({ board: "", class: "", language: "English" });
    const [showSetup, setShowSetup] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    const [isLocked, setIsLocked] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");

    const [showSidebar, setShowSidebar] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraFacing, setCameraFacing] = useState("environment");

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const themes = {
        dark: {
            container: "bg-[#050505] text-white",
            nav: "bg-white/5 border-white/10 backdrop-blur-md",
            aiBubble: "bg-white/5 border border-white/10",
            userBubble: "bg-indigo-600 shadow-lg shadow-indigo-500/20",
            input: "bg-white/[0.03] border-white/10 text-white",
            button: "bg-indigo-600",
            sidebar: "bg-[#0A0A0A] border-r border-white/10"
        },
        light: {
            container: "bg-[#F0F7FF] text-[#1E293B]",
            nav: "bg-white/80 border-blue-100 backdrop-blur-md shadow-sm",
            aiBubble: "bg-white border border-blue-50 shadow-md shadow-blue-900/5",
            userBubble: "bg-[#2563EB] text-white shadow-lg shadow-blue-500/30",
            input: "bg-white border-blue-100 text-[#1E293B] shadow-inner",
            button: "bg-[#2563EB]",
            sidebar: "bg-white border-r border-blue-100"
        },
        electric: {
            container: "bg-[#0F172A] text-white",
            nav: "bg-indigo-600/10 border-indigo-500/20",
            aiBubble: "bg-white/10 border border-indigo-500/30",
            userBubble: "bg-gradient-to-r from-purple-600 to-indigo-600",
            input: "bg-white/5 border-indigo-500/20 text-white",
            button: "bg-gradient-to-r from-pink-500 to-violet-600",
            sidebar: "bg-[#0F172A] border-r border-indigo-500/20"
        }
    };

    const currentTheme = themes[theme] || themes.dark;

    useEffect(() => {
        if (!currentUser) return;
        const checkUserSetup = async () => {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setMessages(data.messages || []);
                setUserData({ board: data.board || "", class: data.class || "", language: data.language || "English" });
                if (!data.board || !data.class) setShowSetup(true);
            } else { setShowSetup(true); }
        };
        checkUserSetup();
    }, [currentUser]);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    const sendMessage = async () => {
        if (!currentUser || isSending || (!input.trim() && !selectedFile)) return;
        const file = selectedFile;
        const text = input;

        setIsSending(true);
        setSelectedFile(null);
        setInput("");

        const userMsg = {
            role: "user",
            content: text || "Analyzing attachment...",
            image: file ? URL.createObjectURL(file) : null,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);

        try {
            const payload = {
                userId: currentUser.uid,
                message: text || "Explain this image",
                mode,
                subject: subjectInput || "General",
                chapter: chapterInput || "General",
                language: userData.language,
                classLevel: userData.class
            };

            let res;
            if (file) {
                const formData = new FormData();
                const compressed = await imageCompression(file, { maxSizeMB: 0.7 });
                formData.append("photo", compressed);
                Object.keys(payload).forEach(k => formData.append(k, payload[k]));
                res = await axios.post(`${API_BASE}/chat/photo`, formData);
            } else {
                res = await axios.post(`${API_BASE}/chat`, payload);
            }

            // --- REFINED YOUTUBE SEARCH LOGIC ---
            // Priority: Chapter + Subject + Class > Subject + Class > Message Context
            let searchQuery = "";
            if (chapterInput && subjectInput) {
                searchQuery = `${userData.class} ${subjectInput} ${chapterInput} concept`;
            } else if (subjectInput) {
                searchQuery = `${userData.class} ${subjectInput} lesson`;
            } else {
                searchQuery = `${userData.class} ${text.slice(0, 30)} explanation`;
            }

            const aiMsg = { 
                role: "ai", 
                content: res.data.reply, 
                ytLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
                timestamp: Date.now() 
            };
            
            setMessages(prev => [...prev, aiMsg]);
            await updateDoc(doc(db, "users", currentUser.uid), { messages: arrayUnion(userMsg, aiMsg) });
        } catch (e) { toast.error("Server connection failed"); }
        setIsSending(false);
    };

    const closeCamera = () => { if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop()); setIsCameraOpen(false); };
    const openCamera = async () => { setIsCameraOpen(true); try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing } }); if (videoRef.current) videoRef.current.srcObject = s; } catch (e) { setIsCameraOpen(false); } };
    const capturePhoto = () => { const c = canvasRef.current; const v = videoRef.current; c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); c.toBlob(b => { setSelectedFile(new File([b], "cap.jpg", { type: "image/jpeg" })); closeCamera(); }, "image/jpeg", 0.8); };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-700 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" limit={1} />
            <style>{`.custom-y-scroll::-webkit-scrollbar { width: 4px; } .custom-y-scroll::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.2); border-radius: 10px; }`}</style>

            {/* SIDEBAR */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[150] w-72 h-full flex flex-col p-6 overflow-hidden ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-10">
                            <span className="text-[10px] font-black tracking-widest uppercase opacity-40">History</span>
                            <button onClick={() => setShowSidebar(false)} className="lg:hidden text-white/50"><FaTimes /></button>
                        </div>
                        <button onClick={() => { setMessages([]); setShowSidebar(false) }} className="w-full py-4 mb-4 rounded-2xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2">
                            <FaPlus /> New Terminal
                        </button>
                        <div className="flex-1 overflow-y-auto space-y-4 custom-y-scroll">
                            {messages.filter(m => m.role === 'user').slice(-10).map((m, i) => (
                                <div key={i} className="text-[10px] font-bold text-white/30 uppercase truncate border-b border-white/5 pb-2">{m.content}</div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />

                {/* TOP BAR: MODES & SUBJECT LOCK */}
                <div className="max-w-4xl mx-auto w-full px-4 pt-4 flex items-center gap-3">
                    <button onClick={() => setShowSidebar(!showSidebar)} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white"><FaHistory size={14} /></button>
                    <div className={`flex-1 flex flex-col md:flex-row gap-2 p-2 rounded-2xl border transition-all ${isLocked ? 'border-green-500/50 bg-green-500/5' : currentTheme.nav}`}>
                        <div className="flex flex-1 items-center gap-2 px-2">
                            <input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject..." className={`flex-1 bg-transparent text-[10px] font-black uppercase outline-none ${isLocked ? 'text-green-500' : 'opacity-60'}`} />
                            <input disabled={isLocked} value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Chapter..." className={`w-24 bg-transparent text-[10px] font-black uppercase outline-none ${isLocked ? 'text-green-500' : 'opacity-60'}`} />
                            <button onClick={() => setIsLocked(!isLocked)} className={`p-2.5 rounded-xl transition-all ${isLocked ? "bg-green-500 text-white" : "bg-white/5 text-white/20"}`}>
                                {isLocked ? <FaLock size={12} /> : <FaUnlock size={12} />}
                            </button>
                        </div>
                        <div className="flex bg-black/20 p-1 rounded-xl gap-1">
                            {["Explain", "Doubt", "Quiz"].map(m => (
                                <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 text-[9px] font-[1000] uppercase rounded-lg transition-all ${mode === m ? "bg-white text-black" : "opacity-30"}`}>{m}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CHAT AREA */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-8 custom-y-scroll scroll-smooth">
                    <div className="max-w-3xl mx-auto space-y-12">
                        {messages.map((msg, i) => (
                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[85%] p-6 rounded-[2.2rem] ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none` : `${currentTheme.aiBubble} rounded-tl-none`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-2xl mb-4 max-h-64 w-full object-cover" alt="upload" />}
                                    
                                    <div className={`prose prose-sm ${theme === 'light' ? 'prose-slate' : 'prose-invert'} text-sm leading-relaxed font-medium space-y-4`}>
                                        {msg.role === "ai" && i === messages.length - 1 && !isSending ? (
                                            <Typewriter text={msg.content} onComplete={scrollToBottom} />
                                        ) : (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                        )}
                                    </div>

                                    {/* VIDEO RECOMMENDATION */}
                                    {msg.role === "ai" && msg.ytLink && (
                                        <div className="mt-6 pt-4 border-t border-white/10">
                                            <p className="text-[10px] font-bold uppercase opacity-40 mb-2">Visual Learning Recommended:</p>
                                            <a href={msg.ytLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-5 py-3 bg-red-600/10 text-red-500 rounded-2xl text-xs font-bold hover:bg-red-600/20 transition-all border border-red-500/20">
                                                <FaYoutube size={18} /> Watch {chapterInput || "Concept"} Video
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {isSending && <div className="text-[10px] font-black uppercase opacity-30 animate-pulse px-4">Dhruva is processing...</div>}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>

                {/* INPUT BAR */}
                <div className="p-4 md:p-10 shrink-0">
                    <div className="max-w-3xl mx-auto relative">
                        <AnimatePresence>
                            {selectedFile && (
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-full mb-6 left-4">
                                    <img src={URL.createObjectURL(selectedFile)} className="w-24 h-24 object-cover rounded-[2rem] border-2 border-indigo-500 shadow-2xl" alt="preview" />
                                    <button onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-500 p-2 rounded-full text-white"><FaTimes size={10} /></button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className={`flex items-center p-2 rounded-[2.8rem] border shadow-2xl transition-all ${currentTheme.input}`}>
                            <input value={input} onChange={e => setInput(e.target.value)} placeholder={`Ask in ${userData.language}...`} className="flex-1 bg-transparent px-6 py-4 outline-none font-bold text-sm" onKeyDown={e => e.key === "Enter" && sendMessage()} />
                            <div className="flex items-center gap-2 px-2">
                                <input type="file" ref={fileInputRef} hidden onChange={(e) => setSelectedFile(e.target.files[0])} />
                                <button onClick={() => fileInputRef.current.click()} className="p-3 opacity-30 hover:opacity-100 transition-all"><FaImage /></button>
                                <button onClick={openCamera} className="p-3 opacity-30 hover:opacity-100 transition-all"><FaCamera /></button>
                                <button onClick={sendMessage} disabled={isSending} className={`p-5 rounded-full active:scale-90 transition-all ${currentTheme.button}`}>
                                    {isSending ? <FaSyncAlt className="animate-spin text-white" /> : <FaPaperPlane className="text-white" size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CAMERA */}
                <AnimatePresence>
                    {isCameraOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-between p-6">
                            <div className="w-full flex justify-between p-4 text-white">
                                <button onClick={closeCamera} className="p-4 bg-white/5 rounded-full"><FaTimes size={20} /></button>
                                <button onClick={() => setCameraFacing(f => f === 'user' ? 'environment' : 'user')} className="p-4 bg-white/5 rounded-full"><FaUndo /></button>
                            </div>
                            <video ref={videoRef} autoPlay playsInline className="w-full max-w-md aspect-[3/4] object-cover rounded-[3rem] border border-white/10" />
                            <button onClick={capturePhoto} className="mb-10 w-24 h-24 rounded-full border-4 border-white flex items-center justify-center active:scale-95"><div className="w-16 h-16 bg-white rounded-full" /></button>
                            <canvas ref={canvasRef} className="hidden" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
