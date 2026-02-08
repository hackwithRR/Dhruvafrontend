import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaMicrophone, 
    FaImage, FaPlus, FaHistory, FaYoutube, FaTrash, 
    FaClock, FaPlay, FaStop, FaTrophy, FaMagic, FaCheckCircle,
    FaVolumeUp, FaVolumeMute, FaWaveSquare, FaEdit, FaChevronLeft
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

// --- FULL SYLLABUS REGISTRY ---
const MASTER_SYLLABUS = `
CBSE 8 MATH: 1.Rational Numbers, 2.Linear Eq, 3.Quadrilaterals, 4.Practical Geo, 5.Data Handling, 6.Squares, 7.Cubes, 8.Comparing Quantities, 9.Algebra, 10.Solid Shapes, 11.Mensuration, 12.Exponents, 13.Proportions, 14.Factorisation, 15.Graphs, 16.Numbers.
CBSE 9 MATH: 1.Number Systems, 2.Polynomials, 3.Coordinate Geo, 4.Linear Eq 2 Var, 5.Euclid Geo, 6.Lines/Angles, 7.Triangles, 8.Quadrilaterals, 9.Areas, 10.Circles, 11.Constructions, 12.Heron's, 13.Surface Area, 14.Statistics, 15.Probability.
CBSE 10 MATH: 1.Real Numbers, 2.Polynomials, 3.Linear Eq Pair, 4.Quadratic, 5.AP, 6.Triangles, 7.Coordinate, 8.Trig Identities, 9.Heights/Distances, 10.Circles, 11.Constructions, 12.Circle Areas, 13.Surface Areas, 14.Statistics, 15.Probability.
ICSE 8 MATH: 1.Rational, 2.Exponents, 3.Squares, 4.Cubes, 5.Algebra, 6.Linear Eq, 7.Factorisation, 8.Ratio, 9.Percentages, 10.Profit/Loss, 11.SI, 12.Polygons, 13.Quadrilaterals, 14.Construction, 15.Area/Perimeter, 16.Volume, 17.Data, 18.Graphs.
ICSE 9 MATH: 1.Rational/Irrational, 2.Indices, 3.Algebra, 4.Factorisation, 5.Linear Eq, 6.Expansions, 7.Coordinate, 8.Triangles, 9.Pythagoras, 10.Rectilinear, 11.Circles, 12.Mensuration, 13.Statistics, 14.Trigonometry.
ICSE 10 MATH: 1.Quadratic, 2.Linear Ineq, 3.Ratio, 4.Matrices, 5.AP, 6.Coordinate, 7.Similarity, 8.Trig, 9.Heights, 10.Mensuration, 11.Probability, 12.Statistics.
(Note: Treat "Maths", "Mathematics", and "Math" as the same subject).
`;

