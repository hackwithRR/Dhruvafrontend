import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaTimes, FaBook, FaClipboardList, FaBolt, FaGraduationCap, FaClock,
    FaCheckCircle, FaFileAlt, FaBrain, FaExclamationTriangle, FaCheckSquare,
    FaStar, FaHistory, FaArrowRight, FaArrowLeft, FaList,
    FaChartLine, FaQuestion, FaLightbulb, FaRocket
} from "react-icons/fa";

const StudyModal = ({ isOpen, onClose, onSelect, theme = {}, board, classLevel }) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    if (!isOpen) return null;

    const primaryColor = theme.primaryHex || "#4f46e5";
    const isDark = theme.isDark !== false;
    const themeText = isDark ? "#ffffff" : "#000000";
    const themeTextSecondary = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
    const themeTextMuted = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
    const themeBgCard = isDark ? "rgba(10, 10, 15, 0.95)" : "rgba(255, 255, 255, 0.95)";
    const themeBorder = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";
    const themeBgOverlay = isDark ? "rgba(0, 0, 0, 0.92)" : "rgba(255, 255, 255, 0.92)";

    const userBoard = board || "CBSE";
    const userClass = classLevel || "10";

    const getExamPrepOptions = () => {
        const baseOptions = [];
        const userClassNum = parseInt(userClass);
        const hasBoardExam = userClassNum >= 10;

        if (!hasBoardExam) {
            baseOptions.push({
                id: "important",
                title: "Important Questions",
                subtitle: "High Priority Questions",
                icon: <FaStar />,
                shortDesc: "Key questions from your curriculum",
                description: "Master the most important questions from your curriculum with detailed explanations and step-by-step solutions.",
                features: ["Chapter-wise important questions", "NCERT-based questions", "Step-by-step solutions", "Practice tests with answers", "Commonly asked questions", "Concept-based questions"],
                benefits: ["Score better in exams", "Understand key concepts", "Quick revision"],
                duration: "15-30 mins per session",
                questions: "10-25 questions per chapter",
                difficulty: "Beginner to Intermediate",
                color: "from-amber-500 to-orange-600",
                accentColor: "#f59e0b"
            });

            baseOptions.push({
                id: "quiz",
                title: "Quick Quiz",
                subtitle: "Fast-Paced Challenge",
                icon: <FaBolt />,
                shortDesc: "Quick recall and revision",
                description: "Fast-paced quiz mode for quick recall and revision of topics. Perfect for daily practice.",
                features: ["Timed questions (30-60 sec each)", "Instant feedback on answers", "Score tracking and analytics", "Daily challenges", "Streak rewards", "Mixed topic quizzes"],
                benefits: ["Improve retention", "Quick daily practice", "Build confidence"],
                duration: "5-10 mins per quiz",
                questions: "10 questions per quiz",
                difficulty: "All levels",
                color: "from-pink-500 to-rose-600",
                accentColor: "#ec4899"
            });

            baseOptions.push({
                id: "ncert",
                title: "NCERT Questions",
                subtitle: "Textbook Exercises",
                icon: <FaBook />,
                shortDesc: "Questions from NCERT textbook",
                description: "Complete coverage of all NCERT textbook questions with detailed solutions and explanations.",
                features: ["All exercise questions", "In-text questions", "Chapter-end exercises", "Examples practice", "Detailed solutions", "NCERT exemplar problems"],
                benefits: ["Complete syllabus coverage", "Strong foundation", "Exam-ready"],
                duration: "20-45 mins per chapter",
                questions: "All questions from NCERT",
                difficulty: "As per textbook",
                color: "from-red-500 to-orange-600",
                accentColor: "#ef4444"
            });

            baseOptions.push({
                id: "objective",
                title: "Objective Practice",
                subtitle: "Multiple Choice",
                icon: <FaCheckSquare />,
                shortDesc: "Practice objective questions",
                description: "Master objective questions with various formats including MCQs, true/false, and fill-in-the-blanks.",
                features: ["Multiple choice questions", "True/False questions", "Fill in blanks", "Match the following", "Assertion-Reason questions", "Detailed explanations"],
                benefits: ["Competitive exam prep", "Quick answering skills", "Multiple formats"],
                duration: "10-20 mins per session",
                questions: "15-30 questions",
                difficulty: "Beginner to Advanced",
                color: "from-lime-500 to-green-600",
                accentColor: "#84cc16"
            });

            if (userClassNum === 9) {
                baseOptions.push({
                    id: "olympiad",
                    title: "Olympiad Prep",
                    subtitle: "Competitive Exams",
                    icon: <FaExclamationTriangle />,
                    shortDesc: "Prepare for NTSE & Olympiads",
                    description: "Advanced preparation for NTSE, Olympiads and other competitive examinations.",
                    features: ["HOTS (Higher Order Thinking Skills)", "Logical reasoning questions", "NTSE pattern questions", "Previous year Olympiad papers", "Mental ability questions", "Science/Math Olympiad focus"],
                    benefits: ["Competitive edge", "Scholarship opportunities", "Advanced concepts"],
                    duration: "30-60 mins per session",
                    questions: "25-50 questions",
                    difficulty: "Advanced",
                    color: "from-purple-500 to-indigo-600",
                    accentColor: "#8b5cf6"
                });
            }

            return baseOptions;
        }

        baseOptions.push({
            id: "pyqs",
            title: "PYQs",
            subtitle: "Previous Year Questions",
            icon: <FaHistory />,
            shortDesc: "Past " + userBoard + " board questions",
            description: "Master questions from past " + userBoard + " board exams. Understand question patterns, marking schemes, and important topics.",
            features: ["Last 10 years questions", "Chapter-wise PYQs", "Year-wise analysis", "Marking scheme practice", "Frequently asked questions", "Important topics identification", "Trend analysis"],
            benefits: ["Know exam pattern", "Score high", "Time management", "Important topics"],
            duration: "45-60 mins per session",
            questions: "15-30 questions per chapter",
            difficulty: "Board level",
            color: "from-violet-500 to-purple-600",
            accentColor: "#8b5cf6"
        });

        baseOptions.push({
            id: "sample",
            title: "Sample Papers",
            subtitle: "Official Sample Papers",
            icon: <FaFileAlt />,
            shortDesc: "Practice with sample papers",
            description: "Complete sample papers with official marking schemes. Simulate real exam conditions.",
            features: ["Official " + userBoard + " sample papers", "Latest marking schemes", "Complete answer keys", "Detailed solutions", "Time management tips", "Performance analysis", "Score prediction"],
            benefits: ["Exam simulation", "Time management", "Know weaknesses", "Score prediction"],
            duration: "2-3 hours per paper",
            questions: "Full question paper",
            difficulty: "Board level",
            color: "from-blue-500 to-indigo-600",
            accentColor: "#3b82f6"
        });

        baseOptions.push({
            id: "important",
            title: "Important Questions",
            subtitle: "High Priority Questions",
            icon: <FaStar />,
            shortDesc: "Most likely exam questions",
            description: "Focus on the most likely questions for your " + userBoard + " board exam based on analysis.",
            features: ["High-weightage topics", "Frequently asked questions", "Important derivations", "Formula memorization", "Key concepts revision", "Expected questions", "Quick revision notes"],
            benefits: ["Focus on important topics", "Maximize score", "Efficient revision"],
            duration: "30-45 mins per session",
            questions: "20-40 questions",
            difficulty: "Board level",
            color: "from-amber-500 to-orange-600",
            accentColor: "#f59e0b"
        });

        baseOptions.push({
            id: "exam",
            title: "Exam Practice",
            subtitle: "Full Exam Simulation",
            icon: <FaGraduationCap />,
            shortDesc: "Full-length mock tests",
            description: "Complete exam simulation with " + userBoard + "-style questions. Practice under real exam conditions.",
            features: ["Full-length mock tests", "Real exam environment", "Time-bound practice", "Detailed performance analysis", "Answer sheet evaluation", "Improvement suggestions", "Chapter-wise tests"],
            benefits: ["Exam readiness", "Build stamina", "Reduce exam anxiety", "Know performance"],
            duration: "3 hours per test",
            questions: "Full question paper",
            difficulty: "Board level",
            color: "from-emerald-500 to-teal-600",
            accentColor: "#10b981"
        });

        if (userBoard === "CBSE" && ["10", "11", "12"].includes(String(userClass))) {
            baseOptions.push({
                id: "case",
                title: "Case Studies",
                subtitle: "Assertion Reasoning",
                icon: <FaBrain />,
                shortDesc: "Case-based questions",
                description: "Special focus on case-based and assertion-reasoning questions introduced in CBSE exams.",
                features: ["Case study questions", "Assertion-Reason questions", "Source-based questions", "Data interpretation", "Analysis skills practice", "Real-life scenarios", "Application-based questions"],
                benefits: ["Handle new format", "Higher-order thinking", "Score in Case Studies"],
                duration: "20-30 mins per session",
                questions: "10-20 case-based questions",
                difficulty: "Advanced",
                color: "from-cyan-500 to-teal-600",
                accentColor: "#06b6d4"
            });
        }

        baseOptions.push({
            id: "quiz",
            title: "Quick Quiz",
            subtitle: "Fast-Paced Challenge",
            icon: <FaBolt />,
            shortDesc: "Quick recall and revision",
            description: "Fast-paced quiz mode for quick recall and revision. Perfect for daily practice and concept check.",
            features: ["Rapid-fire questions", "Instant results", "Topic-wise quizzes", "Progress tracking", "Daily challenges", "Mixed mode quizzes", "Spaced repetition"],
            benefits: ["Quick revision", "Daily practice", "Concept retention", "Fun learning"],
            duration: "5-15 mins per quiz",
            questions: "10 questions per quiz",
            difficulty: "All levels",
            color: "from-pink-500 to-rose-600",
            accentColor: "#ec4899"
        });

        if (userBoard === "CBSE") {
            baseOptions.push({
                id: "ncert",
                title: "NCERT Exemplar",
                subtitle: "Advanced NCERT Questions",
                icon: <FaBook />,
                shortDesc: "NCERT Exemplar problems",
                description: "Advanced level questions from NCERT Exemplar. Essential for JEE/NEET preparation and conceptual depth.",
                features: ["Exemplar problems", "Higher Order Thinking Skills (HOTS)", "Multiple correct answers", "Integer-type questions", "Advanced concepts", "JEE/NEET relevance", "Detailed explanations"],
                benefits: ["Advanced preparation", "Competitive exams", "Strong concepts"],
                duration: "45-60 mins per session",
                questions: "15-30 questions",
                difficulty: "Advanced",
                color: "from-red-500 to-orange-600",
                accentColor: "#ef4444"
            });
        }

        baseOptions.push({
            id: "objective",
            title: "Objective Practice",
            subtitle: "Multiple Choice",
            icon: <FaCheckSquare />,
            shortDesc: "Practice MCQs",
            description: "Master objective questions with formats commonly used in board exams and competitive examinations.",
            features: ["Single correct MCQs", "Multiple correct MCQs", "Assertion-Reason questions", "Matrix matching", "Integer-type questions", "Case-based objective", "Quick solving tips"],
            benefits: ["Competitive prep", "Speed improvement", "Multiple formats"],
            duration: "15-30 mins per session",
            questions: "20-40 questions",
            difficulty: "Intermediate to Advanced",
            color: "from-lime-500 to-green-600",
            accentColor: "#84cc16"
        });

        if (["9", "10", "11", "12"].includes(String(userClass))) {
            baseOptions.push({
                id: "olympiad",
                title: "Olympiad Prep",
                subtitle: "Competitive Exams",
                icon: <FaExclamationTriangle />,
                shortDesc: "NTSE & Olympiad preparation",
                description: "Comprehensive preparation for NTSE, Olympiads and other scholarship examinations.",
                features: ["NTSE Stage 1 & 2 questions", "Mental Ability (MAT)", "Science Olympiad (SOF)", "Math Olympiad preparation", "Logical reasoning", "Analytical skills", "Previous year papers"],
                benefits: ["Scholarship opportunities", "Competitive edge", "Advanced knowledge"],
                duration: "45-90 mins per session",
                questions: "30-50 questions",
                difficulty: "Advanced",
                color: "from-purple-500 to-indigo-600",
                accentColor: "#8b5cf6"
            });
        }

        return baseOptions;
    };

    const examPrepOptions = getExamPrepOptions();

    const handleOptionClick = (option) => {
        setSelectedOption(option);
        setShowDetails(true);
    };

    const handleBack = () => {
        setShowDetails(false);
        setSelectedOption(null);
    };

    const handleSelect = (optionId) => {
        onSelect(optionId);
        onClose();
        setSelectedOption(null);
        setShowDetails(false);
    };

    const detailStats = [
        { key: "duration", icon: FaClock, label: "Duration", value: selectedOption?.duration },
        { key: "questions", icon: FaQuestion, label: "Questions", value: selectedOption?.questions },
        { key: "difficulty", icon: FaChartLine, label: "Difficulty", value: selectedOption?.difficulty }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
                style={{
                    background: themeBgOverlay,
                    backdropFilter: 'blur(30px)'
                }}
                onClick={onClose}
            >
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1], x: [0, 30, 0] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute -top-1/3 -left-1/3 w-[80%] h-[80%] rounded-full"
                        style={{ background: "radial-gradient(circle, " + primaryColor + "30 0%, transparent 70%)", filter: 'blur(60px)' }}
                    />
                    <motion.div
                        animate={{ scale: [1.2, 1, 1.2], opacity: [0.08, 0.15, 0.08], x: [0, -20, 0] }}
                        transition={{ duration: 12, repeat: Infinity, delay: 2 }}
                        className="absolute -bottom-1/3 -right-1/3 w-[70%] h-[70%] rounded-full"
                        style={{ background: "radial-gradient(circle, " + primaryColor + "25 0%, transparent 70%)", filter: 'blur(50px)' }}
                    />
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 250 }}
                    className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden"
                    style={{
                        background: themeBgCard,
                        backdropFilter: 'blur(40px)',
                        border: "1px solid " + themeBorder,
                        boxShadow: "0 0 80px " + primaryColor + "15, 0 40px 80px -20px rgba(0,0,0,0.4)"
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-5 sticky top-0 z-20" style={{ background: isDark ? "rgba(10,10,15,0.95)" : "rgba(255,255,255,0.95)", borderBottom: "1px solid " + themeBorder, backdropFilter: 'blur(20px)' }}>
                        <div className="flex items-center gap-4">
                            {showDetails && (
                                <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={handleBack} className="p-2.5 rounded-xl transition-all hover:scale-105" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>
                                    <FaArrowLeft style={{ color: themeText }} size={14} />
                                </motion.button>
                            )}
                            <motion.div whileHover={{ scale: 1.05, rotate: 3 }} className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, " + primaryColor + ", " + primaryColor + "dd)", boxShadow: "0 0 25px " + primaryColor + "40" }}>
                                {showDetails ? selectedOption?.icon : <FaClipboardList className="text-white" size={20} />}
                            </motion.div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-wide" style={{ color: themeText }}>{showDetails ? selectedOption?.title : "Study"}</h2>
                                <p className="text-xs" style={{ color: themeTextSecondary }}>{showDetails ? selectedOption?.subtitle : "Choose your practice type"}</p>
                            </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2.5 rounded-xl transition-all" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>
                            <FaTimes style={{ color: themeText }} size={14} />
                        </motion.button>
                    </div>

                    <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {!showDetails ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {examPrepOptions.map((option, index) => (
                                    <motion.button key={option.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => handleOptionClick(option)} className="p-4 rounded-2xl border transition-all relative overflow-hidden text-left group" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)', border: "1px solid " + themeBorder }}>
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, " + option.accentColor + "10 0%, transparent 100%)" }} />
                                        <div className="relative flex items-start gap-3">
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, " + option.color.split(' ')[1] + ", " + option.color.split(' ')[3] + ")", boxShadow: "0 4px 15px " + option.accentColor + "30" }}>
                                                <span className="text-white text-sm">{option.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: themeText }}>{option.title}</h3>
                                                <p className="text-xs mt-0.5" style={{ color: themeTextSecondary }}>{option.shortDesc}</p>
                                            </div>
                                            <FaArrowRight className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" style={{ color: themeTextMuted }} size={12} />
                                        </div>
                                    </motion.button>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                                <div className="p-4 rounded-2xl border" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', border: "1px solid " + themeBorder }}>
                                    <p className="text-sm" style={{ color: themeTextSecondary }}>{selectedOption?.description}</p>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {detailStats.map((stat) => {
                                        const StatIcon = stat.icon;

                                        return (
                                            <div
                                                key={stat.key}
                                                className="p-3 rounded-xl border text-center"
                                                style={{
                                                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                                                    border: "1px solid " + themeBorder
                                                }}
                                            >
                                                <StatIcon className="mx-auto mb-1.5" style={{ color: primaryColor }} size={14} />
                                                <p className="text-[10px] font-bold uppercase" style={{ color: themeTextMuted }}>
                                                    {stat.label}
                                                </p>
                                                <p className="text-xs font-bold" style={{ color: themeText }}>
                                                    {stat.value}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: themeTextMuted }}><FaList size={12} /> What's Included</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {selectedOption?.features.map((feature, idx) => (
                                            <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                                                <FaCheckCircle size={12} style={{ color: selectedOption.accentColor }} />
                                                <span className="text-xs" style={{ color: themeTextSecondary }}>{feature}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: themeTextMuted }}><FaLightbulb size={12} /> Key Benefits</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedOption?.benefits.map((benefit, idx) => (
                                            <span key={idx} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: selectedOption.accentColor + "15", color: selectedOption.accentColor, border: "1px solid " + selectedOption.accentColor + "30" }}>
                                                {benefit}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSelect(selectedOption?.id)} className="w-full py-4 rounded-2xl font-bold uppercase tracking-wider flex items-center justify-center gap-3" style={{ background: "linear-gradient(135deg, " + primaryColor + ", " + primaryColor + "dd)", boxShadow: "0 8px 30px " + primaryColor + "40" }}>
                                    <FaRocket size={16} className="text-white" />
                                    <span className="text-white">Start {selectedOption?.title}</span>
                                </motion.button>
                            </motion.div>
                        )}
                    </div>

                    {!showDetails && (
                        <div className="px-5 py-4 border-t" style={{ borderColor: themeBorder }}>
                            <div className="flex items-center justify-center gap-2 text-xs" style={{ color: themeTextMuted }}>
                                <FaClock size={10} />
                                <span className="font-medium">Select a mode to begin - {userBoard} Class {userClass}</span>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default StudyModal;
