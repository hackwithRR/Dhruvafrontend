


import React, { useEffect, useState, useRef, useMemo } from "react";
import Navbar from "../components/Navbar";
import imageCompression from 'browser-image-compression'; // <--- Move here
import { PDFDocument } from 'pdf-lib';                     // <--- Move here
import { useAuth } from "../context/AuthContext";
import { useChatContext } from "../context/ChatContext";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane, FaSyncAlt, FaTimes, FaImage, FaHistory, FaTrash,
    FaTrophy, FaChartLine, FaLayerGroup, FaWaveSquare,
    FaClock, FaSignOutAlt, FaMedal, FaBrain, FaSearch, FaChevronDown, FaPlus,
    FaSlidersH, FaFire, FaGem, FaStar, FaLock, FaBolt, FaFilePdf, FaFileWord, FaFileAlt, FaYoutube, FaChevronRight, FaChevronLeft, FaVolumeUp, FaMicrophone,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import {
    doc, setDoc, collection, query, updateDoc, increment, onSnapshot,
    orderBy, limit, deleteDoc
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import QuizBubble from "../components/QuizBubble";
import ChatBubble from "../components/ChatBubble";
import MindmapModal from "../components/MindmapModal";
import BorderGlow from "../components/BorderGlow";
import ExamPrepModal from "../components/ExamPrepModal";
import { ChatProvider } from "../context/ChatContext";



const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-e5h8.onrender.com").replace(/\/$/, "");

// MCQ Detection patterns (same as QuizBubble)
const MCQ_PATTERNS = [
    /\b[A-D]\)[\s]/,            // A) B) C) D)
    /\b[A-D]\.\s/,              // A. B. C. D.
    /\b\([A-D]\)[\s]/,          // (A) (B) (C) (D)
    /\b[A-D]\s+[\.\)]\s/,      // A ) or A . 
];

// Function to check if content contains MCQ
const isMCQ = (content) => {
    return MCQ_PATTERNS.some((pattern) => pattern.test(content));
};

// SYLLABUS DATA (PRESERVED)
const syllabusData = {
    CBSE: {
        "8": {
            "MATHEMATICS": ["Rational Numbers", "Linear Equations in One Variable", "Understanding Quadrilaterals", "Practical Geometry", "Data Handling", "Squares and Square Roots", "Cubes and Cube Roots", "Comparing Quantities", "Algebraic Expressions and Identities", "Visualising Solid Shapes", "Mensuration", "Exponents and Powers", "Direct and Inverse Proportions", "Factorisation", "Introduction to Graphs", "Playing with Numbers"],
            "SCIENCE": ["Crop Production and Management", "Microorganisms: Friend and Foe", "Synthetic Fibres and Plastics", "Materials: Metals and Non-Metals", "Coal and Petroleum", "Combustion and Flame", "Conservation of Plants and Animals", "Cell – Structure and Functions", "Reproduction in Animals", "Reaching the Age of Adolescence", "Force and Pressure", "Friction", "Sound", "Chemical Effects of Electric Current", "Some Natural Phenomena", "Light", "Stars and the Solar System", "Pollution of Air and Water"],
            "HISTORY": ["How, When and Where", "From Trade to Territory", "Ruling the Countryside", "Tribals, Dikus and the Vision of a Golden Age", "When People Rebel", "Colonialism and the City", "Weavers, Iron Smelters and Factory Owners", "Civilising the Native, Educating the Nation"],
            "GEOGRAPHY": ["Resources", "Land, Soil, Water, Natural Vegetation and Wildlife", "Mineral and Power Resources", "Agriculture", "Industries", "Human Resources"],
            "CIVICS": ["The Indian Constitution", "Understanding Secularism", "Why Do We Need a Parliament", "Understanding Laws", "Judiciary", "Understanding Our Criminal Justice System", "Understanding Marginalisation", "Confronting Marginalisation"],
            "ENGLISH": ["The Best Christmas Present in the World", "The Tsunami", "Glimpses of the Past", "Bepin Choudhury’s Lapse of Memory", "The Summit Within", "This Is Jody’s Fawn", "A Visit to Cambridge", "A Short Monsoon Diary"],
            "HINDI": ["ध्वनि", "लाख की चूड़ियाँ", "बस की यात्रा", "दीवानों की हस्ती", "चिट्ठियों की अनूठी दुनिया", "भगवान के डाकिए", "क्या निराश हुआ जाए", "यह सबसे कठिन समय नहीं"]
        },
        "9": {
            "MATHEMATICS": ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables", "Introduction to Euclid’s Geometry", "Lines and Angles", "Triangles", "Quadrilaterals", "Areas of Parallelograms and Triangles", "Circles", "Constructions", "Heron’s Formula", "Surface Areas and Volumes", "Statistics", "Probability"],
            "SCIENCE": ["Matter in Our Surroundings", "Is Matter Around Us Pure", "Atoms and Molecules", "Structure of the Atom", "The Fundamental Unit of Life", "Tissues", "Diversity in Living Organisms", "Motion", "Force and Laws of Motion", "Gravitation", "Work and Energy", "Sound", "Why Do We Fall Ill", "Natural Resources", "Improvement in Food Resources"],
            "HISTORY": ["The French Revolution", "Socialism in Europe and the Russian Revolution", "Nazism and the Rise of Hitler", "Forest Society and Colonialism", "Pastoralists in the Modern World"],
            "GEOGRAPHY": ["India – Size and Location", "Physical Features of India", "Drainage", "Climate", "Natural Vegetation and Wildlife", "Population"],
            "POLITICAL SCIENCE": ["What is Democracy? Why Democracy?", "Constitutional Design", "Electoral Politics", "Working of Institutions", "Democratic Rights"],
            "ECONOMICS": ["The Story of Village Palampur", "People as Resource", "Poverty as a Challenge", "Food Security in India"],
            "ENGLISH": ["The Fun They Had", "The Sound of Music", "The Little Girl", "A Truly Beautiful Mind", "The Snake and the Mirror", "My Childhood", "Packing", "Reach for the Top", "The Bond of Love", "Kathmandu", "If I Were You"]
        },
        "10": {
            "MATHEMATICS": ["Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Introduction to Trigonometry", "Some Applications of Trigonometry", "Circles", "Constructions", "Areas Related to Circles", "Surface Areas and Volumes", "Statistics", "Probability"],
            "SCIENCE": ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and its Compounds", "Life Processes", "Control and Coordination", "How Do Organisms Reproduce", "Heredity and Evolution", "Light – Reflection and Refraction", "The Human Eye and the Colourful World", "Electricity", "Magnetic Effects of Electric Current", "Our Environment", "Sources of Energy"],
            "HISTORY": ["The Rise of Nationalism in Europe", "Nationalism in India", "The Making of a Global World", "The Age of Industrialisation", "Print Culture and the Modern World"],
            "GEOGRAPHY": ["Resources and Development", "Forest and Wildlife Resources", "Water Resources", "Agriculture", "Minerals and Energy Resources", "Manufacturing Industries", "Lifelines of National Economy"],
            "POLITICAL SCIENCE": ["Power Sharing", "Federalism", "Gender, Religion and Caste", "Political Parties", "Outcomes of Democracy"],
            "ECONOMICS": ["Development", "Sectors of the Indian Economy", "Money and Credit", "Globalisation and the Indian Economy", "Consumer Rights"],
            "ENGLISH": ["A Letter to God", "Nelson Mandela: Long Walk to Freedom", "Two Stories about Flying", "From the Diary of Anne Frank", "Glimpses of India", "Mijbil the Otter", "Madam Rides the Bus", "The Sermon at Benares", "The Proposal"]
        },
        "11": {
            "PHYSICS": ["Physical World and Measurement", "Kinematics", "Laws of Motion", "Work, Energy and Power", "Motion of System of Particles", "Gravitation", "Properties of Bulk Matter", "Thermodynamics", "Kinetic Theory", "Oscillations and Waves"],
            "CHEMISTRY": ["Some Basic Concepts of Chemistry", "Structure of Atom", "States of Matter", "Thermodynamics", "Equilibrium", "Organic Chemistry – Basic Principles", "Hydrocarbons"],
            "BIOLOGY": ["Diversity in Living World", "Structural Organisation in Animals and Plants", "Cell Structure and Function", "Plant Physiology", "Human Physiology"],
            "ENGLISH": ["Hornbill", "Snapshots"]
        },
        "12": {
            "PHYSICS": ["Electrostatics", "Current Electricity", "Magnetic Effects of Current", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics", "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms", "Nuclei", "Semiconductor Electronics"],
            "CHEMISTRY": ["Solid State", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "p-Block Elements", "d and f Block Elements", "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers", "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"],
            "BIOLOGY": ["Reproduction", "Genetics and Evolution", "Biology and Human Welfare", "Biotechnology", "Ecology and Environment"],
            "ENGLISH": ["Flamingo", "Vistas"]
        }
    },
    ICSE: {
        "8": {
            "MATHEMATICS": ["Rational Numbers", "Exponents", "Squares and Square Roots", "Cubes and Cube Roots", "Algebraic Expressions", "Linear Equations", "algebraic identities", "time and work ", "perimeter and area", "volume and area", "Direct and Inverse variation direct", "constructions of quadrilaterals", "linear inequation", "Factorisation", "Ratio and Proportion", "Percentages", "Profit and Loss", "Simple Interest", "Polygons", "Quadrilaterals", "Mensuration", "Data Handling", "Graphs"],
            "PHYSICS": ["Matter", "Physical Quantities and Measurement", "Force and Pressure", "Energy", "Light", "Heat", "Sound", "Electricity"],
            "CHEMISTRY": ["Matter", "Physical and Chemical Changes", "Elements, Compounds and Mixtures", "Atomic Structure", "Chemical Reactions", "Hydrogen", "Water", "Carbon and its Compounds"],
            "BIOLOGY": ["Plant Tissues", "Animal Tissues", "Transport in Plants", "Reproduction in Plants", "Reproduction in Animals", "Ecosystem", "Human Body Systems", "Health and Hygiene"],
            "HISTORY & CIVICS": ["Indian Constitution", "Parliament", "Judiciary", "Revolt of 1857", "Colonial Rule in India"],
            "GEOGRAPHY": ["Climate of India", "Resources", "Agriculture", "Industries"],
            "ENGLISH": ["Prose", "Poetry", "Grammar and Composition"]
        },
        "9": {
            "MATHEMATICS": ["Rational and Irrational Numbers", "Indices", "Algebraic Expressions", "Factorisation", "Linear Equations", "Expansions", "Coordinate Geometry", "Triangles", "Pythagoras Theorem", "Circles", "Mensuration", "Statistics", "Trigonometry"],
            "PHYSICS": ["Measurements and Experimentation", "Motion", "Laws of Motion", "Fluids", "Heat", "Light", "Sound"],
            "CHEMISTRY": ["Matter and its Composition", "Atomic Structure", "Periodic Table", "Chemical Bonding", "Study of Gases", "Acids, Bases and Salts"],
            "BIOLOGY": ["Cell", "Tissues", "Diversity of Living Organisms", "Plant Physiology", "Human Physiology", "Health and Hygiene"],
            "HISTORY & CIVICS": ["French Revolution", "Russian Revolution", "World Wars", "Indian Constitution"],
            "GEOGRAPHY": ["Earth as a Planet", "Structure of the Earth", "Climate", "Resources"],
            "ENGLISH": ["Prose", "Poetry", "Drama", "Grammar and Composition"]
        },
        "10": {
            "MATHEMATICS": ["Quadratic Equations", "Linear Inequations", "Ratio and Proportion", "Matrices", "Arithmetic Progression", "Coordinate Geometry", "Similarity", "Trigonometry", "Heights and Distances", "Mensuration", "Probability", "Statistics"],
            "PHYSICS": ["Force", "Work, Power and Energy", "Machines", "Refraction of Light", "Spectrum", "Sound", "Current Electricity", "Magnetism", "Electromagnetic Induction", "Radioactivity"],
            "CHEMISTRY": ["Periodic Properties", "Chemical Bonding", "Acids, Bases and Salts", "Analytical Chemistry", "Metallurgy", "Organic Chemistry"],
            "BIOLOGY": ["Cell Cycle", "Genetics", "Plant Physiology", "Human Anatomy and Physiology", "Population", "Environment"],
            "HISTORY & CIVICS": ["First War of Independence", "Growth of Nationalism", "World Wars", "United Nations", "Union Legislature", "Union Executive", "Judiciary"],
            "GEOGRAPHY": ["Map Work", "Climate", "Soil Resources", "Water Resources", "Natural Vegetation", "Mineral Resources", "Industries", "Transport", "Waste Management"],
            "ENGLISH": ["Prose", "Poetry", "Drama – Merchant of Venice", "Grammar and Composition"]
        }
    }
};

const themes = {
    DeepSpace: { bg: "bg-[#050505]", hex: "#050505", primary: "indigo-600", primaryHex: "#4f46e5", text: "text-white", accent: "text-indigo-400", card: "bg-white/[0.03]", border: "border-white/10", isDark: true },
    Light: { bg: "bg-[#f8fafc]", hex: "#f8fafc", primary: "indigo-600", primaryHex: "#4f46e5", text: "text-slate-900", accent: "text-indigo-600", card: "bg-white shadow-sm", border: "border-slate-200", isDark: false },
    Sakura: { bg: "bg-[#fff5f7]", hex: "#fff5f7", primary: "pink-500", primaryHex: "#ec4899", text: "text-pink-950", accent: "text-[#be185d]", card: "bg-pink-100/50", border: "border-pink-200", isDark: false },

    Cyberpunk: { bg: "bg-[#0a0a0f]", hex: "#0a0a0f", primary: "cyan-500", primaryHex: "#06b6d4", text: "text-cyan-50", accent: "text-cyan-400", card: "bg-cyan-950/20", border: "border-cyan-500/20", isDark: true },
    RoyalParchment: { bg: "bg-[#fdf6e3]", hex: "#fdf6e3", primary: "amber-700", primaryHex: "#b45309", text: "text-amber-950", accent: "text-amber-700", card: "bg-[#fffbeb] shadow-sm", border: "border-amber-200", isDark: false },

    MidnightAurora: { bg: "bg-[#010806]", hex: "#010806", primary: "emerald-500", primaryHex: "#10b981", text: "text-emerald-50", accent: "text-emerald-400", card: "bg-emerald-950/20", border: "border-emerald-500/20", isDark: true },
    SunsetDrift: { bg: "bg-[#0f0402]", hex: "#0f0402", primary: "orange-500", primaryHex: "#f97316", text: "text-orange-50", accent: "text-orange-400", card: "bg-orange-950/20", border: "border-orange-500/20", isDark: true },
    Phantom: { bg: "bg-[#050505]", hex: "#050505", primary: "white", primaryHex: "#ffffff", text: "text-white", accent: "text-gray-400", card: "bg-neutral-900/50", border: "border-neutral-700", isDark: true },
    Solaris: { bg: "bg-[#050401]", hex: "#050401", primary: "amber-400", primaryHex: "#facc15", text: "text-amber-50", accent: "text-amber-400", card: "bg-amber-950/20", border: "border-amber-500/20", isDark: true },
    Aero: { bg: "bg-[#0f172a]", hex: "#0f172a", primary: "slate-400", primaryHex: "#94a3b8", text: "text-slate-200", accent: "text-slate-300", card: "bg-slate-900/50", border: "border-slate-700", isDark: true },
    Toxic: { bg: "bg-[#020500]", hex: "#020500", primary: "lime-400", primaryHex: "#a3e635", text: "text-lime-50", accent: "text-lime-400", card: "bg-lime-950/20", border: "border-lime-500/20", isDark: true },
    Synthwave: { bg: "bg-[#120422]", hex: "#120422", primary: "cyan-400", primaryHex: "#22d3ee", text: "text-pink-50", accent: "text-pink-500", card: "bg-purple-950/30", border: "border-cyan-500/30", isDark: true },
    Coffee: { bg: "bg-[#0c0a09]", hex: "#0c0a09", primary: "stone-300", primaryHex: "#d6c5bb", text: "text-stone-100", accent: "text-stone-300", card: "bg-stone-900/50", border: "border-stone-700", isDark: true },
    RetroTerminal: { bg: "bg-[#0a0f0a]", hex: "#0a0f0a", primary: "green-500", primaryHex: "#22c55e", text: "text-green-100", accent: "text-green-400", card: "bg-green-950/30", border: "border-green-500/30", isDark: true },
    Blueprint: { bg: "bg-[#1e40af]", hex: "#1e40af", primary: "white", primaryHex: "#ffffff", text: "text-white", accent: "text-blue-100", card: "bg-blue-800/50", border: "border-white/30", isDark: true },
    Clay: { bg: "bg-[#e5e5e1]", hex: "#e5e5e1", primary: "stone-600", primaryHex: "#57534e", text: "text-stone-900", accent: "text-stone-700", card: "bg-stone-200/50", border: "border-stone-300", isDark: false },
    Radioactive: { bg: "bg-[#bef264]", hex: "#bef264", primary: "black", primaryHex: "#000000", text: "text-black", accent: "text-black", card: "bg-lime-300/50", border: "border-black/20", isDark: false },
    Amethyst: { bg: "bg-[#0d0214]", hex: "#0d0214", primary: "purple-400", primaryHex: "#c084fc", text: "text-purple-100", accent: "text-purple-300", card: "bg-purple-950/30", border: "border-purple-500/30", isDark: true },
    CrimsonOLED: { bg: "bg-[#000000]", hex: "#000000", primary: "red-600", primaryHex: "#dc2626", text: "text-white", accent: "text-red-500", card: "bg-red-950/20", border: "border-red-900", isDark: true },
    Industrial: { bg: "bg-[#1c1c1c]", hex: "#1c1c1c", primary: "orange-500", primaryHex: "#f97316", text: "text-neutral-200", accent: "text-orange-400", card: "bg-neutral-800/50", border: "border-neutral-600", isDark: true },
    MidnightSun: { bg: "bg-[#1a0b2e]", hex: "#1a0b2e", primary: "amber-400", primaryHex: "#fbbf24", text: "text-purple-100", accent: "text-amber-300", card: "bg-purple-900/30", border: "border-amber-500/30", isDark: true }
};



const Typewriter = ({ text }) => {
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayText(text.slice(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 20); // Adjust speed as needed
        return () => clearInterval(timer);
    }, [text]);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
        >
            {displayText}
        </ReactMarkdown>
    );
};