const RankBadge = ({ xp, level }) => {
    const progress = (xp % 500) / 5;
    const ranks = ["Novice", "Scholar", "Sage", "Expert", "Master", "Grandmaster"];
    const currentRank = ranks[Math.min(Math.floor((level - 1) / 2), ranks.length - 1)];

    return (
        <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-fuchsia-600/10 rounded-3xl border border-white/10 shadow-xl mb-6">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                    <FaTrophy className="text-white" size={20}/>
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{currentRank}</h4>
                    <h3 className="text-lg font-black text-white leading-none">Level {level}</h3>
                </div>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-black uppercase opacity-50">
                    <span>{xp} Total XP</span>
                    <span>{500 - (xp % 500)} XP to Next Level</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"/>
                </div>
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
        if (earnedXP > 0) { onComplete(earnedXP); toast.success(`Focused for ${earnedXP}m! +${earnedXP} XP`); }
        setIsActive(false); setTimeLeft(0); setInitialTime(0);
    };

    return (
        <motion.div drag dragMomentum={false} className="fixed z-[100] right-4 top-24 md:right-8 md:top-28">
            <motion.div animate={{ width: isOpen ? "240px" : "56px", height: isOpen ? "260px" : "56px", borderRadius: isOpen ? "28px" : "50%" }} className={`flex flex-col overflow-hidden border shadow-2xl backdrop-blur-3xl ${currentTheme.aiBubble} border-white/10`}>
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-400">
                        {isActive ? <span className="text-[10px] font-bold animate-pulse">{Math.ceil(timeLeft/60)}m</span> : <FaClock size={20}/>}
                    </button>
                ) : (
                    <div className="p-5 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-40"><span>Focus Session</span><button onClick={() => setIsOpen(false)}><FaTimes/></button></div>
                        <div className="text-4xl font-mono font-black text-center py-4">{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2, '0')}</div>
                        <div className="grid grid-cols-3 gap-2">{[15, 25, 45].map(m => (<button key={m} onClick={() => {setTimeLeft(m*60); setInitialTime(m*60); setIsActive(true);}} className="py-2 rounded-xl bg-white/5 text-[10px] font-black hover:bg-indigo-600 transition-colors">{m}m</button>))}</div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsActive(!isActive)} className="flex-1 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">{isActive ? <FaStop/> : <FaPlay/>}</button>
                            <button onClick={() => handleComplete(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10"><FaTrash/></button>
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
    const [userData, setUserData] = useState({ board: "CBSE", class: "10", language: "English", xp: 0 });
    const [showSidebar, setShowSidebar] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isVoiceOn, setIsVoiceOn] = useState(true);
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [newSessionName, setNewSessionName] = useState("");

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const recognitionRef = useRef(null);

    const themes = {
        DeepSpace: { container: "bg-[#050505] text-white", aiBubble: "bg-white/[0.04] border-white/10", userBubble: "bg-indigo-600", input: "bg-white/[0.03] border-white/10", button: "bg-indigo-600", sidebar: "bg-[#080808] border-white/5" },
        Light: { container: "bg-gray-50 text-gray-900", aiBubble: "bg-white border-gray-200 shadow-sm", userBubble: "bg-indigo-600 text-white", input: "bg-white border-gray-300 shadow-inner", button: "bg-indigo-600", sidebar: "bg-white border-gray-200" },
        Sakura: { container: "bg-[#1a0f12] text-rose-50", aiBubble: "bg-rose-500/10 border-rose-500/20", userBubble: "bg-rose-600", input: "bg-rose-500/5 border-rose-500/10", button: "bg-rose-600", sidebar: "bg-[#221418] border-rose-500/10" },
        Cyberpunk: { container: "bg-[#0a0512] text-cyan-50", aiBubble: "bg-cyan-500/10 border-cyan-500/30", userBubble: "bg-fuchsia-600", input: "bg-cyan-500/5 border-cyan-500/10", button: "bg-cyan-600", sidebar: "bg-[#120a1a] border-cyan-500/20" }
    };
    const currentTheme = themes[theme] || themes.DeepSpace;
    const currentLevel = Math.floor((userData.xp || 0) / 500) + 1;

    // --- CONTINUOUS VOICE & NORMALIZATION ---
    const speak = (text) => {
        if (!isVoiceOn) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ""));
        utter.rate = 1.1;
        utter.onend = () => { if (isVoiceOn) handleVoiceToggle(); };
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
    }, [isVoiceOn]);

    const handleVoiceToggle = () => {
        if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
        else { setInput(""); recognitionRef.current.start(); setIsListening(true); }
    };

    const renameSession = async (id) => {
        if (!newSessionName.trim()) return setEditingSessionId(null);
        await updateDoc(doc(db, `users/${currentUser.uid}/sessions`, id), { title: newSessionName });
        setEditingSessionId(null); loadSessions();
    };

    const openCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) { toast.error("Camera denied"); setIsCameraOpen(false); }
    };

    const closeCamera = () => {
        if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        const ctx = canvasRef.current.getContext("2d");
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        canvasRef.current.toBlob(b => {
            setSelectedFile(new File([b], "shot.jpg", { type: "image/jpeg" }));
            closeCamera();
        }, "image/jpeg", 0.7);
    };

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isSending]);

    useEffect(() => {
        if (!currentUser) return;
        (async () => {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            if (snap.exists()) setUserData(snap.data());
            loadSessions();
        })();
    }, [currentUser]);

    const loadSessions = async () => {
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const awardXP = async (amt) => {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, { xp: increment(amt) });
        setUserData(p => ({ ...p, xp: p.xp + amt }));
    };

    const sendMessage = async (override = null) => {
        const text = override || input;
        if (isSending || (!text.trim() && !selectedFile)) return;
        setIsSending(true);
        const file = selectedFile;
        setInput(""); setSelectedFile(null);

        const userMsg = { role: "user", content: text || "Analyzing file...", image: file ? URL.createObjectURL(file) : null };
        const updatedMsgs = [...messages, userMsg];
        setMessages(updatedMsgs);

        try {
            // Subject Normalization: Maths/Mathematics/Math -> Mathematics
            let stdSub = subjectInput.trim();
            if (/^(math|maths|mathematics)$/i.test(stdSub)) stdSub = "Mathematics";

            const payload = { userId: currentUser.uid, message: text, mode, subject: stdSub, chapter: chapterInput, language: userData.language, classLevel: userData.class, board: userData.board, syllabusRegistry: MASTER_SYLLABUS };

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

            const aiMsg = {
                role: "ai",
                content: res.data.reply,
                ytLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} ${userData.class} ${stdSub} ${text}`)}`
            };

            const finalMsgs = [...updatedMsgs, aiMsg];
            setMessages(finalMsgs);
            speak(res.data.reply);
            
            const sessionTitle = messages.length === 0 ? (stdSub || text.slice(0, 15)) : null;
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), { messages: finalMsgs, lastUpdate: Date.now(), ...(sessionTitle && { title: sessionTitle }) }, { merge: true });
            
            loadSessions();
            awardXP(10);
        } catch (err) { toast.error("Connection failed."); }
        setIsSending(false);
    };

    return (
        <div className={`flex h-[100dvh] w-full overflow-hidden ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" autoClose={2000} hideProgressBar />

            {/* CLOSABLE SIDEBAR (DESKTOP + MOBILE) */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} className={`fixed lg:relative z-[200] w-72 md:w-80 h-full flex flex-col p-6 border-r ${currentTheme.sidebar} backdrop-blur-xl shadow-2xl`}>
                        <div className="flex justify-between items-center mb-6"><span className="text-[10px] font-black uppercase tracking-widest opacity-40">Library</span><button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-white/5 rounded-full"><FaChevronLeft/></button></div>
                        <RankBadge xp={userData.xp} level={currentLevel} />
                        <button onClick={() => {setMessages([]); setCurrentSessionId(Date.now().toString());}} className="w-full py-4 mb-6 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><FaPlus/> New Brainstorm</button>
                        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                            {sessions.map(s => (
                                <div key={s.id} onClick={() => {setCurrentSessionId(s.id); setMessages(s.messages || []);}} className={`group p-4 rounded-2xl border transition-all cursor-pointer relative ${currentSessionId === s.id ? 'bg-indigo-600/10 border-indigo-600/40' : 'border-transparent hover:bg-white/5'}`}>
                                    {editingSessionId === s.id ? (
                                        <input autoFocus className="bg-transparent text-[10px] font-black uppercase outline-none w-full" value={newSessionName} onChange={e => setNewSessionName(e.target.value)} onBlur={() => renameSession(s.id)} onKeyDown={e => e.key === 'Enter' && renameSession(s.id)}/>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black truncate block uppercase w-[70%]">{s.title || "Untitled Session"}</span>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(s.id); setNewSessionName(s.title || ""); }}><FaEdit size={10}/></button>
                                                <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, `users/${currentUser.uid}/sessions`, s.id)).then(loadSessions); }}><FaTrash size={10}/></button>
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
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} userData={userData}/>
                <StudyTimer currentTheme={currentTheme} onComplete={awardXP} />

                {/* MODE & SYLLABUS PICKER */}
                <div className="w-full max-w-5xl mx-auto px-4 pt-6 space-y-4">
                    <div className={`flex items-center gap-2 p-1.5 rounded-2xl border ${currentTheme.input} shadow-xl`}>
                        <input value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject" className="w-20 md:w-32 bg-transparent px-3 py-1 text-[11px] font-black uppercase outline-none" />
                        <div className="h-4 w-[1px] bg-white/10"/>
                        <input value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Ch # (e.g. 1)" className="flex-1 bg-transparent px-3 py-1 text-[11px] font-black uppercase outline-none" />
                        <button onClick={() => setIsLocked(!isLocked)} className={`p-2.5 rounded-xl ${isLocked ? 'bg-emerald-600 shadow-[0_0_10px_#10b981]' : 'bg-white/5'}`}><FaCheckCircle size={12}/></button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {["Explain", "Quiz", "Summary", "Homework"].map(m => (
                            <button key={m} onClick={() => setMode(m)} className={`px-5 py-2.5 text-[10px] font-black uppercase rounded-xl border transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 opacity-50'}`}>{m}</button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-8 no-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-10">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 opacity-10 text-center uppercase tracking-[0.4em] text-[10px]"><FaWaveSquare size={40} className="mb-4"/><p>Speak to Dhruva to begin</p></div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[92%] md:max-w-[80%] p-6 md:p-8 rounded-[2.5rem] shadow-2xl relative ${msg.role === "user" ? `${currentTheme.userBubble} text-white rounded-tr-none` : `${currentTheme.aiBubble} backdrop-blur-3xl rounded-tl-none`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-2xl mb-4 max-h-80 w-full object-cover" alt="input" />}
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="prose prose-sm prose-invert max-w-none text-xs md:text-sm leading-relaxed">{msg.content}</ReactMarkdown>
                                    {msg.role === "ai" && msg.ytLink && (<a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-3 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-red-600/20"><FaYoutube size={18}/> Visual Lab</a>)}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} className="h-32" />
                    </div>
                </div>

                {/* GEMINI STYLE BOTTOM BAR */}
                <div className="p-4 md:p-10 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <div className="max-w-4xl mx-auto">
                        <div className={`flex items-center gap-1 md:gap-2 p-2 rounded-[3.5rem] border shadow-3xl backdrop-blur-3xl ${currentTheme.input} ring-1 ring-white/5`}>
                            <button onClick={() => setShowSidebar(!showSidebar)} className="p-3 text-indigo-400"><FaHistory size={20}/></button>
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask Dhruva..." className="flex-1 bg-transparent px-2 md:px-5 py-3 outline-none text-sm font-bold min-w-0" />
                            <div className="flex items-center gap-0.5 md:gap-1 px-1">
                                <button onClick={() => setIsVoiceOn(!isVoiceOn)} className={`p-3 hidden md:block ${isVoiceOn ? 'text-indigo-400' : 'text-white/20'}`} title="Continuous Talk Mode"><FaVolumeUp size={18}/></button>
                                <button onClick={handleVoiceToggle} className={`p-4 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-indigo-400 hover:bg-white/5'}`}><FaMicrophone size={20}/></button>
                                <button onClick={() => fileInputRef.current.click()} className="p-4 text-indigo-400 hover:bg-white/5 rounded-full"><FaImage size={20}/><input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])}/></button>
                                <button onClick={openCamera} className="p-4 text-indigo-400 hidden xs:block hover:bg-white/5 rounded-full"><FaCamera size={20}/></button>
                                <button onClick={() => sendMessage()} disabled={isSending} className={`p-5 md:p-6 rounded-full ${currentTheme.button} text-white shadow-2xl active:scale-90 transition-all ml-1`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" size={16}/> : <FaPaperPlane size={16}/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isCameraOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex flex-col">
                            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
                            <div className="p-10 flex justify-between items-center bg-black/90 border-t border-white/10">
                                <button onClick={closeCamera} className="p-6 bg-white/10 rounded-full text-white"><FaTimes size={24}/></button>
                                <button onClick={capturePhoto} className="w-24 h-24 bg-white rounded-full border-[8px] border-white/20 active:scale-95 shadow-2xl" />
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
        </div>
    );
}
