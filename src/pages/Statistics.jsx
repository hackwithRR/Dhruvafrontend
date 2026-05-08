import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaArrowLeft, FaChartLine, FaBook, FaTrophy, FaFire,
    FaClock, FaCheck, FaPlus, FaKey, FaShare, FaUserTie,
    FaBrain, FaMedal, FaStar, FaCopy, FaCheckCircle
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import ProgressCard from "../components/ProgressCard";
import ParentView from "../components/ParentView";

// Theme configurations matching the app
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

// Syllabus data (same as Chat.jsx)
const syllabusData = {
    CBSE: {
        "8": {
            "MATHEMATICS": ["Rational Numbers", "Linear Equations in One Variable", "Understanding Quadrilaterals", "Practical Geometry", "Data Handling", "Squares and Square Roots", "Cubes and Cube Roots", "Comparing Quantities", "Algebraic Expressions and Identities", "Visualising Solid Shapes", "Mensuration", "Exponents and Powers", "Direct and Inverse Proportions", "Factorisation", "Introduction to Graphs", "Playing with Numbers"],
            "SCIENCE": ["Crop Production and Management", "Microorganisms: Friend and Foe", "Synthetic Fibres and Plastics", "Materials: Metals and Non-Metals", "Coal and Petroleum", "Combustion and Flame", "Conservation of Plants and Animals", "Cell – Structure and Functions", "Reproduction in Animals", "Reaching the Age of Adolescence", "Force and Pressure", "Friction", "Sound", "Chemical Effects of Electric Current", "Some Natural Phenomena", "Light", "Stars and the Solar System", "Pollution of Air and Water"],
            "HISTORY": ["How, When and Where", "From Trade to Territory", "Ruling the Countryside", "Tribals, Dikus and the Vision of a Golden Age", "When People Rebel", "Colonialism and the City", "Weavers, Iron Smelters and Factory Owners", "Civilising the Native, Educating the Nation"],
            "GEOGRAPHY": ["Resources", "Land, Soil, Water, Natural Vegetation and Wildlife", "Mineral and Power Resources", "Agriculture", "Industries", "Human Resources"],
            "CIVICS": ["The Indian Constitution", "Understanding Secularism", "Why Do We Need a Parliament", "Understanding Laws", "Judiciary", "Understanding Our Criminal Justice System", "Understanding Marginalisation", "Confronting Marginalisation"],
            "ENGLISH": ["The Best Christmas Present in the World", "The Tsunami", "Glimpses of the Past", "Bepin Choudhury's Lapse of Memory", "The Summit Within", "This Is Jody's Fawn", "A Visit to Cambridge", "A Short Monsoon Diary"],
            "HINDI": ["ध्वनि", "लाख की चूड़ियाँ", "बस की यात्रा", "दीवानों की हस्ती", "चिट्ठियों की अनूठी दुनिया", "भगवान के डाकिए", "क्या निराश हुआ जाए", "यह सबसे कठिन समय नहीं"]
        },
        "9": {
            "MATHEMATICS": ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables", "Introduction to Euclid's Geometry", "Lines and Angles", "Triangles", "Quadrilaterals", "Areas of Parallelograms and Triangles", "Circles", "Constructions", "Heron's Formula", "Surface Areas and Volumes", "Statistics", "Probability"],
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

export default function Statistics() {
    const { currentUser, userData, loading, generateParentCode } = useAuth();
    const navigate = useNavigate();
    const [progress, setProgress] = useState({});
    const [parentCode, setParentCode] = useState("");
    const [showParentView, setShowParentView] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const [generatingCode, setGeneratingCode] = useState(false);

    // Get theme
    const activeTheme = React.useMemo(() => {
        const themeKey = userData?.theme || "DeepSpace";
        return themes[themeKey] || themes.DeepSpace;
    }, [userData?.theme]);

    // Calculate total stats
    const stats = React.useMemo(() => {
        let totalChapters = 0;
        let completedChapters = 0;
        const userClass = String(userData?.classLevel || userData?.class || "10");
        const userBoard = userData?.board || "CBSE";

        const boardSyllabus = syllabusData[userBoard]?.[userClass] || {};

        Object.keys(boardSyllabus).forEach(subject => {
            const subjectChapters = boardSyllabus[subject]?.length || 0;
            totalChapters += subjectChapters;

            const completed = progress[subject]?.completedChapters?.length || 0;
            completedChapters += completed;
        });

        const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
        const totalSubjects = Object.keys(boardSyllabus).length;
        const completedSubjects = Object.keys(progress).filter(
            subj => (progress[subj]?.completedChapters?.length || 0) > 0
        ).length;

        return {
            totalChapters,
            completedChapters,
            overallProgress,
            totalSubjects,
            completedSubjects,
            level: Math.floor((userData?.xp || 0) / 1000) + 1
        };
    }, [progress, userData]);

    // Load progress data
    useEffect(() => {
        const loadProgress = async () => {
            if (!currentUser) return;
            try {
                const userRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userProgress = userSnap.data()?.progress || {};
                    setProgress(userProgress);
                    setParentCode(userSnap.data()?.parentCode || "");
                }
            } catch (error) {
                console.error("Error loading progress:", error);
            }
        };

        loadProgress();
    }, [currentUser]);

    // Generate parent access code
    const handleGenerateCode = async () => {
        setGeneratingCode(true);
        try {
            const code = await generateParentCode();
            if (code) {
                setParentCode(code);
            }
        } catch (error) {
            console.error("Error generating code:", error);
        }
        setGeneratingCode(false);
    };

    // Copy code to clipboard
    const copyCode = () => {
        if (parentCode) {
            navigator.clipboard.writeText(parentCode);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }
    };

    // Get subjects for current class and board
    const getSubjectsForClass = () => {
        const userClass = String(userData?.classLevel || userData?.class || "10");
        const userBoard = userData?.board || "CBSE";
        return Object.keys(syllabusData[userBoard]?.[userClass] || {});
    };

    // Get total chapters for a subject
    const getTotalChapters = (subject) => {
        const userClass = String(userData?.classLevel || userData?.class || "10");
        const userBoard = userData?.board || "CBSE";
        return syllabusData[userBoard]?.[userClass]?.[subject]?.length || 0;
    };

    if (loading || !userData) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-cyan-400 text-sm font-black uppercase tracking-widest">Loading Statistics...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-500 ${activeTheme.bg}`}>
            <Navbar userData={userData} />

            {/* Parent View Modal */}
            <ParentView
                isOpen={showParentView}
                onClose={() => setShowParentView(false)}
                theme={userData?.theme || "DeepSpace"}
            />

            <main className="max-w-6xl mx-auto pt-10 sm:pt-20 px-4 pb-20 relative z-10">
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    onClick={() => navigate("/chat")}
                    className={`flex items-center gap-2 mb-8 px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-colors ${activeTheme.card} ${activeTheme.text}`}
                    style={{ borderColor: activeTheme.border.replace('border-', '') }}
                >
                    <FaArrowLeft /> Return to Chat
                </motion.button>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter" style={{ color: activeTheme.text }}>
                        Academic <span style={{ color: activeTheme.primaryHex }}>Progress</span>
                    </h1>
                    <p className={`text-sm font-bold uppercase tracking-[0.3em] mt-2 ${activeTheme.text}`} style={{ opacity: 0.6 }}>
                        Track your learning journey • Class {userData?.classLevel || userData?.class} • {userData?.board}
                    </p>
                </motion.div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { icon: FaBook, label: "Total Chapters", value: stats.totalChapters, color: activeTheme.primaryHex },
                        { icon: FaCheck, label: "Completed", value: stats.completedChapters, color: "#10b981" },
                        { icon: FaChartLine, label: "Progress", value: `${stats.overallProgress}%`, color: activeTheme.primaryHex },
                        { icon: FaTrophy, label: "Level", value: stats.level, color: "#f59e0b" }
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-6 rounded-[2rem] border ${activeTheme.card}`}
                            style={{
                                borderColor: `${stat.color}30`,
                                boxShadow: `0 0 30px ${stat.color}15`
                            }}
                        >
                            <stat.icon style={{ color: stat.color }} size={24} className="mb-3" />
                            <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Parent Access Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`mb-10 p-6 rounded-[2rem] border ${activeTheme.card}`}
                    style={{ borderColor: activeTheme.border.replace('border-', '') }}
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-500/20">
                                <FaUserTie className="text-amber-500" size={24} />
                            </div>
                            <div>
                                <h3 className={`text-lg font-black uppercase ${activeTheme.text}`}>Parent Access</h3>
                                <p className={`text-xs ${activeTheme.text} opacity-60`}>Share this code with parents to let them view your progress</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {parentCode ? (
                                <>
                                    <div
                                        className="flex items-center gap-2 px-4 py-3 rounded-xl font-black tracking-[0.3em]"
                                        style={{
                                            backgroundColor: `${activeTheme.primaryHex}20`,
                                            border: `1px solid ${activeTheme.primaryHex}40`
                                        }}
                                    >
                                        <FaKey style={{ color: activeTheme.primaryHex }} size={14} />
                                        <span className="text-lg" style={{ color: activeTheme.primaryHex }}>{parentCode}</span>
                                        <button
                                            onClick={copyCode}
                                            className="ml-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            {codeCopied ? (
                                                <FaCheckCircle className="text-green-500" size={14} />
                                            ) : (
                                                <FaCopy className={activeTheme.text} size={14} style={{ opacity: 0.6 }} />
                                            )}
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleGenerateCode}
                                        disabled={generatingCode}
                                        className="p-3 rounded-xl hover:bg-white/10 transition-colors"
                                        title="Generate New Code"
                                    >
                                        <FaPlus className={activeTheme.text} size={16} style={{ opacity: 0.6 }} />
                                    </button>
                                </>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleGenerateCode}
                                    disabled={generatingCode}
                                    className="px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2"
                                    style={{
                                        backgroundColor: activeTheme.primaryHex,
                                        color: '#fff'
                                    }}
                                >
                                    <FaPlus size={14} />
                                    Generate Code
                                </motion.button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* View as Parent Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowParentView(true)}
                    className={`mb-10 w-full py-4 rounded-[2rem] border-2 font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 ${activeTheme.card}`}
                    style={{ borderColor: `${activeTheme.primaryHex}50` }}
                >
                    <FaUserTie size={16} style={{ color: activeTheme.primaryHex }} />
                    View as Parent
                </motion.button>

                {/* Subject Progress Cards */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2 className={`text-xl font-black uppercase tracking-[0.2em] mb-6 ${activeTheme.text}`}>
                        Subject Progress
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2">
                        {getSubjectsForClass().map((subject, idx) => (
                            <ProgressCard
                                key={subject}
                                subject={subject}
                                progress={progress[subject]}
                                totalChapters={getTotalChapters(subject)}
                                theme={userData?.theme || "DeepSpace"}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Empty State */}
                {getSubjectsForClass().length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <FaChartLine className={`mx-auto mb-4 ${activeTheme.text}`} size={48} style={{ opacity: 0.3 }} />
                        <p className={`text-lg font-black uppercase ${activeTheme.text}`} style={{ opacity: 0.5 }}>
                            No subjects available for your class
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