export default function Chat() {
    const { currentUser, userData, loading: authLoading, theme, setTheme, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const mainRef = useRef(null);

    // --- BASIC STATES ---
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
    
    // DEBUG LOGS
    console.log('🔍 Chat render:', { currentUser: !!currentUser, userData: !!userData, authLoading, currentSessionId, messages: messages.length });
    const [sessionTitle, setSessionTitle] = useState("New Lesson");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [input, setInput] = useState(""); // <--- Only keep this ONE
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState(null);
    const [voices, setVoices] = useState([]);
    const [voiceEnabled, setVoiceEnabled] = useState(false);

    // --- FILE & UI STATES ---
    const [attachedFile, setAttachedFile] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [mode, setMode] = useState("Explain");
    const [subject, setSubject] = useState("");
    const [chapter, setChapter] = useState("");
    const [isSending, setIsSending] = useState(false);
    // ✅ DO THIS (Import it from your context)
    const [timer, setTimer] = useState(0);
    const [showSessionPicker, setShowSessionPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [showSubjDrop, setShowSubjDrop] = useState(false);
    const [showChapDrop, setShowChapDrop] = useState(false);
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [showContextOverlay, setShowContextOverlay] = useState(false);
    const [searchVault, setSearchVault] = useState("");
    const [showSidebar, setShowSidebar] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    const [showMindmapModal, setShowMindmapModal] = useState(false);
    const [showExamPrepModal, setShowExamPrepModal] = useState(false);


    // --- REFS ---
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);
    const docInputRef = useRef(null);
    const bottomRef = useRef(null);
    const chatContainerRef = useRef(null);
    const messagesEndRef = useRef(null);

    // --- CALCULATED STATISTICS ---
    const levelProgress = useMemo(() =>
        ((userData?.xp || 0) % 1000) / 10,
        [userData?.xp]
    );

    const dailyProgress = useMemo(() =>
        Math.min(((userData?.dailyXp || 0) / 500) * 100, 100),
        [userData?.dailyXp]
    );

    const currentLvl = useMemo(() =>
        Math.floor((userData?.xp || 0) / 1000) + 1,
        [userData?.xp]
    );

    const userClass = useMemo(() => {
        const cls = userData?.class || userData?.classLevel;
        if (typeof cls === 'string') {
            const match = cls.match(/\d+/);
            if (match) return match[0];
        }
        return "10";
    }, [userData]);

    const activeTheme = useMemo(() => {
        const themeKey = userData?.theme || "DeepSpace";
        return themes[themeKey] || themes.DeepSpace;
    }, [userData?.theme]);

    const filteredSessions = useMemo(() => {
        if (!sessions) return [];
        const query = (searchVault || "").toLowerCase();
        return sessions.filter(s =>
            (s.title || "").toLowerCase().includes(query) ||
            (s.subject || "").toLowerCase().includes(query)
        );
    }, [sessions, searchVault]);

    const quickReplies = useMemo(() => {
        if (mode === "Quiz") {
            return ["Quiz me", "Hard Mode", "easy mode", "Clear Quiz"];
        }
        if (mode === "HW") return ["Step-by-step", "Clarify this", "Alternative", "Clear Chat"];
        return [`Summarize ${chapter || 'this'}`, "Real-world application", "Simplify", "Didnt understand this part", "Clear Chat", "examples"];
    }, [mode, chapter]);

    const studyModeMeta = useMemo(() => {
        const boardName = userData?.board || "CBSE";
        return {
            label: "Quick Quiz",
            subtitle: "fast recall practice"
        };
    }, [userData?.board]);


    // --- EFFECTS ---
    useEffect(() => {
        const interval = setInterval(() => {
            setTimer(prev => {
                const newTime = prev + 1;
                if (newTime % 180 === 0 && currentUser) { incrementXP(1); }
                return newTime;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [currentUser]);

    useEffect(() => {
        if (activeTheme?.hex) {
            document.body.style.backgroundColor = activeTheme.hex;
            document.documentElement.style.backgroundColor = activeTheme.hex;
            document.body.style.color = activeTheme.isDark ? '#ffffff' : '#1e293b';
        }
    }, [activeTheme]);

    useEffect(() => {
        if (!authLoading && !currentUser) navigate("/login");
    }, [currentUser, authLoading, navigate]);

    // Load voices for TTS and handle cleanup
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        // Stop speech on page unload/reload/close
        const handleBeforeUnload = () => {
            window.speechSynthesis.cancel();
        };
        const handleVisibilityChange = () => {
            if (document.hidden) {
                window.speechSynthesis.cancel();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.speechSynthesis.cancel(); // Stop on unmount
        };
    }, []);

    useEffect(() => {
        if (userData && (userData.name === 'Scholar' || !userData.board)) {
            setShowOnboardingModal(true);
        }
    }, [userData]);

    // Handle incoming question from PYQ AI Help
    useEffect(() => {
        const askQuestion = location.state?.askQuestion;
        const questionData = location.state?.questionData;
        
        if (askQuestion && currentUser) {
            // Set context from PYQ
            const pyqSubject = location.state?.subject || subject;
            const pyqChapter = location.state?.chapter || chapter;
            const pyqBoard = location.state?.board || userData?.board || 'CBSE';
            const pyqClass = location.state?.classLevel || userData?.classLevel || '10';
            
            // Update context if available
            if (pyqSubject) setSubject(pyqSubject);
            if (pyqChapter) setChapter(pyqChapter);
            
            // Clear the location state to prevent re-triggering
            navigate(location.pathname, { replace: true, state: {} });
            
            // Send the question after a short delay to ensure context is set
            const formattedQuestion = `Please explain this question step by step: ${askQuestion}`;
            setTimeout(() => {
                sendMessage(formattedQuestion);
            }, 500);
        }
    }, [location.state, currentUser]);

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        const messagesContainer = messagesEndRef.current?.parentElement;
        if (messagesContainer) {
            const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 100;
            if (isAtBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [messages]);

    // Detect if user scrolled up
    useEffect(() => {
        const messagesContainer = chatContainerRef.current;
        if (messagesContainer) {
            const handleScroll = () => {
                if (messagesContainer) {
                    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
                    // If user is more than 300px away from the bottom, show the button
                    const isFarUp = scrollHeight - scrollTop - clientHeight > 300;
                    setShowScrollToBottom(isFarUp);
                }
            };
            messagesContainer.addEventListener('scroll', handleScroll);
            return () => messagesContainer.removeEventListener('scroll', handleScroll);
        }
    }, []);

    useEffect(() => {
        const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(5));
        const unsubLeader = onSnapshot(q, (snap) => {
            setLeaderboard(snap.docs.map((d, idx) => ({ id: d.id, rank: idx + 1, ...d.data() })));
        }, (err) => {
            console.warn("Leaderboard listener blocked:", err?.code || err?.message || err);
            setLeaderboard([]);
        });
        return () => unsubLeader();
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"), limit(10));
        return onSnapshot(q, (snap) => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => {
            console.warn("Session list listener blocked:", err?.code || err?.message || err);
            setSessions([]);
        });
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser || !currentSessionId) {
            setMessages([]); // Ensure blank when no session
            return;
        }

        console.log(`🔗 Listening to session: ${currentSessionId}`);
        // Listen to the SPECIFIC active session
        const unsub = onSnapshot(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log('📄 Session loaded:', data.messages?.length || 0, 'messages');
                
                // This restores your messages AND their attachments (images/docs)
                if (data.messages) {
                    setMessages(data.messages);
                } else {
                    setMessages([]); // Ensure blank if no messages
                }

                // This restores the AI's strict context (Subject/Chapter)
                if (data.subject) setSubject(data.subject);
                if (data.chapter) setChapter(data.chapter);
            } else {
                console.log('📄 Empty/new session - ready to chat');
                setMessages([]);
            }
        }, (err) => {
            console.error('Session snapshot error:', err);
            setMessages([]); // Fallback to blank
        });

        return () => unsub();
    }, [currentSessionId, currentUser]);

    // Update session's board and class when userData changes (ONLY if session exists)
    useEffect(() => {
        // 1. EXIT CONDITIONS
        if (!currentUser?.uid || !currentSessionId || !userData) return;

        const syncSessionMetaData = async () => {
            try {
                const sessionRef = doc(db, `users/${currentUser.uid}/sessions`, currentSessionId);

                // 2. DATA NORMALIZATION
                const updatedBoard = userData.board || "CBSE";
                const updatedClass = String(userData.classLevel || userData.class || "10");

                // 3. SILENT BACKGROUND UPDATE
                await setDoc(sessionRef, {
                    board: updatedBoard,
                    class: updatedClass,
                    lastUpdate: Date.now()
                }, { merge: true });

                console.log(`📡 Session ${currentSessionId} → ${updatedBoard} Class ${updatedClass}`);
            } catch (err) {
                console.error("Auto-sync failed:", err);
            }
        };

        syncSessionMetaData();
    }, [userData?.board, userData?.classLevel, userData?.class, currentUser?.uid, currentSessionId]);

    // Component Guard: Loading check
    if (authLoading || !userData) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-cyan-400 text-sm font-black uppercase tracking-widest">Initializing Neural Link...</span>
                </div>
            </div>
        );
    }

    // Function to Sync all Header/Overlay changes to Firestore
    const syncContext = async (overrideSubj, overrideChap, overrideTitle) => {
        // 1. DYNAMIC DATA EXTRACTION
        // We ensure userClass is captured accurately from our real-time userData
        const userClass = userData?.classLevel || userData?.class || "10";
        const userBoard = userData?.board || "CBSE";

        // 2. SAFETY CHECK
        if (!currentSessionId) {
            toast.error("No active session found to sync.");
            return;
        }

        try {
            const sessionRef = doc(db, `users/${currentUser.uid}/sessions`, currentSessionId);

            // 3. FALLBACK LOGIC
            // Use overrides (from dropdowns) OR fallback to current state
            const finalSubject = overrideSubj !== undefined ? overrideSubj : subject;
            const finalChapter = overrideChap !== undefined ? overrideChap : chapter;
            const finalTitle = overrideTitle !== undefined ? overrideTitle : sessionTitle;

            // 4. THE UPDATE PACKET
            const updates = {
                subject: finalSubject || "General",
                chapter: finalChapter || "General",
                title: finalTitle || "New Lesson",
                board: userBoard,
                class: String(userClass),
                lastUpdate: Date.now(),
                // Logic: Add a helper icon for the Sidebar list
                metadata: {
                    subjectIcon: finalSubject === "Maths" ? "🔢" :
                        finalSubject === "Science" ? "🧪" : "📚",
                    isPersonalized: true
                }
            };

            // 5. FIRESTORE SYNC
            await setDoc(sessionRef, updates, { merge: true });

            // 6. UI FEEDBACK
            // Only toast if this was a manual trigger (no arguments passed)
            const isManualSync = overrideSubj === undefined &&
                overrideChap === undefined &&
                overrideTitle === undefined;

            if (isManualSync) {
                toast.success(`Context Locked: Class ${userClass} (${userBoard})`, {
                    icon: "🔐",
                    style: { borderRadius: '15px', background: activeTheme.isDark ? '#111' : '#fff', color: activeTheme.isDark ? '#fff' : '#000' }
                });
                setShowContextOverlay(false);
            }

            console.log("✅ Neural Sync Complete:", updates);

        } catch (err) {
            console.error("Neural Sync Error:", err);
            toast.error("Neural link failed to sync context.");
        }
    };



    // Handle Title Edit Finish
    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        syncContext();
    };


    // --- CLEAR CHAT FUNCTION (NEW) ---
    const clearChat = async () => {
        const confirmed = window.confirm("Clear chat history and start fresh? This creates a new session.");
        if (!confirmed) return;
        
        // Create NEW session ID + blank state
        const newSessionId = Date.now().toString();
        setCurrentSessionId(newSessionId);
        setMessages([]);
        setSessionTitle("New Lesson");
        setSubject("");
        setChapter("");
        setInput("");
        
        try {
            // Initialize empty session in Firebase
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, newSessionId), {
                title: "New Lesson",
                subject: "",
                chapter: "",
                messages: [],
                lastUpdate: Date.now(),
                board: userData?.board || "CBSE",
                class: String(userData?.classLevel || userData?.class || "10")
            });
            toast.success("🧠 Fresh neural link established! Chat cleared.", {
                style: { borderRadius: '15px' }
            });
        } catch (err) {
            console.error("Clear chat error:", err);
            toast.error("Failed to initialize new session.");
        }
    };

    // --- LOGIC FUNCTIONS ---
    // 1. Make sure you have this state defined at the top of your component:
    // const [isAnalyzing, setIsAnalyzing] = useState(false);

    const speak = (text) => {
        if (!text) return;

        // Clean text: remove markdown syntax
        const cleanText = text.replace(/[*_`~#]/g, '').replace(/\n/g, ' ').trim();

        if (!cleanText) return;

        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Set language based on user preference
        const lang = userData?.language === 'Hinglish' ? 'hi-IN' : 'en-IN';
        utterance.lang = lang;

        // Force male voice selection with aggressive fallback
        const voices = synth.getVoices();
        let preferredVoice = null;

        // Priority 1: Exact language match with male indicator
        preferredVoice = voices.find(voice =>
            voice.lang === lang &&
            (voice.name.toLowerCase().includes('male') ||
                voice.name.toLowerCase().includes('man') ||
                voice.name.toLowerCase().includes('boy') ||
                voice.name.toLowerCase().includes('kumar') ||
                voice.name.toLowerCase().includes('arjun') ||
                voice.name.toLowerCase().includes('rahul'))
        );

        // Priority 2: Language match with male indicator (broader language match)
        if (!preferredVoice) {
            preferredVoice = voices.find(voice =>
                voice.lang.startsWith(lang.split('-')[0]) &&
                (voice.name.toLowerCase().includes('male') ||
                    voice.name.toLowerCase().includes('man') ||
                    voice.name.toLowerCase().includes('boy') ||
                    voice.name.toLowerCase().includes('kumar') ||
                    voice.name.toLowerCase().includes('arjun') ||
                    voice.name.toLowerCase().includes('rahul'))
            );
        }

        // Priority 3: Any male voice
        if (!preferredVoice) {
            preferredVoice = voices.find(voice =>
                voice.name.toLowerCase().includes('male') ||
                voice.name.toLowerCase().includes('man') ||
                voice.name.toLowerCase().includes('boy') ||
                voice.name.toLowerCase().includes('kumar') ||
                voice.name.toLowerCase().includes('arjun') ||
                voice.name.toLowerCase().includes('rahul')
            );
        }

        // Priority 4: Exact language match (any voice)
        if (!preferredVoice) {
            preferredVoice = voices.find(voice => voice.lang === lang);
        }

        // Priority 5: Language family match
        if (!preferredVoice) {
            preferredVoice = voices.find(voice => voice.lang.startsWith(lang.split('-')[0]));
        }

        // Priority 6: First available voice
        if (!preferredVoice && voices.length > 0) {
            preferredVoice = voices[0];
        }

        if (preferredVoice) {
            utterance.voice = preferredVoice;
            // Aggressive pitch adjustment to force male-like voice
            if (preferredVoice.name.toLowerCase().includes('female') ||
                preferredVoice.name.toLowerCase().includes('woman') ||
                preferredVoice.name.toLowerCase().includes('girl') ||
                preferredVoice.name.toLowerCase().includes('zira') ||
                preferredVoice.name.toLowerCase().includes('hazel')) {
                utterance.pitch = 0.4; // Very low pitch for female voices
            } else {
                utterance.pitch = 0.5; // Lower pitch for male voices
            }
        } else {
            utterance.pitch = 0.6; // Default low pitch
        }

        // Adjust parameters for more natural male speech
        utterance.rate = 1.0; // Slightly faster for natural flow
        utterance.volume = 1.0;

        synth.speak(utterance);
    };

    const stopSpeech = () => {
        window.speechSynthesis.cancel();
    };

    const handleFileUpload = async (e) => {
        if (!userData) return;

        let file = e.target.files[0];
        if (!file) return;

        // 1. Size Validation (Initial 10MB cap)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File too large. Maximum size is 10MB.");
            return;
        }

        try {
            setIsAnalyzing(true);
            const isImage = file.type.startsWith('image/');
            const isPDF = file.type === 'application/pdf';
            const type = isImage ? 'image' : 'document';

            setFileType(type);

            if (isImage) {
                // --- IMAGE COMPRESSION LOGIC ---
                const options = {
                    maxSizeMB: 0.1,       // Aim for ~100KB (Safe for Firestore)
                    maxWidthOrHeight: 1024,
                    useWebWorker: true
                };

                const compressedFile = await imageCompression(file, options);
                setAttachedFile(compressedFile); // Keep the file for sending

                // Convert to Base64 for preview and storage
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result;
                    setImagePreview(base64data);
                };
                reader.readAsDataURL(compressedFile);

            } else if (isPDF) {
                // --- PDF OPTIMIZATION LOGIC ---
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);

                // This flattens the PDF and removes unneeded metadata to save space
                const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
                const optimizedPDF = new Blob([compressedBytes], { type: 'application/pdf' });
                setAttachedFile(optimizedPDF); // Keep the blob for sending

                // Convert to Base64 for preview and storage
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result;
                    setImagePreview(base64data);
                };
                reader.readAsDataURL(optimizedPDF);

            } else {
                // Fallback for other document types
                setAttachedFile(file);
                setImagePreview(null);
            }

            toast.success("Neural Link Ready.");

        } catch (error) {
            console.error("Attachment Error:", error);
            toast.error("Compression failed. Try a smaller file.");
            setImagePreview(null);
            setAttachedFile(null);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const incrementXP = async (amount, reason = "") => {
        if (!currentUser) return;
        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, { xp: increment(amount), dailyXp: increment(amount) });
            if (reason) {
                console.log(`XP Awarded: +${amount} XP (${reason})`);
            }
        } catch (e) { console.error("XP Error", e); }
    };

    // Function to check if AI response indicates a correct answer in Quiz mode
    const checkCorrectAnswer = (response) => {
        const lowerResponse = response.toLowerCase();

        // Patterns that indicate a correct answer
        const correctPatterns = [
            "correct!",
            "that's correct!",
            "that's right!",
            "well done!",
            "excellent!",
            "perfect!",
            "you got it!",
            "absolutely correct",
            "you are right",
            "your answer is correct",
            "correct answer",
            "well done, that's correct",
            "awesome! that's correct",
            "great job! that's correct",
            "brilliant!",
            "splendid!",
            "marvellous!",
            "marvelous!",
            "outstanding!",
            "🎯 correct",
            "✅ correct",
            "right answer",
            "exactly!",
            "you nailed it!",
            "nice work!",
            "good job!",
            "thats correct"
        ];

        // Check if any correct pattern is found in the response
        return correctPatterns.some(pattern => lowerResponse.includes(pattern));
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Show the user something is happening
        setIsSending(true);

        try {
            let fileToProcess = file;

            // 2. If it's an image, COMPRESS IT
            if (file.type.startsWith('image/')) {
                const options = {
                    maxSizeMB: 0.5,          // Max 500kb for speed
                    maxWidthOrHeight: 1280,  // Good enough for AI to see
                    useWebWorker: true
                };
                fileToProcess = await imageCompression(file, options);
                setFileType('image');
            } else if (file.type === 'application/pdf') {
                // For PDFs, optimize using pdf-lib
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdfDoc = await PDFDocument.load(arrayBuffer);
                    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
                    fileToProcess = new Blob([compressedBytes], { type: 'application/pdf' });
                } catch (pdfError) {
                    console.error("PDF optimization error:", pdfError);
                    // Fall back to original file if optimization fails
                    fileToProcess = file;
                }
                setFileType('document');
            } else {
                setFileType('document');
            }

            // 3. Convert to Base64 for PREVIEW ONLY
            const reader = new FileReader();
            reader.readAsDataURL(fileToProcess);
            reader.onloadend = () => {
                const base64data = reader.result;
                setImagePreview(base64data); // This shows the preview in chat
                setAttachedFile(fileToProcess); // Keep the actual Blob/File for FormData!
                setIsSending(false);
            };

        } catch (error) {
            console.error("Compression Error:", error);
            toast.error("Failed to process file. Please try again.");
            setIsSending(false);
        }
    };
    const sendMessage = async (override = null) => {
        const text = override || input;

        // 1. VALIDATION
        if (isSending || (!text.trim() && !attachedFile)) return;

        // Safety check for userData
        if (!userData) {
            toast.error("Profile data not loaded. Please wait.");
            return;
        }

        // 2. DYNAMIC VARIABLE EXTRACTION (Prevents "Class 10" Defaulting)
        // We prioritize userData.classLevel and use '10' only as a final fallback.
        const userLang = userData?.language || 'English';
        const userClass = userData?.classLevel || userData?.class || '10';
        const userName = userData?.name || 'Explorer';
        const langMap = {
            // HYBRIDS (English + Regional)
            Hinglish: { root: "Hindi", bro: "Bhai", sis: "Behen", fail: "Koi baat nahi!", wait: "Pehle", check: "Samajh aaya?" },
            Kanglish: { root: "Kannada", bro: "Anna", sis: "Akka", fail: "Parvagilla!", wait: "Modalu", check: "Artha ayitha?" },
            Tanglish: { root: "Tamil", bro: "Thambi", sis: "Akka", fail: "Paravaillai!", wait: "Mudhala", check: "Puriyutha?" },
            Tenglish: { root: "Telugu", bro: "Tammudu", sis: "Akka", fail: "Parvaledu!", wait: "Modata", check: "Artham ayinda?" },
            Manglish: { root: "Malayalam", bro: "Aniyan", sis: "Chechi", fail: "Saramilla!", wait: "Aadyam", check: "Manasilaya?" },
            Benglish: { root: "Bengali", bro: "Bhai", sis: "Bon", fail: "Kichu hobe na!", wait: "Prothome", check: "Bujhte parle?" },
            Marathish: { root: "Marathi", bro: "Bhau", sis: "Tai", fail: "Kahich harakat nahi!", wait: "Adhi", check: "Samajhla ka?" },
            Gujarish: { root: "Gujarati", bro: "Bhai", sis: "Ben", fail: "Kai vandho nahi!", wait: "Pehla", check: "Samajh padyu?" },

            // NATIVE (Full Script)
            Hindi: { root: "Hindi", bro: "भाई", sis: "बहन", fail: "कोई बात नहीं!", script: "Devanagari", check: "समझ आया?" },
            Kannada: { root: "Kannada", bro: "ಅಣ್ಣ", sis: "ಅಕ್ಕ", fail: "ಪರವಾಗಿಲ್ಲ!", script: "Kannada", check: "ಅರ್ಥ ಆಯ್ತಾ?" },
            Tamil: { root: "Tamil", bro: "தம்பி", sis: "அக்கா", fail: "பரவாயில்லை!", script: "Tamil", check: "புரிகிறதா?" },
            Telugu: { root: "Telugu", bro: "తమ్ముడు", sis: "అక్క", fail: "పర్వాలేదు!", script: "Telugu", check: "అర్థమైందా?" },
            Malayalam: { root: "Malayalam", bro: "അനിയൻ", sis: "ചേച്ചി", fail: "സാരമില്ല!", script: "Malayalam", check: "മനസ്സിലായോ?" },
            Bengali: { root: "Bengali", bro: "ভাই", sis: "বোন", fail: "কিছু হবে না!", script: "Bengali", check: "বুঝতে পেরেছ?" },
            Marathi: { root: "Marathi", bro: "भाऊ", sis: "ताई", fail: "काही हरकत नाही!", script: "Devanagari", check: "समजले का?" },
            Gujarati: { root: "Gujarati", bro: "ભાઈ", sis: "બેન", fail: "કાઈ વાંધೋ નહીં!", script: "Gujarati", check: "સમજાયું?" },
            English: { root: "English", bro: "Buddy", sis: "Buddy", fail: "No worries!", script: "Latin", check: "Makes sense?" }
        };

        const lingo = langMap[userLang] || langMap.English;
        const संबोधन = userData.userGender === 'male' ? lingo.bro : userData.userGender === 'female' ? lingo.sis : "Dost";

        const userBoard = userData?.board || "CBSE";

        // Friendly personalization based on gender


        // 3. THE PERSONALIZED SYSTEM PROMPT (The "PadhoYaar" Persona)
        const systemInstruction = `
    ROLE: You are PadhoYaar, a brilliant, high-energy AI "Big Sibling" & Tutor for Class ${userClass} (${userBoard} Board). 
    Your student's name is ${userName}. You are their 24/7 study partner who makes learning feel like a conversation with a friend.

    [THE PADHOYAAR MANIFESTO]
    "Welcome to PadhoYaar! 🚀 Why struggle alone when you have an AI friend? From Class 8 to 12, I’m your 24/7 tutor for every single subject. Maths or Stats? I’ll solve it. Science or Commerce? I’ll explain it. Humanities? I’ve got the notes. If you haven't started today's prep yet—Ab PadhoYaar! Let’s turn those weak spots into your strengths."

    [CORE MISSION CONTEXT]
    - Subject: ${subject}
    - Chapter: ${chapter}
    - ACTIVE MODE: ${mode}
    
    [STRICT CHAPTER LOCK] 
    Focus ONLY on "${chapter}". 
    - If the student drifts, pull them back: "${lingo.wait} Pehle ${chapter} finish karte hain! 😉"

    [LANGUAGE & CULTURE]
    - CURRENT LANGUAGE: ${userLang}.
    - HINGLISH RULE: If ${userLang} involves Hindi, mix English technical terms with Hinglish logic. 
    - LOCAL VIBE: Use analogies related to ${lingo.root} (local food, cricket, pop culture) to explain complex theories.

    [MODE-SPECIFIC BEHAVIOR]
    
    1. EXPLAIN MODE (The Storyteller 📚) - Only if mode is "Explain":
       - OBJECTIVE: Concept Mastery. Use "Hooks" and local analogies.
       - DETAIL: Provide board-specific depth (CBSE/ICSE level).
       - REDIRECTS: If asked for HW solutions, say: "Change to HW mode for the full solution, Yaar! Let's understand the 'Why' here first." 
       - REDIRECTS: If asked for a Quiz, say: "Switch to Quiz mode and let's see what you've learned!" Do not generate questions here.
       - FORMATTING: Use # for Titles and **Bold** for key terms.

    2. HW MODE (The Coach 🧠) - Only if mode is "HW":
       - OBJECTIVE: Step-by-step guidance.
       - SCAFFOLDING: Provide the full answer but break it into "Logic Steps."
       - SPACING: Add 2-3 blank lines before and after LaTeX equations ($$formula$$) for maximum clarity.
       - TYPOGRAPHY: Step headings must be **EXTRA BOLD**. Use bullet points for steps.

    3. STUDY MODE (The Game Master 🎯) - Only if mode is "Quiz":
       - ACTIVE STUDY TRACK: ${studyModeMeta.label}
       - DEFAULT STRATEGY: Ask one crisp question at a time from ${chapter}. Keep it answer-first and interactive.
       - OUTPUT: ONLY the question and options/prompt. NO intro text.
       - IF CORRECT: "Correct! 🎉" + next question immediately.
       - IF WRONG: "Wrong! ❌. Switch to Explain mode to master this concept!" Do NOT give the full answer unless the student explicitly asks.
       - CRITICAL: Keep it tight, fast, and practice-oriented.
       - IF ACTIVE STUDY TRACK IS "PYQs":
         - Ask authentic ${userBoard}-style previous year questions or very close board-style equivalents from ${chapter}.
         - Prefer marking-scheme wording, weightage-aware phrasing, and recurring patterns.
         - When possible, add a short tag like "[${userBoard} PYQ Style]" or "[3 Marks]" at the top.
         - Mix formats naturally: 1-mark, 2-mark, 3-mark, case-based, and short answer depending on the chapter.
       - IF ACTIVE STUDY TRACK IS "Sample Papers" OR "Exam Practice":
         - Use full-paper style wording, section structure, and time-management framing.
       - IF ACTIVE STUDY TRACK IS "Objective Practice" OR "Quick Quiz":
         - Prefer MCQs, assertion-reason, and rapid-fire recall.

    [STRICT FORMATTING]
    - SPACING: Double line break after every paragraph. 📝
    - MATH: All math/science formulas MUST be in LaTeX ($$E=mc^2$$) and placed on their own lines.
    - VISUALS: Use 2-3 relevant emojis in every response.

    [ENDING PROTOCOL]
    Always end with this exact check-in in ${userLang}:
    "${lingo.check} 🚀"
`.trim();

        // 4. UI STATE UPDATES
        setIsSending(true);
        setIsTyping(true);

        const currentInput = text;
        const currentFile = attachedFile;
        const currentPreview = imagePreview;
        const currentFileType = fileType;

        // Immediate UI Reset
        setInput("");
        setImagePreview(null);
        setAttachedFile(null);
        setFileType(null);

        // 5. PREPARE FORMDATA FOR BACKEND
        const formData = new FormData();
        formData.append("userId", currentUser.uid);
        formData.append("message", currentInput);
        formData.append("systemInstruction", systemInstruction); // Injected dynamically!
        formData.append("subject", subject);
        formData.append("chapter", chapter);
        formData.append("mode", mode);
        formData.append("examPrepMode", "");
        formData.append("board", userData.board || "CBSE");
        formData.append("class", userClass); // Correct Class sent to backend

        // Append the file if it exists
        if (currentFile) {
            formData.append("file", currentFile);
        }

        // 6. LOCAL MESSAGE UPDATE (User Side)
        const userMsg = {
            role: "user",
            content: currentInput,
            attachment: currentPreview,
            attachmentName: currentFile?.name || "Attachment",
            attachmentType: currentFileType,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);

        try {
            console.log(`🚀 Sending to Padhoyaar -> Class: ${userClass}, Lang: ${userLang}`);

            // 7. API CALL
            const res = await axios.post(`${API_BASE}/chat`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const aiResponse = res.data.reply;
            const lowRes = aiResponse.toLowerCase();

            // 8. ANTI-SPAM YOUTUBE LOGIC
            let ytLink = null;
            if (mode === "Explain") {
                const smallTalkPhrases = ["hi", "hello", "hey", "thanks", "bye", "ok"];
                const startsWithSmallTalk = smallTalkPhrases.some(word => lowRes.substring(0, 40).includes(word));
                const teachingKeywords = ["define", "explain", "concept", "formula", "because", "understand"];
                const containsTeachingContent = teachingKeywords.some(word => lowRes.includes(word));

                if (aiResponse.length > 120 && !startsWithSmallTalk && containsTeachingContent) {
                    ytLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(
                        `${userData.board} class ${userClass} ${subject} ${chapter} explanation tutorial`
                    )}`;
                }
            }

            const aiMsg = {
                role: "ai",
                content: aiResponse,
                timestamp: Date.now(),
                ytLink,
            };

            // 9. FINAL STATE & DATABASE SYNC
            setMessages(prev => {
                const finalHistory = [...prev, aiMsg];
                const sessionRef = doc(db, `users/${currentUser.uid}/sessions`, currentSessionId);

                updateDoc(sessionRef, {
                    messages: finalHistory,
                    lastUpdate: Date.now(),
                    title: sessionTitle === "New Lesson" ? currentInput.slice(0, 25) + "..." : sessionTitle,
                    subject,
                    chapter,
                    board: userData.board,
                    class: userClass,
                    activeMode: mode
                }, { merge: true });

                if (voiceEnabled) speak(aiResponse);
                return finalHistory;
            });

            // 10. REWARD XP
            // Only award XP in Quiz mode for correct answers - No XP in Explain or HW modes
            if (mode === "Quiz") {
                const isCorrect = checkCorrectAnswer(aiResponse);
                if (isCorrect) {
                    // Award random 15-20 XP for correct answer
                    const quizXP = Math.floor(Math.random() * 6) + 15; // Random between 15-20
                    await incrementXP(quizXP, "Correct Answer in Quiz");

                    // Show a celebration toast for correct answer
                    toast.success(`🎉 Correct! +${quizXP} XP!`, {
                        icon: "🎯",
                        style: {
                            borderRadius: '15px',
                            background: activeTheme.isDark ? '#111' : '#fff',
                            color: activeTheme.isDark ? '#fff' : '#000',
                            border: '2px solid #10b981'
                        },
                        autoClose: 2000
                    });
                    console.log(`🎯 Quiz XP Awarded: +${quizXP} XP`);
                }
                // Wrong answers get no XP in Quiz mode
            }
            // No XP awarded for Explain or HW modes



        } catch (err) {
            console.error("Neural Error:", err);
            toast.error("Signal Lost. Check your neural link.");
            setInput(currentInput); // Restore input on error
            setMessages(prev => prev.filter(m => m !== userMsg));
        } finally {
            setIsSending(false);
            setIsTyping(false);
        }
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const calculateLevel = (xp) => Math.floor((xp || 0) / 1000) + 1;

    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            // If user is more than 300px away from the bottom, show the button
            const isFarUp = scrollHeight - scrollTop - clientHeight > 300;
            setShowScrollToBottom(isFarUp);
        }
    };

    const openVaultFile = (base64Data) => {
        try {
            // 1. Convert Base64 to a real PDF Blob
            const base64Parts = base64Data.split(',');
            const contentType = base64Parts[0].split(':')[1].split(';')[0];
            const byteCharacters = atob(base64Parts[1]);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: contentType });

            // 2. Create a temporary URL for the Blob
            const fileURL = URL.createObjectURL(blob);

            // 3. Open it
            window.open(fileURL, '_blank');
        } catch (err) {
            console.error(err);
            toast.error("Neural Link failed to decode file.");
        }
    };

    const handleLogout = async () => {
        try { await auth.signOut(); navigate("/login"); } catch (err) { toast.error("Logout Failed"); }
    };

    // Handler for quiz answer selection
    const handleQuizAnswer = (answer) => {
        if (answer && mode === "Quiz") {
            sendMessage(answer);
        }
    };

    // --- FLUID GROUPING: Helper to detect consecutive AI messages ---
    const getMessageGrouping = (index) => {
        const msg = messages[index];
        if (msg.role !== 'ai') return { isGrouped: false, isFirst: false, isLast: false };

        const prevMsg = index > 0 ? messages[index - 1] : null;
        const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

        const isGrouped = (prevMsg?.role === 'ai') || (nextMsg?.role === 'ai');
        const isFirst = prevMsg?.role !== 'ai';
        const isLast = nextMsg?.role !== 'ai';

        return { isGrouped, isFirst, isLast };
    };


    // Component Guard: Loading check
    if (authLoading || !userData) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-cyan-400 text-sm font-black uppercase tracking-widest">Initializing Neural Link...</span>
                </div>
            </div>
        );
    }

    // Get theme colors for scrollbar
    const getScrollbarColors = () => {
        const themeKey = userData?.theme || "DeepSpace";
        const colorMap = {
            DeepSpace: { primary: "#4f46e5", secondary: "#06b6d4", accent: "#8b5cf6" },
            Light: { primary: "#4f46e5", secondary: "#06b6d4", accent: "#ec4899" },
            Sakura: { primary: "#ec4899", secondary: "#f43f5e", accent: "#fb7185" },
            Cyberpunk: { primary: "#06b6d4", secondary: "#a855f7", accent: "#22d3ee" },
            RoyalParchment: { primary: "#b45309", secondary: "#d97706", accent: "#f59e0b" },
            MidnightAurora: { primary: "#10b981", secondary: "#34d399", accent: "#6ee7b7" },
            SunsetDrift: { primary: "#f97316", secondary: "#fb923c", accent: "#fdba74" },
            Phantom: { primary: "#ffffff", secondary: "#a1a1aa", accent: "#71717a" },
            Solaris: { primary: "#facc15", secondary: "#fde047", accent: "#fef08a" },
            Aero: { primary: "#94a3b8", secondary: "#cbd5e1", accent: "#e2e8f0" },
            Toxic: { primary: "#a3e635", secondary: "#84cc16", accent: "#65a30d" },
            Synthwave: { primary: "#22d3ee", secondary: "#e879f9", accent: "#c084fc" },
            Coffee: { primary: "#d6c5bb", secondary: "#a8a29e", accent: "#78716c" },
            RetroTerminal: { primary: "#22c55e", secondary: "#4ade80", accent: "#86efac" },
            Blueprint: { primary: "#ffffff", secondary: "#93c5fd", accent: "#60a5fa" },
            Clay: { primary: "#57534e", secondary: "#78716c", accent: "#a8a29e" },
            Radioactive: { primary: "#000000", secondary: "#3f6212", accent: "#65a30d" },
            Amethyst: { primary: "#c084fc", secondary: "#a855f7", accent: "#9333ea" },
            CrimsonOLED: { primary: "#dc2626", secondary: "#ef4444", accent: "#f87171" },
            Industrial: { primary: "#f97316", secondary: "#fb923c", accent: "#fdba74" },
            MidnightSun: { primary: "#fbbf24", secondary: "#f59e0b", accent: "#d97706" }
        };
        return colorMap[themeKey] || colorMap.DeepSpace;
    };

    const scrollColors = getScrollbarColors();

    return (
        <div>
            {/* Theme-Aware Animated Scrollbar Styles */}
            <style>{`
                .chat-scrollbar::-webkit-scrollbar {
                    width: 10px;
                    display: block !important;
                }
                
                .chat-scrollbar::-webkit-scrollbar-track {
                    background: ${activeTheme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'};
                    border-radius: 20px;
                    border: 1px solid ${activeTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
                }
                
                .chat-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(
                        180deg,
                        ${scrollColors.primary} 0%,
                        ${scrollColors.secondary} 50%,
                        ${scrollColors.accent} 100%
                    );
                    background-size: 100% 200%;
                    border-radius: 20px;
                    border: 2px solid ${activeTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)'};
                    box-shadow: 
                        0 0 10px ${scrollColors.primary}40,
                        inset 0 0 5px rgba(255,255,255,0.3);
                    animation: chat-scroll-flow 3s ease-in-out infinite;
                    min-height: 60px;
                }
                
                .chat-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(
                        180deg,
                        ${scrollColors.accent} 0%,
                        ${scrollColors.primary} 50%,
                        ${scrollColors.secondary} 100%
                    );
                    box-shadow: 
                        0 0 20px ${scrollColors.primary}60,
                        0 0 30px ${scrollColors.secondary}40,
                        inset 0 0 8px rgba(255,255,255,0.5);
                    animation: chat-scroll-flow-fast 1.5s ease-in-out infinite;
                }
                
                /* Active scrolling animation - faster when scrolling */
                .chat-scrollbar.scrolling::-webkit-scrollbar-thumb {
                    animation: chat-scroll-active 0.5s linear infinite;
                    box-shadow: 
                        0 0 25px ${scrollColors.primary}80,
                        0 0 40px ${scrollColors.secondary}60,
                        inset 0 0 10px rgba(255,255,255,0.6);
                }
                
                @keyframes chat-scroll-flow {
                    0%, 100% { background-position: 0% 0%; }
                    50% { background-position: 0% 100%; }
                }
                
                @keyframes chat-scroll-flow-fast {
                    0%, 100% { background-position: 0% 0%; filter: brightness(1); }
                    50% { background-position: 0% 100%; filter: brightness(1.2); }
                }
                
                @keyframes chat-scroll-active {
                    0% { 
                        background-position: 0% 0%; 
                        filter: brightness(1) saturate(1);
                    }
                    50% { 
                        background-position: 0% 100%; 
                        filter: brightness(1.3) saturate(1.2);
                    }
                    100% { 
                        background-position: 0% 0%; 
                        filter: brightness(1) saturate(1);
                    }
                }
                
                /* Firefox support */
                .chat-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: ${scrollColors.primary} ${activeTheme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'};
                }
            `}</style>

            <ToastContainer theme={activeTheme.isDark ? "dark" : "light"} />


            {/* SIDEBAR (PRESERVED) */}
            {/* --- WIDER SCHOLAR DASHBOARD (STATISTICS) --- */}
            <AnimatePresence>
                {showSidebar && (
                    <>
                        {/* Backdrop Blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSidebar(false)}
                            className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[800]"
                        />

                        {/* Main Wide Panel */}
                        <motion.div
                            initial={{ x: -600 }}
                            animate={{ x: 0 }}
                            exit={{ x: -600 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className={`fixed inset-y-0 left-0 w-[92%] md:w-[520px] ${activeTheme.bg} border-r ${activeTheme.border} z-[801] p-8 md:p-14 flex flex-col shadow-[50px_0_100px_rgba(0,0,0,0.5)]`}
                        >
                            {/* Header Section */}
                            <div className="flex justify-between items-start mb-12">
                                <div className="flex flex-col">
                                    <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">Statistics</h3>
                                    <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.5em] opacity-30 mt-2 text-${activeTheme.accent}`}>Scholar Neural Link</p>
                                </div>
                                <button
                                    onClick={() => setShowSidebar(false)}
                                    className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                                >
                                    <FaTimes className="group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>

                            {/* Content Area with Liquid Scrollbar */}
                            <div className="flex-1 overflow-y-auto custom-scroll pr-4 space-y-12">

                                {/* Big Phase Badge Card */}
                                <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 p-10 rounded-[3.5rem] flex flex-col items-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-10">
                                        <FaBrain size={80} />
                                    </div>

                                    <motion.div whileHover={{ scale: 1.05 }} className="relative mb-8">
                                        <div className={`w-36 h-36 rounded-[3.5rem] bg-${activeTheme.primary} flex items-center justify-center font-black text-6xl border-4 border-white/10`}
                                            style={{ boxShadow: `0 0 70px ${activeTheme.primaryHex}50` }}>
                                            {currentLvl}
                                        </div>
                                        {userData.streak >= 3 && (
                                            <motion.div
                                                animate={{ y: [0, -12, 0], scale: [1, 1.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                className={`absolute -top-6 -right-6 bg-${activeTheme.primary} p-5 rounded-[2rem] border-4 border-[#080808]`}
                                                style={{ boxShadow: `0 0 30px ${activeTheme.primaryHex}` }}
                                            >
                                                <FaFire size={28} className="text-white" />
                                            </motion.div>
                                        )}
                                    </motion.div>

                                    <div className="text-center">
                                        <h4 className="text-2xl font-black uppercase tracking-[0.2em]">Academic Phase {currentLvl}</h4>
                                        <div className="flex items-center justify-center gap-3 mt-4">
                                            <span className={`px-4 py-1.5 bg-${activeTheme.primary}/20 text-${activeTheme.accent} rounded-full text-[10px] font-black border border-${activeTheme.primary}/30 uppercase tracking-widest`}>
                                                {userData?.xp || 0} Total XP
                                            </span>
                                            <span className="px-4 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-full text-[10px] font-black border border-emerald-500/30 uppercase tracking-widest">
                                                {userData?.streak || 0} Day Streak
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Metrics */}
                                <div className="grid gap-8">
                                    {/* Level Progress */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">Neural Evolution</span>
                                            <span className={`text-lg font-black text-${activeTheme.accent}`}>{levelProgress.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-4 bg-white/5 rounded-full p-1 border border-white/5 relative">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${levelProgress}%` }}
                                                className={`h-full bg-gradient-to-r from-${activeTheme.primary} to-blue-400 rounded-full`}
                                                style={{ boxShadow: `0 0 20px ${activeTheme.primaryHex}60` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Daily Goal */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">Daily Quota</span>
                                            <span className="text-lg font-black text-emerald-500">{userData.dailyXp}<span className="text-[10px] opacity-30">/500</span></span>
                                        </div>
                                        <div className="h-4 bg-white/5 rounded-full p-1 border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${dailyProgress}%` }}
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.6)]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Leaderboard Section (Wide) */}
                                <div className="space-y-6">
                                    <label className="text-[11px] font-black uppercase tracking-[0.4em] opacity-30 flex items-center gap-3">
                                        <FaTrophy className="text-yellow-500" /> Competitive Hierarchy
                                    </label>
                                    <div className="grid gap-3">
                                        {leaderboard.map((user, idx) => (
                                            <motion.div
                                                key={user.id}
                                                whileHover={{ x: 10 }}
                                                onClick={() => { setSelectedUser(user); setShowProfileModal(true); }}
                                                className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all cursor-pointer ${user.id === currentUser?.uid ? `bg-${activeTheme.primary}/10 border-${activeTheme.primary}/40 shadow-lg` : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}
                                                style={user.id === currentUser?.uid ? { boxShadow: `0 0 20px ${activeTheme.primaryHex}10` } : {}}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="relative">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-white/5 text-white/40'}`}>
                                                            {user.pfp ? (
                                                                <img src={user.pfp} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                                                            ) : (
                                                                (user.name || "Anonymous")[0].toUpperCase()
                                                            )}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 bg-${activeTheme.primary} rounded-full flex items-center justify-center text-[8px] font-black text-white`}>
                                                            {idx + 1}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black uppercase tracking-tight">{user.name || "Anonymous"}</span>
                                                        <span className="text-[10px] opacity-30 font-bold uppercase tracking-widest">Level {Math.floor(user.xp / 1000) + 1}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-sm font-black text-${activeTheme.accent}`}>{user.xp}</span>
                                                    <p className="text-[8px] opacity-20 font-black uppercase">XP</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div className="pt-10 border-t border-white/5 flex flex-col items-center opacity-20">
                                    <FaLayerGroup size={24} className="mb-4" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.5em]">Synchronized Academic Profile</p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- NEW CONTEXT OVERLAY (PHONE OPTIMIZED) --- */}
            {/* --- CONTEXT OVERLAY (MOBILE/TABLET) --- */}
            <AnimatePresence>
                {showContextOverlay && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className={`fixed inset-0 z-[999] ${activeTheme.isDark ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-3xl p-6 flex flex-col justify-center gap-6`}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex flex-col">
                                <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${activeTheme.text}`}>Neural Vault</h2>
                                <span className={`text-[10px] font-bold ${activeTheme.accent} tracking-[0.3em] uppercase`}>
                                    Config: {userData?.board} — Class {userData?.classLevel || userData?.class}
                                </span>
                            </div>
                            <button onClick={() => setShowContextOverlay(false)} className={`p-4 bg-white/5 rounded-full ${activeTheme.text} active:scale-90 transition-transform`}>
                                <FaTimes size={18} className={activeTheme.text} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Mobile Subject Selector */}
                            {/* Mobile Subject Selector */}
                            <div className="relative">
                                <label className={`text-[10px] font-black uppercase opacity-40 ${activeTheme.text} ml-4 mb-2 block`}>Primary Subject</label>
                                <div onClick={() => { setShowSubjDrop(!showSubjDrop); setShowChapDrop(false); }} className={`flex items-center justify-between p-5 rounded-[2rem] ${activeTheme.card} border ${activeTheme.border} cursor-pointer shadow-2xl`}>
                                    <span className={`text-sm font-black uppercase ${activeTheme.text}`}>{subject || "Select Subject"}</span>
                                    <FaChevronDown size={12} className={`transition-transform duration-300 ${showSubjDrop ? 'rotate-180' : ''} opacity-30 ${activeTheme.text}`} />
                                </div>
                                {showSubjDrop && (
                                    <div className={`absolute top-full left-0 w-full mt-2 rounded-2xl ${activeTheme.isDark ? 'bg-gray-900' : 'bg-white'} border ${activeTheme.border} p-2 max-h-48 overflow-y-auto z-[1000] backdrop-blur-xl shadow-2xl no-scrollbar`}>
                                        {Object.keys(syllabusData?.[userData?.board]?.[String(userData?.classLevel || userData?.class)] || {}).map(s => (
                                            <div key={s} onClick={() => {
                                                setSubject(s);
                                                setChapter(""); // Reset chapter on subject change
                                                syncContext(s, "");
                                                setShowSubjDrop(false);
                                            }} className={`p-4 rounded-xl text-xs font-bold uppercase ${activeTheme.text} hover:bg-white/10 transition-colors`}>{s}</div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Mobile Chapter Selector */}
                            <div className="relative">
                                <label className={`text-[10px] font-black uppercase opacity-40 ${activeTheme.text} ml-4 mb-2 block`}>Target Chapter</label>
                                <div onClick={() => { setShowChapDrop(!showChapDrop); setShowSubjDrop(false); }} className={`flex items-center justify-between p-5 rounded-[2rem] ${activeTheme.card} border ${activeTheme.border} cursor-pointer shadow-2xl`}>
                                    <span className={`text-sm font-black uppercase ${activeTheme.text}`}>{chapter || "Select Chapter"}</span>
                                    <FaChevronDown size={12} className={`transition-transform duration-300 ${showChapDrop ? 'rotate-180' : ''} opacity-30 ${activeTheme.text}`} />
                                </div>
                                {showChapDrop && (
                                    <div className={`absolute top-full left-0 w-full mt-2 rounded-2xl ${activeTheme.isDark ? 'bg-gray-900' : 'bg-white'} border ${activeTheme.border} p-2 max-h-48 overflow-y-auto z-[1000] backdrop-blur-xl shadow-2xl no-scrollbar`}>
                                        {(syllabusData?.[userData?.board]?.[String(userData?.classLevel || userData?.class)]?.[subject] || []).map(ch => (
                                            <div key={ch} onClick={() => {
                                                setChapter(ch);
                                                syncContext(subject, ch);
                                                setShowChapDrop(false);
                                            }} className={`p-4 rounded-xl text-xs font-bold uppercase ${activeTheme.text} hover:bg-white/10 transition-colors`}>{ch}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>



                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col relative h-full">
                <Navbar userData={userData} />

                {/* --- STICKY HEADER --- */}
                <div className="w-full max-w-3xl mx-auto px-4 mt-2 md:mt-4 space-y-2 md:space-y-4 z-[400] sticky top-[72px]">

                    {/* Main Header Bar */}
                    <div className={`flex items-center gap-4 p-3 md:p-4 rounded-2xl md:rounded-3xl ${activeTheme.card} border ${activeTheme.border} backdrop-blur-xl shadow-2xl`}>
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <FaHistory size={12} className={activeTheme.accent} />
                            {isEditingTitle ? (
                                <input
                                    autoFocus
                                    value={sessionTitle}
                                    onChange={(e) => setSessionTitle(e.target.value)}
                                    onBlur={handleTitleBlur}
                                    onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                                    className={`bg-transparent border-none focus:ring-0 text-[10px] md:text-xs font-black uppercase p-0 w-32 outline-none ${activeTheme.text} placeholder-white/20`}
                                    placeholder="RENAME SESSION..."
                                />
                            ) : (
                                <span onClick={() => setIsEditingTitle(true)} className={`text-[10px] md:text-xs font-black uppercase tracking-tighter cursor-pointer truncate max-w-[120px] md:max-w-none ${activeTheme.text} hover:opacity-70 transition-opacity`}>
                                    {sessionTitle || "New Lesson"}
                                </span>
                            )}
                        </div>

                        <div className="relative hidden md:block">
                            <div onClick={() => { setShowSubjDrop(!showSubjDrop); setShowChapDrop(false); }} className={`flex items-center gap-3 p-1.5 rounded-[2rem] ${activeTheme.card} border ${activeTheme.border} cursor-pointer hover:border-white/20 transition-all shadow-lg`}>
                                <div className="p-3 rounded-full bg-white/5"><FaLayerGroup className={activeTheme.accent} size={14} /></div>
                                <span className={`flex-1 text-[10px] font-black uppercase truncate ${activeTheme.text}`}>{subject || "Subject"}</span>
                                <FaChevronDown size={10} className={`mr-4 transition-transform duration-300 ${showSubjDrop ? 'rotate-180' : ''} opacity-30 ${activeTheme.text}`} />
                            </div>
                            <AnimatePresence>
                                {showSubjDrop && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute top-full left-0 w-full mt-2 rounded-2xl ${activeTheme.isDark ? 'border-white/10 bg-black/90' : 'border-slate-200 bg-white'} backdrop-blur-2xl z-[500] p-2 max-h-48 overflow-y-auto shadow-2xl no-scrollbar`}>
                                        {Object.keys(syllabusData?.[userData?.board]?.[String(userData?.classLevel || userData?.class)] || {}).map(s => (
                                            <div key={s} onClick={() => {
                                                setSubject(s);
                                                setChapter("");
                                                setShowSubjDrop(false);
                                                syncContext(s, ""); // Immediate subject update
                                            }} className={`p-4 rounded-xl text-[10px] font-black uppercase ${activeTheme.text} hover:bg-white/10 cursor-pointer transition-colors`}>{s}</div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative hidden md:block">
                            <div onClick={() => { setShowChapDrop(!showChapDrop); setShowSubjDrop(false); }} className={`flex items-center gap-3 p-1.5 rounded-[2rem] ${activeTheme.card} border ${activeTheme.border} cursor-pointer hover:border-white/20 transition-all shadow-lg`}>
                                <div className="p-3 rounded-full bg-white/5"><FaBrain className="text-cyan-400" size={14} /></div>
                                <span className={`flex-1 text-[10px] font-black uppercase truncate ${activeTheme.text}`}>{chapter || "Chapter"}</span>
                                <FaChevronDown size={10} className={`mr-4 transition-transform duration-300 ${showChapDrop ? 'rotate-180' : ''} opacity-30 ${activeTheme.text}`} />
                            </div>
                            <AnimatePresence>
                                {showChapDrop && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute top-full left-0 w-full mt-2 rounded-2xl ${activeTheme.isDark ? 'border-white/10 bg-black/90' : 'border-slate-200 bg-white'} backdrop-blur-2xl z-[500] p-2 max-h-48 overflow-y-auto shadow-2xl no-scrollbar`}>
                                        {(syllabusData?.[userData?.board]?.[String(userData?.classLevel || userData?.class)]?.[subject] || []).map(ch => (
                                            <div key={ch} onClick={() => {
                                                setChapter(ch);
                                                setShowChapDrop(false);
                                                syncContext(subject, ch); // Immediate chapter update
                                            }} className={`p-4 rounded-xl text-[10px] font-black uppercase ${activeTheme.text} hover:bg-white/10 cursor-pointer transition-colors`}>{ch}</div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* NEW CHAT BUTTON (Prominent) */}

                            
                            <div
                                onClick={() => setShowContextOverlay(true)}
                                className="md:hidden flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 active:bg-white/10 transition-colors"
                            >
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 truncate max-w-[80px]">
                                    {subject || 'CONTEXT'}
                                </span>
                                <FaSlidersH size={10} className={`opacity-40 ${activeTheme.text}`} />
                            </div>
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 text-[9px] font-black uppercase ${activeTheme.text} shadow-inner`}>
                                <FaClock className={activeTheme.accent} size={10} /> {formatTime(timer)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* MESSAGES AREA */}
                <div className="flex flex-col overflow-hidden bg-transparent">

                    {/* 2. FIXED CHAT AREA */}
                    <div className="relative flex flex-col h-[500px] w-full overflow-hidden">

                        <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto p-4 md:p-8 chat-scrollbar scroll-smooth"
                            onScroll={(e) => {
                                // Add scrolling class for active animation
                                const target = e.target;
                                target.classList.add('scrolling');
                                clearTimeout(target.scrollTimeout);
                                target.scrollTimeout = setTimeout(() => {
                                    target.classList.remove('scrolling');
                                }, 150);
                                handleScroll();
                            }}
                        >

                            <div className="max-w-3xl mx-auto space-y-10 pb-32">

                                {messages.length === 0 && (
                                    <div className="h-64 flex flex-col items-center justify-center opacity-10">
                                        <FaWaveSquare size={40} className="animate-pulse text-indigo-400" />
                                    </div>
                                )}

                                {/* --- MESSAGES LOOP --- */}
                                {messages.map((msg, i) => {
                                    // Get Fluid Grouping status for this message
                                    const { isGrouped, isFirst, isLast } = getMessageGrouping(i);

                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={msg.timestamp || i}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full mb-6`}
                                        >
                                            <ChatBubble
                                                message={msg}
                                                theme={activeTheme}
                                                isGrouped={isGrouped}
                                                isFirst={isFirst}
                                                isLast={isLast}
                                            >
                                                {/* --- ATTACHMENT RENDERER --- */}
                                                {msg.attachment && (
                                                    <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 bg-black/30 max-w-sm">
                                                        {msg.attachmentType === 'image' ? (
                                                            <img
                                                                src={msg.attachment}
                                                                alt="Neural Context"
                                                                className="w-full h-auto max-h-72 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex flex-col p-4 gap-3 bg-white/5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2.5 bg-red-500/20 rounded-xl">
                                                                        <FaFilePdf className="text-red-400" size={20} />
                                                                    </div>
                                                                    <span className="text-xs text-white/90 font-medium truncate">
                                                                        {msg.attachmentName || "Source_Document.pdf"}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => openVaultFile(msg.attachment)}
                                                                    className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/25 text-[9px] text-center font-bold uppercase tracking-widest text-indigo-300 rounded-lg border border-indigo-500/20"
                                                                >
                                                                    Access Knowledge Vault
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* --- MESSAGE CONTENT --- */}
                                                <div className="prose prose-invert prose-sm max-w-none">
                                                    {msg.role === 'ai' ? (
                                                        // Don't show Typewriter content if it's a quiz question (QuizBubble will handle it)
                                                        mode === "Quiz" && isMCQ(msg.content) ? null : (
                                                            <Typewriter text={msg.content} />
                                                        )
                                                    ) : (
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm, remarkMath]}
                                                            rehypePlugins={[rehypeKatex]}
                                                        >
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    )}
                                                </div>

                                                {/* --- QUIZ BUBBLE (Only in Quiz Mode) --- */}
                                                {mode === "Quiz" && msg.role === "ai" && (
                                                    <QuizBubble
                                                        message={msg}
                                                        onAnswerSelect={handleQuizAnswer}
                                                        theme={activeTheme}
                                                    />
                                                )}

                                                {/* --- VOICE TOGGLE BUTTON FOR AI MESSAGES --- */}
                                                {msg.role === 'ai' && (
                                                    <div className="mt-3 flex justify-end">
                                                        <button
                                                            onClick={() => {
                                                                if (speakingMessageId === msg.timestamp) {
                                                                    stopSpeech();
                                                                    setSpeakingMessageId(null);
                                                                } else {
                                                                    speak(msg.content);
                                                                    setSpeakingMessageId(msg.timestamp);
                                                                }
                                                            }}
                                                            className="p-2 rounded-full transition-all border"
                                                            style={speakingMessageId === msg.timestamp ? {
                                                                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                                                color: '#22c55e',
                                                                borderColor: 'rgba(34, 197, 94, 0.3)'
                                                            } : {
                                                                backgroundColor: `${activeTheme.primaryHex}20`,
                                                                color: activeTheme.primaryHex,
                                                                borderColor: `${activeTheme.primaryHex}30`
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (speakingMessageId !== msg.timestamp) {
                                                                    e.currentTarget.style.backgroundColor = `${activeTheme.primaryHex}40`;
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (speakingMessageId !== msg.timestamp) {
                                                                    e.currentTarget.style.backgroundColor = `${activeTheme.primaryHex}20`;
                                                                }
                                                            }}
                                                            title={speakingMessageId === msg.timestamp ? 'Stop Voice' : 'Enable Voice'}
                                                        >
                                                            <FaVolumeUp size={14} />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* --- YOUTUBE LINK (AI ONLY & CONDITIONAL) --- */}
                                                {msg.role === 'ai' && msg.ytLink && typeof msg.ytLink === 'string' && msg.ytLink.includes('youtube.com') && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="mt-4 pt-4 border-t border-white/5"
                                                    >
                                                        <div className="flex flex-col gap-2">
                                                            {/* Subtle Label with Subject/Chapter context */}
                                                            <div className="flex justify-between items-center ml-1">
                                                                <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${activeTheme.text}/30`}>
                                                                    Neural Recommended Media
                                                                </span>
                                                                {/* Secondary badge for Chapter info */}
                                                                <span className="text-[7px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                                                    {subject || "General"} • {chapter || "Lesson"}
                                                                </span>
                                                            </div>

                                                            <a
                                                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                                                                    (userData?.board || "CBSE") + " class " + userClass + " " + (subject || "") + " " + (chapter || "") + " explanation"
                                                                )}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="group relative flex items-center justify-between gap-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300 shadow-lg shadow-red-500/5"
                                                            >

                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-red-500 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.4)] group-hover:scale-110 transition-transform">
                                                                        <FaYoutube size={14} className="text-white" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 group-hover:text-red-400">
                                                                            Watch {subject || "Related"} Lesson
                                                                        </span>
                                                                        <span className={`text-[9px] ${activeTheme.text}/40 font-medium italic leading-tight`}>
                                                                            {userData?.board || "CBSE"} • Class {userClass} • {subject || "Science"}
                                                                        </span>

                                                                    </div>
                                                                </div>

                                                                <div className="mr-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                                                    <FaChevronRight size={10} className="text-red-500" />
                                                                </div>
                                                            </a>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </ChatBubble>
                                        </motion.div>
                                    );
                                })}


                                {/* --- TYPING INDICATOR --- */}
                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        className="flex justify-start w-full mb-6"
                                    >
                                        <div className={`p-5 md:p-6 rounded-[2rem] max-w-[90%] md:max-w-[80%] shadow-2xl ${activeTheme.card} border ${activeTheme.border} rounded-tl-none`}>
                                            <div className="flex items-center gap-3">
                                                <div className="flex gap-1">
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                                                        className="w-2 h-2 bg-indigo-400 rounded-full"
                                                    />
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                                        className="w-2 h-2 bg-indigo-400 rounded-full"
                                                    />
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                                        className="w-2 h-2 bg-indigo-400 rounded-full"
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-indigo-400 animate-pulse">
                                                    AI is thinking...
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* --- AUTO-SCROLL ANCHOR --- */}
                                <div ref={messagesEndRef} className="h-2 w-full" />
                            </div>
                        </div>
                    </div>

                    {/* 3. INPUT AREA (Fixed Sibling) */}
                    <div className="flex-shrink-0 w-full bg-transparent p-4 z-50">
                        <div className="max-w-3xl mx-auto">
                            {/* Your Input bar and Quick Replies code goes here */}
                        </div>
                    </div>
                </div>

                {/* --- REFINED BOTTOM INTERFACE --- */}
                <div className="fixed bottom-0 left-0 w-full z-[600] pointer-events-none">
                    <div className="max-w-4xl mx-auto p-2 md:p-4 pointer-events-auto">

                        {/* --- COOL SCROLL TO BOTTOM BUTTON --- */}
                        <AnimatePresence>
                            {showScrollToBottom && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                                    whileHover={{ y: -5 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="absolute -top-20 right-6 md:right-10 z-[610]"
                                >
                                    <button
                                        onClick={scrollToBottom}
                                        className="relative flex items-center justify-center p-4 rounded-full group transition-all"
                                        style={{
                                            backgroundColor: activeTheme.card,
                                            border: `1px solid ${activeTheme.primaryHex}55`,
                                            boxShadow: `0 0 20px ${activeTheme.primaryHex}33`
                                        }}
                                    >
                                        {/* Outer Pulsing Ring */}
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute inset-0 rounded-full"
                                            style={{ border: `2px solid ${activeTheme.primaryHex}` }}
                                        />

                                        {/* The Icon */}
                                        <div className="relative flex flex-col items-center">
                                            <FaChevronDown
                                                size={18}
                                                className={`${activeTheme.accent} group-hover:translate-y-1 transition-transform duration-300`}
                                            />

                                            {/* Tiny "New" Indicator */}
                                            <motion.span
                                                animate={{ opacity: [0, 1, 0] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                className="absolute -top-8 bg-white text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-xl"
                                                style={{ backgroundColor: activeTheme.primaryHex }}
                                            >
                                                New
                                            </motion.span>
                                        </div>

                                        {/* Glassmorphism Background Layer */}
                                        <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-md -z-10" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 1. Quick Replies */}
                        <AnimatePresence>
                            {input.length < 10 && (
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="flex gap-2 overflow-x-auto no-scrollbar mb-2 px-4">
                                    {quickReplies.map(q => (
                                        <button
                                            key={q}
                                            onClick={() => {
                                                if (q === "Generate Mindmap") {
                                                    setShowMindmapModal(true);
                                                } else {
                                                    sendMessage(q);
                                                }
                                            }}
                                            className={`whitespace-nowrap px-4 py-2 rounded-full border ${activeTheme.border} ${activeTheme.card} backdrop-blur-xl text-[10px] font-black uppercase tracking-tighter hover:bg-white/10 transition-all`}
                                        >
                                            {q}
                                        </button>
                                    ))}

                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 2. Main Control Bar */}
                        <div className={`relative flex flex-col gap-2 p-2 md:p-3 rounded-[2.5rem] md:rounded-[3rem] ${activeTheme.isDark ? 'bg-black/60' : 'bg-white/90'} backdrop-blur-3xl border ${activeTheme.border} shadow-2xl`}>

                            <div className="flex items-center justify-between px-2">
                                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                                    {["Explain", "Study", "HW"].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => {
                                                if (m === "Study") {
                                                    setShowExamPrepModal(true);
                                                } else {
                                                    setMode(m);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase transition-all ${((m === "Study" && mode === "Quiz") || mode === m) ? 'bg-white text-black' : 'opacity-40 hover:opacity-100'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setShowMindmapModal(true)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase transition-all ${activeTheme.card} ${activeTheme.text} ${activeTheme.border} border hover:opacity-80`}
                                        style={{
                                            backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                            boxShadow: `0 0 10px ${activeTheme.primaryHex}20`
                                        }}
                                    >
                                        🧠 Mindmap
                                    </button>




                                </div>

                                {mode === "Quiz" && (
                                    <div
                                        className="hidden md:flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide"
                                        style={{
                                            color: activeTheme.primaryHex,
                                            backgroundColor: `${activeTheme.primaryHex}14`,
                                            border: `1px solid ${activeTheme.primaryHex}30`
                                        }}
                                    >
                                Quick Quiz
                                    </div>
                                )}


                                <div className="flex items-center gap-2">
                                    <div className="hidden md:flex gap-2">
                                        <button onClick={() => setShowSessionPicker(true)} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10"><FaLayerGroup size={12} /></button>
                                        <button onClick={() => setShowSidebar(true)} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10"><FaChartLine size={12} /></button>
                                        <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10"><FaImage size={12} /></button>
                                        <button
                                            onClick={() => docInputRef.current?.click()}
                                            className="p-2.5 rounded-full transition-all hover:scale-105"
                                            style={{
                                                backgroundColor: `${activeTheme.primaryHex}15`,
                                                color: activeTheme.primaryHex,
                                                border: `1px solid ${activeTheme.primaryHex}40`
                                            }}
                                        >
                                            <FaFileAlt size={12} />
                                        </button>

                                        <button
                                            onClick={() => navigate('/live', { state: { subject, chapter, userData } })}
                                            className="p-2.5 rounded-full text-white border shadow-lg transition-all hover:scale-105"
                                            style={{
                                                background: `linear-gradient(135deg, ${activeTheme.primaryHex}, ${activeTheme.primaryHex}dd)`,
                                                borderColor: `${activeTheme.primaryHex}50`,
                                                boxShadow: `0 0 15px ${activeTheme.primaryHex}40`
                                            }}
                                            title="Live Mode"
                                        >
                                            <FaMicrophone size={12} />
                                        </button>

                                    </div>
                                    <div className="md:hidden relative">
                                        <button onClick={() => setShowPlusMenu(!showPlusMenu)} className={`p-2.5 rounded-full transition-all ${showPlusMenu ? 'bg-white text-black rotate-45' : 'bg-white/5'}`}><FaPlus size={12} /></button>
                                        <AnimatePresence>
                                            {showPlusMenu && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, y: -50 }} exit={{ scale: 0 }} className="absolute bottom-10 right-0 flex flex-col gap-2 z-50">
                                                    <button onClick={() => { setShowSessionPicker(true); setShowPlusMenu(false) }} className="p-3.5 rounded-full bg-black border border-white/10 text-white"><FaLayerGroup size={14} /></button>
                                                    <button onClick={() => { setShowSidebar(true); setShowPlusMenu(false) }} className="p-3.5 rounded-full bg-black border border-white/10 text-white"><FaChartLine size={14} /></button>
                                                    <button onClick={() => { fileInputRef.current?.click(); setShowPlusMenu(false) }} className="p-3.5 rounded-full bg-black border border-white/10 text-white"><FaImage size={14} /></button>
                                                    <button
                                                        onClick={() => { docInputRef.current?.click(); setShowPlusMenu(false) }}
                                                        className="p-3.5 rounded-full transition-all hover:scale-105"
                                                        style={{
                                                            backgroundColor: `${activeTheme.primaryHex}15`,
                                                            color: activeTheme.primaryHex,
                                                            border: `1px solid ${activeTheme.primaryHex}40`
                                                        }}
                                                    >
                                                        <FaFileAlt size={14} />
                                                    </button>

                                                    <button
                                                        onClick={() => { navigate('/live', { state: { subject, chapter, userData } }); setShowPlusMenu(false) }}
                                                        className="p-3.5 rounded-full text-white border transition-all hover:scale-105"
                                                        style={{
                                                            background: `linear-gradient(135deg, ${activeTheme.primaryHex}, ${activeTheme.primaryHex}dd)`,
                                                            borderColor: `${activeTheme.primaryHex}50`,
                                                            boxShadow: `0 0 15px ${activeTheme.primaryHex}40`
                                                        }}
                                                        title="Live Mode"
                                                    >
                                                        <FaMicrophone size={14} />
                                                    </button>

                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            <BorderGlow
                              backgroundColor={activeTheme.hex || "#050505"}
                              glowColor={activeTheme.isDark ? (activeTheme.primaryHex ? `${Math.floor(parseInt(activeTheme.primaryHex.slice(1), 16) / 0x10000 % 360)} 90 70` : "260 90 70") : "40 80 80"}
                              glowIntensity={activeTheme.isDark ? 1.2 : 0.6}
                              borderRadius={32}
                              glowRadius={45}
                              edgeSensitivity={25}
                              coneSpread={20}
                              animated={false}
                              colors={activeTheme.isDark ? [activeTheme.primaryHex || '#c084fc', '#38bdf8', '#f472b6'] : ['#c084fc', '#f472b6', '#38bdf8']}
                              fillOpacity={activeTheme.isDark ? 0.5 : 0.35}
                              className="!p-1"
                            >
                              <div className="relative flex items-center gap-2 bg-white/5 rounded-[2rem] border border-white/10">
                                {imagePreview && (

                                    <div className="absolute -top-16 left-4 w-12 h-12 rounded-xl border-2 border-indigo-500 overflow-hidden shadow-2xl">
                                        <img src={imagePreview} className="w-full h-full object-cover" />
                                        <button onClick={() => setImagePreview(null)} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white"><FaTimes size={10} /></button>
                                    </div>
                                )}
                                {(imagePreview || isAnalyzing) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute -top-24 left-4 flex items-center gap-3"
                                    >
                                        <div className="relative group">
                                            {isAnalyzing ? (
                                                /* --- NEURAL ANALYZING LOADER --- */
                                                <div className="w-16 h-16 rounded-2xl bg-indigo-950/50 flex flex-col items-center justify-center border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent animate-pulse" />
                                                    <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-1" />
                                                    <span className="text-[8px] font-bold text-indigo-300 animate-pulse">SYNCING</span>
                                                </div>
                                            ) : (
                                                /* --- ACTUAL FILE PREVIEW --- */
                                                <>
                                                    {fileType === 'image' ? (
                                                        <img
                                                            src={imagePreview}
                                                            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-2xl transition-transform hover:scale-105"
                                                            alt="Neural Upload"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center border-2 border-indigo-400 shadow-2xl">
                                                            <FaFilePdf className="text-white" size={24} />
                                                        </div>
                                                    )}

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => { setImagePreview(null); setAttachedFile(null); }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 hover:scale-110 transition-all z-10"
                                                    >
                                                        <FaTimes size={12} />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* --- STATUS BADGE --- */}
                                        <div className="flex flex-col gap-1">
                                            <div className="bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10 shadow-xl">
                                                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-[0.2em] flex items-center gap-2">
                                                    {isAnalyzing ? (
                                                        <>
                                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                                                            Neural Extraction Active
                                                        </>
                                                    ) : (
                                                        fileType === 'image' ? 'Neural Image Optimized' : 'Knowledge Vault PDF'
                                                    )}
                                                </span>
                                            </div>
                                            {!isAnalyzing && (
                                                <span className={`text-[8px] ${activeTheme.text}/40 ml-1 font-medium italic`}>
                                                    Ready for Core Analysis
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                <textarea
                                    ref={inputRef} // <--- Add this line
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Neural pulse command..."
                                    rows="1"
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-4 resize-none overflow-y-auto outline-none placeholder:opacity-30 shadow-none"
                                    style={{ height: '48px', minHeight: '48px', maxHeight: '48px' }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            clearChat();
                                            return;
                                        }
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                />
                                {/* CLEAR BUTTON (Input Area) */}

                                
                                <motion.button
                                    disabled={isSending || isAnalyzing}
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => sendMessage()}
                                    className="p-4 md:p-5 rounded-full shadow-lg disabled:opacity-50 overflow-hidden group flex items-center justify-center"
                                    style={{ backgroundColor: activeTheme.primaryHex }}
                                >
                                    {isAnalyzing ? "Processing..." : ""}
                                    <AnimatePresence mode="wait">
                                        {isSending ? (
                                            <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><FaSyncAlt className="animate-spin text-white" size={18} /></motion.div>
                                        ) : (
                                            <motion.div key="plane" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-white"><FaPaperPlane size={18} /></motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                              </div>
                            </BorderGlow>
                        </div>
                    </div>
                </div>
            </div>

            {/* THE VAULT (PRESERVED) */}
            {/* --- THE VAULT (SESSION HISTORY) - REMASTERED --- */}
            <AnimatePresence>
                {showSessionPicker && (
                    <>
                        {/* Glass Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSessionPicker(false)}
                            className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[1000]"
                        />

                        {/* Main Vault Panel (Right Side Slide-out) */}
                        <motion.div
                            initial={{ x: 600 }}
                            animate={{ x: 0 }}
                            exit={{ x: 600 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className={`fixed inset-y-0 right-0 w-[92%] md:w-[520px] ${activeTheme.isDark ? 'bg-[#080808]' : 'bg-white'} border-l ${activeTheme.border} z-[1001] p-8 md:p-14 flex flex-col shadow-[-50px_0_100px_rgba(0,0,0,0.5)]`}
                        >
                            {/* Vault Header */}
                            <div className="flex justify-between items-start mb-10">
                                <div className="flex flex-col">
                                    <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">The Vault</h3>
                                    <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] opacity-30 mt-2 text-indigo-500">Archived Neural Links</p>
                                </div>
                                <button
                                    onClick={() => setShowSessionPicker(false)}
                                    className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                                >
                                    <FaTimes className="group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>

                            {/* Wide Search Bar Integration */}
                            <div className="relative mb-10">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <FaSearch size={14} className="text-indigo-500 opacity-40" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="FILTER BY SUBJECT OR TITLE..."
                                    value={searchVault}
                                    onChange={(e) => setSearchVault(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all placeholder:opacity-20"
                                />
                                {/* --- HIDDEN SYSTEM INPUTS --- */}
                                <input
                                    type="file"
                                    ref={docInputRef}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.txt"
                                    onChange={handleFileUpload}
                                />
                                {/* This ensures your existing image button also works with the new function */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            {/* Sessions List with Liquid Scrollbar */}
                            <div className="flex-1 overflow-y-auto custom-scroll pr-4 space-y-4 no-scrollbar">
                                {filteredSessions.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-60 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[3rem] opacity-20"
                                    >
                                        <FaLayerGroup size={40} className="mb-4 text-indigo-500" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Archive Empty</span>
                                    </motion.div>
                                ) : (
                                    filteredSessions.map((s) => (
                                        <motion.div
                                            key={s.id}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            whileHover={{ x: -10 }}
                                            className={`group relative p-8 rounded-[2.5rem] border transition-all cursor-pointer ${currentSessionId === s.id ? 'bg-indigo-600/10 border-indigo-500/40 shadow-xl' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}
                                            onClick={() => {
                                                setCurrentSessionId(s.id);
                                                setMessages(s.messages || []);
                                                setSessionTitle(s.title || "New Lesson");
                                                setSubject(s.subject || "");
                                                setChapter(s.chapter || "");
                                                setShowSessionPicker(false);
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col gap-1 pr-12">
                                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">
                                                        {s.subject || 'GENERAL UPLINK'}
                                                    </span>
                                                    <h4 className="text-base font-black uppercase tracking-tight leading-tight truncate max-w-[280px]">
                                                        {s.title || "Untitled Fragment"}
                                                    </h4>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteDoc(doc(db, `users/${currentUser?.uid}/sessions`, s.id));
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-4 hover:bg-red-500/20 hover:text-red-500 rounded-xl transition-all absolute top-6 right-6"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/5 opacity-40">
                                                <div className="flex items-center gap-2">
                                                    <FaClock size={10} className="text-indigo-400" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                                        {new Date(s.lastUpdate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FaWaveSquare size={10} className="text-indigo-400" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                                        {s.messages?.length || 0} DATA NODES
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Vault Footer Action */}
                            <div className="mt-8 pt-8 border-t border-white/5">
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setCurrentSessionId(Date.now().toString());

                                        setMessages([]);
                                        setSessionTitle("New Lesson");
                                        setSubject("");
                                        setChapter("");
                                        setShowSessionPicker(false);
                                        setTimeout(() => inputRef.current?.focus(), 100);
                                    }}
                                    className="w-full py-6 rounded-[2rem] bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-indigo-500 shadow-[0_20px_40px_rgba(79,70,229,0.3)] transition-all"
                                >
                                    <FaPlus size={14} /> Initialize Fresh Link
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Profile Modal */}
            <AnimatePresence>
                {showProfileModal && selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowProfileModal(false)}
                        className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[1000] flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`p-8 rounded-[3rem] ${activeTheme.card} border ${activeTheme.border} shadow-2xl max-w-md w-full mx-4`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h3 className={`text-2xl font-black uppercase ${activeTheme.text}`}>{selectedUser.name || "Anonymous"}</h3>
                                <button onClick={() => setShowProfileModal(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10">
                                    <FaTimes className={activeTheme.text} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center font-black text-xl overflow-hidden">
                                        {selectedUser.pfp ? (
                                            <img src={selectedUser.pfp} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            (selectedUser.name || selectedUser.email || "A")[0].toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${activeTheme.text}`}>Level {Math.floor(selectedUser.xp / 1000) + 1}</p>
                                        <p className={`text-xs opacity-60 ${activeTheme.text}`}>Rank {selectedUser.rank}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <span className="text-2xl font-black text-indigo-400">{selectedUser.xp}</span>
                                        <p className={`text-xs opacity-60 ${activeTheme.text}`}>XP</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-2xl font-black text-emerald-400">{selectedUser.streak || 0}</span>
                                        <p className={`text-xs opacity-60 ${activeTheme.text}`}>Streak</p>
                                    </div>
                                </div>
                                {selectedUser.board && <p className={`text-sm ${activeTheme.text}`}>Board: {selectedUser.board}</p>}
                                {selectedUser.class && <p className={`text-sm ${activeTheme.text}`}>Class: {selectedUser.class}</p>}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Onboarding Modal */}
            <AnimatePresence>
                {showOnboardingModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowOnboardingModal(false)}
                        className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[999] flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/[0.03] border border-white/10 shadow-2xl rounded-[3rem] p-8 max-w-md w-full mx-4"
                            style={{ boxShadow: '0 0 50px rgba(79, 70, 229, 0.3)' }}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h3 className={`text-3xl font-black uppercase tracking-tighter ${activeTheme.text}`}>Profile Completion</h3>
                                <button onClick={() => setShowOnboardingModal(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10">
                                    <FaTimes className={`${activeTheme.text}`} />
                                </button>
                            </div>
                            <div className="space-y-6">
                                <p className="text-sm font-medium text-indigo-400 leading-relaxed">
                                    Setting up your profile ensures better tutoring tailored to your specific Class and Board. Let's get you personalized learning experiences!
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { navigate('/profile'); setShowOnboardingModal(false); }}
                                    className="w-full py-4 bg-indigo-600 text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg hover:bg-indigo-500 transition-all"
                                    style={{ boxShadow: '0 0 30px rgba(79, 70, 229, 0.5)' }}
                                >
                                    Go to Profile
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <input
                type="file"
                ref={docInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
            />

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
            />

            {/* Mindmap Modal */}
            <MindmapModal
                isOpen={showMindmapModal}
                onClose={() => setShowMindmapModal(false)}
                chapterText={`Chapter: ${chapter}\nSubject: ${subject}\nBoard: ${userData?.board || 'CBSE'}\nClass: ${userData?.classLevel || userData?.class || '10'}`}
                userData={userData}
                theme={activeTheme}
                chapter={chapter}
                subject={subject}
            />

            {/* Exam Prep Modal */}
<ExamPrepModal
                isOpen={showExamPrepModal}
                onClose={() => setShowExamPrepModal(false)}
                onSelect={(pyqMode) => {
                  // Handle AI PYQ generation - Navigate to PYQ page  
                  setShowExamPrepModal(false);
                  toast.success('🚀 PYQ Practice Started!');
                }}
                theme={activeTheme}
                board={userData?.board}
                classLevel={userData?.classLevel || userData?.class}
                subject={subject}
                chapter={chapter}
              />

        </div >
    );
}
