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

const API_URL = process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app";
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
  }
};

const themes = {
  DeepSpace: { bg: "bg-[#050505]", primary: "indigo-600", text: "text-white", card: "bg-white/[0.03]", border: "border-white/10", isDark: true },
};

export default function Chat() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
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

  const sendMessageRef = useRef();
  const startListeningRef = useRef();

  // --- 🛠️ RECOVERY LOGIC ---
  const stopAllVoice = useCallback(() => {
    if (synthesisRef.current) synthesisRef.current.cancel();
    if (recognitionRef.current) {
        try {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
        } catch (e) {}
    }
    setIsAiSpeaking(false);
    setIsListening(false);
  }, []);

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
    
    const cleanText = text.replace(/[*_`~]/g, '').replace(/\\\[.*?\\\]/g, '').replace(/\n/g, ' ').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = getMaleVoice();
    
    utterance.onstart = () => {
        setIsAiSpeaking(true);
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch(e) {}
        }
    };
    
    utterance.onend = () => {
        setIsAiSpeaking(false);
        if (isLiveMode && startListeningRef.current) {
            setTimeout(() => startListeningRef.current(), 600);
        }
    };
    
    utterance.onerror = () => setIsAiSpeaking(false);
    synthesisRef.current.speak(utterance);
  }, [isLiveMode, getMaleVoice]);

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
        userId: currentUser.uid, message: text, mode, subject, chapter, image: img,
        board: userData.board, class: userData.class
      });

      const ytLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} class ${userData.class} ${subject} ${chapter} ${mode}`)}`;
      const aiMsg = { role: "ai", content: res.data.reply, timestamp: Date.now(), ytLink };

      setMessages(prev => [...prev, aiMsg]);
      if (isLiveMode) speak(res.data.reply);

      await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
        messages: [...messages, userMsg, aiMsg],
        lastUpdate: Date.now(),
        title: messages.length === 0 ? text.slice(0, 20) : sessionTitle,
        subject, chapter
      }, { merge: true });

      await updateDoc(doc(db, "users", currentUser.uid), { 
        xp: increment(img ? 30 : 15), 
        dailyXp: increment(img ? 30 : 15) 
      });
    } catch (err) {
      toast.error("Neural Link Sync Failed.");
    }
    setIsSending(false);
  };

  const startListening = useCallback(() => {
    if (!isLiveMode || isAiSpeaking) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        toast.error("Browser unsupported.");
        return;
    }

    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'network') {
            toast.warn("Neural Link: Check Connection");
        }
        if (event.error === 'not-allowed') {
            toast.error("Mic Access Denied");
            setIsLiveMode(false);
        }
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcript && sendMessageRef.current) {
            sendMessageRef.current(transcript);
        }
    };
    
    recognitionRef.current = recognition;
    try {
        recognition.start();
    } catch (e) {
        console.warn("Recognition already active");
    }
  }, [isLiveMode, isAiSpeaking]);

  useEffect(() => { sendMessageRef.current = sendMessage; }, [messages, input, mode, subject, chapter, userData, isSending]);
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  const toggleLiveMode = useCallback(() => {
    if (!isLiveMode) {
        setIsLiveMode(true);
        toast.info("Neural Link Established");
        speak(`System online. Ready for ${subject}.`);
    } else {
        setIsLiveMode(false);
        stopAllVoice();
    }
  }, [isLiveMode, subject, speak, stopAllVoice]);

  useEffect(() => {
    const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    return () => {
        clearInterval(interval);
        stopAllVoice();
    };
  }, [stopAllVoice]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (d) => {
      if (d.exists()) setUserData(d.data());
    });
    return () => unsubUser();
  }, [currentUser]);

  return (
    <div className={`flex h-[100dvh] w-full ${activeTheme.bg} ${activeTheme.text} overflow-hidden font-sans`}>
      <ToastContainer theme="dark" position="top-center" />

      {/* VOICE INTERFACE */}
      <AnimatePresence>
        {isLiveMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-center p-10">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-black uppercase tracking-tighter text-indigo-500">Neural Link</h1>
              <div className="h-1 w-12 bg-white/20 mx-auto mt-4" />
            </div>
            
            <div className="relative w-72 h-72 border border-white/5 rounded-full flex items-center justify-center">
               <div className="flex items-end gap-3 h-20">
                  {[...Array(7)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      animate={{ height: isAiSpeaking ? [10, 80, 10] : isListening ? [10, 40, 10] : 4 }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                      className="w-2 bg-indigo-500 rounded-full" 
                    />
                  ))}
               </div>
            </div>

            <button onClick={toggleLiveMode} className="mt-20 px-12 py-4 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-[0.4em]">
              Close Connection
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col relative h-full">
        <Navbar currentUser={currentUser} userData={userData} />

        {/* HUD SETTINGS */}
        <div className="w-full max-w-3xl mx-auto px-4 mt-6 space-y-3">
          <div className="flex gap-3 p-2 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1 bg-transparent border-none text-[10px] font-black uppercase py-2 focus:ring-0">
              {Object.keys(syllabusData[userData.board]?.[userData.class] || {}).map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
            </select>
            <div className="w-[1px] bg-white/10 my-2" />
            <select value={chapter} onChange={(e) => setChapter(e.target.value)} className="flex-1 bg-transparent border-none text-[10px] font-black uppercase py-2 focus:ring-0">
              <option value="" className="bg-black">Full Module</option>
              {(syllabusData[userData.board]?.[userData.class]?.[subject] || []).map(ch => <option key={ch} value={ch} className="bg-black">{ch}</option>)}
            </select>
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar pb-60">
          <div className="max-w-3xl mx-auto space-y-10">
            {messages.length === 0 && (
              <div className="text-center py-20 opacity-20">
                <FaBrain size={40} className="mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Initiate Learning Protocol</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-6 rounded-[2rem] max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-white/[0.03] border border-white/10'}`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]} 
                    className="prose prose-invert text-sm"
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {msg.ytLink && (
                    <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 py-3 bg-red-600/10 text-red-500 text-[10px] font-bold uppercase rounded-xl border border-red-500/10">
                      <FaYoutube /> Watch Lesson
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT DOCK */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] p-2 flex items-center gap-2 shadow-2xl">
              <button onClick={() => fileInputRef.current.click()} className="p-4 opacity-30 hover:opacity-100 transition-all">
                <FaImage size={20}/>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                  const reader = new FileReader();
                  reader.onload = () => setImagePreview(reader.result);
                  reader.readAsDataURL(e.target.files[0]);
                }} />
              </button>
              
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Ask Dhruva..." 
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
                onKeyDown={(e) => { if(e.key === 'Enter') sendMessage(); }}
              />
              
              <button onClick={toggleLiveMode} className={`p-4 rounded-full transition-all ${isLiveMode ? 'bg-indigo-600' : 'hover:bg-white/5'}`}>
                <FaHeadphones size={20}/>
              </button>
              <button onClick={() => sendMessage()} className="p-4 bg-indigo-600 rounded-full shadow-lg">
                <FaPaperPlane size={18}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
