import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaPaperPlane, FaTimes, FaImage, FaHistory, FaYoutube, 
  FaTrophy, FaHeadphones, FaChartLine, 
  FaWaveSquare, FaClock, FaSignOutAlt, FaBrain
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import { 
  doc, setDoc, collection, query, updateDoc, increment, onSnapshot, 
  orderBy, limit 
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

// --- 🔧 FIXED API BASE DEFINITION ---
const API_URL = process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app";
// Fix: Use string slicing instead of Regex to prevent build errors
const API_BASE = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

const syllabusData = {
  CBSE: {
    "8": {
      "MATHEMATICS": ["Rational Numbers", "Linear Equations", "Quadrilaterals", "Data Handling", "Squares", "Cubes", "Algebra", "Mensuration", "Exponents"],
      "SCIENCE": ["Crop Production", "Microorganisms", "Coal", "Combustion", "Cells", "Force", "Friction", "Sound", "Light"]
    },
    "10": {
      "MATHEMATICS": ["Real Numbers", "Polynomials", "Linear Equations", "Quadratic Equations", "AP", "Triangles", "Coordinate Geometry", "Trigonometry", "Circles", "Surface Areas", "Statistics"],
      "SCIENCE": ["Chemical Reactions", "Acids Bases", "Metals", "Carbon", "Life Processes", "Control", "Reproduction", "Heredity", "Light", "Human Eye", "Electricity", "Magnetic Effects"]
    },
    "12": {
      "PHYSICS": ["Electrostatics", "Current", "Magnetism", "EMI", "AC", "EM Waves", "Optics", "Dual Nature", "Atoms", "Nuclei", "Semiconductors"],
      "CHEMISTRY": ["Solutions", "Electrochemistry", "Kinetics", "d-Block", "Coordination", "Haloalkanes", "Alcohols", "Aldehydes", "Amines", "Biomolecules"]
    }
  },
  ICSE: {
    "10": {
      "MATHEMATICS": ["Quadratic Equations", "Inequations", "Ratio", "Matrices", "AP", "Similarity", "Trigonometry", "Statistics"],
      "PHYSICS": ["Force", "Work Power Energy", "Machines", "Refraction", "Spectrum", "Sound", "Electricity", "Radioactivity"]
    }
  }
};

const themes = {
  DeepSpace: { bg: "bg-[#050505]", primary: "indigo-600", text: "text-white", card: "bg-white/[0.03]", border: "border-white/10", isDark: true },
};

export default function Chat() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [messages, setMessages] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentSessionId] = useState(Date.now().toString());
  const [sessionTitle, setSessionTitle] = useState("New Lesson");
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("Explain");
  const [subject, setSubject] = useState("MATHEMATICS");
  const [chapter, setChapter] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [theme] = useState("DeepSpace");
  const [userData, setUserData] = useState({ board: "CBSE", class: "10", xp: 0, dailyXp: 0 });
  const [timer, setTimer] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Voice States
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeTheme = themes[theme] || themes.DeepSpace;

  // --- 🤖 GEMINI LIVE VOICE ENGINE ---
  const getMaleVoice = useCallback(() => {
    const voices = synthesisRef.current.getVoices();
    return voices.find(v => 
        v.name.toLowerCase().includes("google uk english male") || 
        v.name.toLowerCase().includes("david") || 
        v.lang === 'en-GB'
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
  }, []);

  const speak = useCallback((text) => {
    if (!isLiveMode) return;
    synthesisRef.current.cancel();
    
    const cleanText = text
        .replace(/[*_`~]/g, '')
        .replace(/\\\[.*?\\\]/g, '') // Remove LaTeX brackets
        .replace(/\n/g, ' ')
        .trim();
        
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = getMaleVoice();
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => {
        setIsAiSpeaking(true);
        if (recognitionRef.current) recognitionRef.current.stop(); // Ensure mic is off while speaking
    };
    
    utterance.onend = () => {
        setIsAiSpeaking(false);
        if (isLiveMode) {
             // Small delay before listening again to avoid picking up echo
            setTimeout(startListening, 500);
        }
    };
    
    utterance.onerror = () => setIsAiSpeaking(false);
    synthesisRef.current.speak(utterance);
  }, [isLiveMode, getMaleVoice]); // Added dependencies

  // Define startListening AFTER speak to avoid circular dependency, or use ref for speak if needed.
  // Ideally, define startListening first, but it calls sendMessage, which calls speak.
  // To resolve: we can pass `speak` into sendMessage or rely on the stable reference.
  
  const sendMessage = async (override = null) => {
    const text = override || input;
    if (isSending || (!text.trim() && !imagePreview)) return;
    
    setIsSending(true);
    setInput("");
    const img = imagePreview;
    setImagePreview(null);

    const userMsg = { role: "user", content: text, image: img, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await axios.post(`${API_BASE}/chat`, {
        userId: currentUser.uid,
        message: text,
        mode,
        subject,
        chapter,
        image: img,
        board: userData.board,
        class: userData.class
      });

      const ytLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} class ${userData.class} ${subject} ${chapter} ${mode}`)}`;
      
      const aiMsg = { 
        role: "ai", 
        content: res.data.reply, 
        timestamp: Date.now(), 
        ytLink 
      };

      setMessages(prev => [...prev, aiMsg]);
      
      // Trigger Voice if Live Mode is active
      if (isLiveMode) {
        speak(res.data.reply);
      }

      // Save Session
      await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
        messages: [...messages, userMsg, aiMsg],
        lastUpdate: Date.now(),
        title: messages.length === 0 ? text.slice(0, 20) : sessionTitle,
        subject, chapter
      }, { merge: true });

      // XP Update
      await updateDoc(doc(db, "users", currentUser.uid), { 
        xp: increment(img ? 30 : 15), 
        dailyXp: increment(img ? 30 : 15) 
      });

    } catch (err) {
      console.error(err);
      toast.error("Signal Lost. Check connection.");
    }
    setIsSending(false);
  };

  const startListening = useCallback(() => {
    if (!isLiveMode || isAiSpeaking) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        toast.error("Speech Recognition not supported.");
        return;
    }

    if (recognitionRef.current) recognitionRef.current.stop();

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false; // False is often more stable for turn-based chat
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onstart = () => setIsListening(true);
    
    recognitionRef.current.onend = () => {
        setIsListening(false);
    };
    
    recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcript) {
            sendMessage(transcript);
        }
    };
    
    try {
        recognitionRef.current.start();
    } catch (e) {
        console.error("Mic busy");
    }
  }, [isLiveMode, isAiSpeaking]); // removed sendMessage from dep array to avoid loops, purely relying on current scope

  const toggleLiveMode = useCallback(() => {
    if (!isLiveMode) {
        setIsLiveMode(true);
        toast.info("🔴 Neural Link Active");
        const intro = `Link established. Ready for ${subject}.`;
        speak(intro); // speak will trigger startListening onEnd
    } else {
        setIsLiveMode(false);
        setIsListening(false);
        setIsAiSpeaking(false);
        if (recognitionRef.current) recognitionRef.current.stop();
        synthesisRef.current.cancel();
        toast.info("🔴 Link Disconnected");
    }
  }, [isLiveMode, subject, speak]);

  // --- 🕒 SYSTEM INIT ---
  useEffect(() => {
    const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    
    // Initialize voices
    const loadVoices = () => { synthesisRef.current.getVoices(); };
    loadVoices();
    synthesisRef.current.onvoiceschanged = loadVoices;

    return () => {
      clearInterval(interval);
      if (recognitionRef.current) recognitionRef.current.stop();
      synthesisRef.current.cancel();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- 🏆 FIREBASE DATA ---
  useEffect(() => {
    if (!currentUser) return;
    const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (d) => {
      if (d.exists()) setUserData(d.data());
    });
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(5));
    const unsubLeader = onSnapshot(q, (s) => {
      setLeaderboard(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubUser(); unsubLeader(); };
  }, [currentUser]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const quickReplies = useMemo(() => {
    if (mode === "Quiz") return ["Start Quiz", "Next Question", "Check Score"];
    if (mode === "HW") return ["Step-by-step", "Alternative Method", "Verify this"];
    return ["Summarize", "Key Concepts", "Real Life Example"];
  }, [mode]);

  return (
    <div className={`flex h-[100dvh] w-full ${activeTheme.bg} ${activeTheme.text} overflow-hidden font-sans`}>
      <ToastContainer theme="dark" />

      {/* --- 💎 VOICE OVERLAY --- */}
      <AnimatePresence>
        {isLiveMode && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-between py-20 px-6">
            <div className="text-center">
              <h1 className="text-4xl font-black uppercase tracking-tighter text-white">{subject}</h1>
              <p className="text-xs font-bold text-white/20 uppercase tracking-widest mt-2">{chapter || "Neural Link Active"}</p>
            </div>
            
            <div className="relative w-64 h-64 border border-white/10 rounded-full flex items-center justify-center bg-white/[0.02]">
               <div className="flex items-end gap-2 h-16">
                  {[...Array(5)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      animate={{ height: isAiSpeaking ? [10, 60, 10] : isListening ? [10, 30, 10] : 4 }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                      className="w-3 bg-indigo-500 rounded-full" 
                    />
                  ))}
               </div>
            </div>

            <button onClick={toggleLiveMode} className="px-10 py-5 bg-white/5 hover:bg-red-500/20 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] transition-colors">
              Disconnect Link
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 🛠️ SIDEBAR --- */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/60 z-[450] backdrop-blur-sm" />
            <motion.div initial={{ x: -400 }} animate={{ x: 0 }} exit={{ x: -400 }} className="fixed inset-y-0 left-0 w-80 bg-[#080808] border-r border-white/10 z-[451] p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-10">
                <FaBrain className="text-indigo-500" size={24}/>
                <h3 className="text-xl font-black uppercase tracking-tighter">Dhruva Core</h3>
              </div>
              
              <div className="flex-1 space-y-6">
                <div className="p-6 rounded-3xl bg-indigo-600/5 border border-indigo-500/20">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Current Level</div>
                    <FaTrophy className="text-indigo-500 opacity-50"/>
                  </div>
                  <div className="text-3xl font-black tracking-tighter mb-4">LVL {Math.floor(userData.xp/1000) + 1}</div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{width: `${Math.min((userData.dailyXp/500)*100, 100)}%`}} />
                  </div>
                  <div className="text-[9px] text-white/30 uppercase mt-2 text-right">{userData.dailyXp} / 500 Daily XP</div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase opacity-20 tracking-widest px-2">Top Scholars</label>
                  {leaderboard.map((u, i) => (
                    <div key={u.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${i===0 ? 'text-yellow-500':'opacity-30'}`}>0{i+1}</span>
                        <span className="text-xs font-bold truncate w-24 uppercase">{u.displayName || "User"}</span>
                      </div>
                      <span className="text-[10px] font-black text-indigo-500">{u.xp}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => { auth.signOut(); navigate("/login"); }} className="w-full p-5 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-red-500/10">
                <FaSignOutAlt /> Logout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- 📟 MAIN INTERFACE --- */}
      <div className="flex-1 flex flex-col relative h-full">
        <Navbar currentUser={currentUser} userData={userData} />

        {/* HUD */}
        <div className="w-full max-w-3xl mx-auto px-4 mt-6 space-y-3 z-[100]">
          <div className={`flex items-center justify-between p-4 rounded-3xl ${activeTheme.card} border ${activeTheme.border} backdrop-blur-xl`}>
            <div className="flex items-center gap-3">
              <FaHistory size={12} className="opacity-20"/>
              <span className="text-xs font-black uppercase tracking-tighter">{sessionTitle}</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-40">
              <span className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
                <FaClock className="text-indigo-500"/> 
                {Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}
              </span>
            </div>
          </div>

          <div className={`flex gap-3 p-2 rounded-[2rem] ${activeTheme.card} border ${activeTheme.border}`}>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1 bg-white/5 border-none rounded-2xl text-[10px] font-black uppercase py-3 px-4 cursor-pointer focus:ring-0">
              {Object.keys(syllabusData[userData.board]?.[userData.class] || {}).map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
            </select>
            <select value={chapter} onChange={(e) => setChapter(e.target.value)} className="flex-1 bg-white/5 border-none rounded-2xl text-[10px] font-black uppercase py-3 px-4 cursor-pointer focus:ring-0">
              <option value="" className="bg-black">Full Subject</option>
              {(syllabusData[userData.board]?.[userData.class]?.[subject] || []).map(ch => <option key={ch} value={ch} className="bg-black">{ch}</option>)}
            </select>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar pb-72">
          <div className="max-w-3xl mx-auto space-y-12">
            {messages.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center opacity-10">
                <FaWaveSquare size={60} className="mb-6 animate-pulse" />
                <h2 className="text-xs font-black uppercase tracking-[1em]">System Ready</h2>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-8 rounded-[2.5rem] max-w-[90%] shadow-2xl ${msg.role === 'user' ? 'bg-indigo-600 rounded-tr-none text-white' : 'bg-white/[0.03] border border-white/10 rounded-tl-none'}`}>
                  {msg.image && <img src={msg.image} className="w-full rounded-2xl mb-6 border border-white/10" alt="input" />}
                  
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]} 
                    className="prose prose-invert text-sm leading-relaxed"
                    components={{
                       p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>

                  {msg.ytLink && (
                    <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-8 flex items-center justify-center gap-3 py-4 bg-red-600/10 text-red-500 text-[10px] font-black uppercase rounded-2xl hover:bg-red-600 hover:text-white transition-all border border-red-500/10">
                      <FaYoutube size={16}/> Watch Tutorial
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-[500]">
          <div className="max-w-3xl mx-auto space-y-4">
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {quickReplies.map(q => (
                <button key={q} onClick={() => sendMessage(q)} className="whitespace-nowrap px-6 py-3 rounded-2xl border border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">{q}</button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
                {["Explain", "Quiz", "HW"].map(m => (
                  <button key={m} onClick={() => setMode(m)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-xl' : 'opacity-40 hover:opacity-100'}`}>{m}</button>
                ))}
              </div>
              <button onClick={() => setShowSidebar(true)} className="p-4 rounded-2xl bg-white/5 border border-white/10 opacity-40 hover:opacity-100 transition-all"><FaChartLine size={16}/></button>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-[2.5rem] p-2 flex items-end gap-2 shadow-2xl relative">
              {imagePreview && (
                 <div className="absolute -top-24 left-0 p-2 bg-black border border-white/10 rounded-2xl">
                    <img src={imagePreview} className="h-20 w-20 object-cover rounded-xl" alt="preview"/>
                    <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><FaTimes size={10}/></button>
                 </div>
              )}
              
              <button onClick={() => fileInputRef.current.click()} className="p-5 opacity-20 hover:opacity-100 hover:text-indigo-400 transition-all">
                <FaImage size={22}/>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
              </button>
              
              <textarea 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Type your doubt here..." 
                rows="1"
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-5 resize-none no-scrollbar font-medium text-white placeholder-white/20"
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
              />
              
              <div className="flex gap-2 pr-2 pb-2">
                <button onClick={toggleLiveMode} className={`p-5 rounded-full transition-all ${isLiveMode ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white/5'}`}>
                  <FaHeadphones size={22}/>
                </button>
                <button onClick={() => sendMessage()} disabled={isSending} className="p-5 bg-indigo-600 text-white rounded-full shadow-xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all">
                  <FaPaperPlane size={22}/>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

);
}
