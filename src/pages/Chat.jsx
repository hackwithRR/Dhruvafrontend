import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaUndo, FaImage, FaPlus, FaHistory, FaUnlock, FaChevronDown } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

// --- API CONFIGURATION ---
const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- TYPEWRITER HELPER COMPONENT ---
const Typewriter = ({ text, delay = 10, onComplete }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            setDisplayedText(text.substring(0, i + 1));
            i++;
            if (i >= text.length) {
                clearInterval(timer);
                setIsFinished(true);
                if (onComplete) onComplete();
            }
        }, delay);
        return () => clearInterval(timer);
    }, [text, delay, onComplete]);

    return <ReactMarkdown>{displayedText}</ReactMarkdown>;
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
                setUserData({
                    board: data.board || "",
                    class: data.class || "",
                    language: data.language || "English"
                });
                if (!data.board || !data.class || !data.language) setShowSetup(true);
            } else {
                setShowSetup(true);
            }
        };
        checkUserSetup();
    }, [currentUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isSending]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleScroll = (e) => {
        const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 100;
        setShowScrollBtn(!bottom);
    };

    const saveSetup = async () => {
        if (!userData.board || !userData.class || !userData.language) return toast.warning("Complete all fields!");
        try {
            await setDoc(doc(db, "users", currentUser.uid), userData, { merge: true });
            setShowSetup(false);
            toast.success("Profile Initialized");
        } catch (e) {
            toast.error("Setup failed");
        }
    };

    const sendMessage = async () => {
        if (!currentUser || isSending || (!input.trim() && !selectedFile)) return;
        const file = selectedFile;
        const text = input;

        setIsSending(true);
        setSelectedFile(null);
        setInput("");

        const userMsg = {
            role: "user",
            content: text || "Analyzing Attachment...",
            image: file ? URL.createObjectURL(file) : null,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);

        try {
            const payload = {
                userId: currentUser.uid,
                message: text || "Explain the attached image",
                mode,
                subject: subjectInput.trim() || "General",
                chapter: chapterInput.trim() || "General",
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

            const aiMsg = { role: "ai", content: res.data.reply, timestamp: Date.now() };
            setMessages(prev => [...prev, aiMsg]);
            await updateDoc(doc(db, "users", currentUser.uid), { messages: arrayUnion(userMsg, aiMsg) });
        } catch (e) {
            toast.error("Server connection failed");
        }
        setIsSending(false);
    };

    const closeCamera = () => { if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop()); setIsCameraOpen(false); };
    const openCamera = async () => { setIsCameraOpen(true); try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing } }); if (videoRef.current) videoRef.current.srcObject = s; } catch (e) { toast.error("Camera error"); setIsCameraOpen(false); } };
    const capturePhoto = () => { const c = canvasRef.current; const v = videoRef.current; c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); c.toBlob(b => { setSelectedFile(new File([b], "cap.jpg", { type: "image/jpeg" })); closeCamera(); }, "image/jpeg", 0.8); };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-700 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" limit={1} />
            <style>{`.custom-y-scroll::-webkit-scrollbar { width: 4px; } .custom-y-scroll::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.2); border-radius: 10px; }`}</style>

            <AnimatePresence>
                {showSetup && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
                        <div className="bg-[#111] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl">
                            <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">Initialize Dhruva</h2>
                            <div className="space-y-4">
                                <input className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none" placeholder="Board (e.g. CBSE)" value={userData.board} onChange={e => setUserData({ ...userData, board: e.target.value })} />
                                <input className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none" placeholder="Class (e.g. 10)" value={userData.class} onChange={e => setUserData({ ...userData, class: e.target.value })} />
                                <select className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none" value={userData.language} onChange={e => setUserData({ ...userData, language: e.target.value })}>
                                    <option value="English">English</option>
                                    <option value="Hinglish">Hinglish</option>
                                </select>
                                <button onClick={saveSetup} className="w-full py-4 bg-indigo-600 rounded-2xl font-bold">Start</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showSidebar && (
                <div className={`fixed lg:relative z-[150] w-72 h-full flex flex-col p-6 ${currentTheme.sidebar}`}>
                    <button onClick={() => setShowSidebar(false)} className="lg:hidden mb-4"><FaTimes /></button>
                    <button onClick={() => setMessages([])} className="w-full py-4 mb-4 rounded-2xl bg-indigo-600 font-bold"><FaPlus /> New Terminal</button>
                    <div className="flex-1 overflow-y-auto space-y-4 custom-y-scroll">
                        {messages.filter(m => m.role === 'user').slice(-10).map((m, i) => (
                            <div key={i} className="text-[10px] font-bold opacity-30 truncate uppercase border-b border-white/5 pb-2">{m.content}</div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />

                <div className="max-w-4xl mx-auto w-full px-4 pt-4 flex items-center gap-3">
                    <button onClick={() => setShowSidebar(!showSidebar)} className="p-4 rounded-2xl bg-white/5 border border-white/10"><FaHistory size={14} /></button>
                    <div className={`flex-1 flex gap-2 p-2 rounded-2xl border ${isLocked ? 'border-green-500/50 bg-green-500/5' : currentTheme.nav}`}>
                        <input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject" className="flex-1 bg-transparent text-[10px] font-black uppercase outline-none" />
                        <button onClick={() => setIsLocked(!isLocked)} className="p-2">{isLocked ? <FaLock size={12} className="text-green-500"/> : <FaUnlock size={12} />}</button>
                    </div>
                </div>

                <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-8 custom-y-scroll scroll-smooth">
                    <div className="max-w-3xl mx-auto space-y-12">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[85%] p-6 rounded-[2.2rem] ${msg.role === "user" ? currentTheme.userBubble : currentTheme.aiBubble}`}>
                                    {msg.image && <img src={msg.image} className="rounded-2xl mb-4 max-h-64 object-cover" alt="upload" />}
                                    <div className={`prose prose-sm ${theme === 'light' ? 'prose-slate' : 'prose-invert'} font-medium`}>
                                        {msg.role === "ai" && i === messages.length - 1 ? (
                                            <Typewriter text={msg.content} onComplete={scrollToBottom} />
                                        ) : (
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isSending && <div className="text-[9px] font-black uppercase animate-pulse">Processing...</div>}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="p-4 md:p-10">
                    <div className="max-w-3xl mx-auto relative">
                        <AnimatePresence>
                            {selectedFile && (
                                <div className="absolute bottom-full mb-6 left-4">
                                    <img src={URL.createObjectURL(selectedFile)} className="w-24 h-24 rounded-[2rem] border-2 border-indigo-500" alt="preview" />
                                    <button onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-500 p-2 rounded-full"><FaTimes size={10} /></button>
                                </div>
                            )}
                        </AnimatePresence>
                        <div className={`flex items-center p-2 rounded-[2.8rem] border ${currentTheme.input}`}>
                            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Dhruva..." className="flex-1 bg-transparent px-6 py-4 outline-none font-bold" onKeyDown={e => e.key === "Enter" && sendMessage()} />
                            <div className="flex gap-2 px-2">
                                <input type="file" ref={fileInputRef} hidden onChange={(e) => setSelectedFile(e.target.files[0])} />
                                <button onClick={() => fileInputRef.current.click()}><FaImage /></button>
                                <button onClick={openCamera}><FaCamera /></button>
                                <button onClick={sendMessage} className={`p-5 rounded-full ${currentTheme.button}`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" /> : <FaPaperPlane size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isCameraOpen && (
                        <div className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-between p-6">
                            <button onClick={closeCamera} className="self-end p-4"><FaTimes size={20} className="text-white"/></button>
                            <video ref={videoRef} autoPlay playsInline className="w-full max-w-md aspect-[3/4] object-cover rounded-[3rem]" />
                            <button onClick={capturePhoto} className="mb-10 w-24 h-24 rounded-full border-4 border-white flex items-center justify-center"><div className="w-16 h-16 bg-white rounded-full" /></button>
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
