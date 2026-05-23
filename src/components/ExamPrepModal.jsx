import React, { useState } from "react";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import {
    FaTimes, FaStar, FaHistory, FaBook, FaBolt, FaGraduationCap, FaBrain, FaCheckSquare, FaFileAlt
} from "react-icons/fa";
import AIPyqGenerator from './pyq/AIPyqGenerator';

const ExamPrepModal = ({ isOpen, onClose, onSelect, theme = {}, board, classLevel, subject = '', chapter = '' }) => {
    const navigate = useNavigate();
    const { userData } = useAuth();
    
    // Context from profile + chat
    const currentClass = classLevel || userData?.classLevel || '10';
    const currentBoard = board || userData?.board || 'CBSE';
    const currentSubject = subject || '';
    const currentChapter = chapter || '';

    // States
    const [selectedOption, setSelectedOption] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showPyqPreview, setShowPyqPreview] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [showAIPyqModal, setShowAIPyqModal] = useState(false);
    const [pdfError, setPdfError] = useState('');

    if (!isOpen) return null;

    const primaryColor = theme.primaryHex || "#4f46e5";
    const isDark = theme.isDark !== false;
    const themeText = isDark ? "#ffffff" : "#000000";
    const themeTextSecondary = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
    const themeTextMuted = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
    const themeBgCard = isDark ? "rgba(10, 10, 15, 0.95)" : "rgba(255, 255, 255, 0.95)";
    const themeBorder = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";

    const getExamPrepOptions = () => {
        const baseOptions = [];
        const userClassNum = parseInt(currentClass);
        const hasBoardExam = userClassNum >= 10;

        baseOptions.push({
            id: "pyqs-" + currentClass + currentBoard,
            title: "PYQs",
            subtitle: "Previous Year Questions",
            icon: <FaHistory />,
            shortDesc: "Board-level practice",
            description: "AI-generated previous year questions",
            color: "from-violet-500 to-purple-600",
            accentColor: "#8b5cf6"
        });

        if (hasBoardExam) {
            baseOptions.push({
                id: "exam-" + currentClass + currentBoard,
                title: "Exam Practice",
                subtitle: "Full Exam Simulation",
                icon: <FaBolt />,
                shortDesc: "Mock tests", 
                description: "Complete exam simulation",
                color: "from-emerald-500 to-teal-600",
                accentColor: "#10b981"
            });
        }

        return baseOptions;
    };

    const examPrepOptions = getExamPrepOptions();

    const handleOptionClick = async (option) => {
        if (option.id.startsWith('pyqs')) {
            setShowPyqPreview(true);
            return;
        }
        setSelectedOption(option);
        setShowDetails(true);
    };

    const handleBack = () => {
        if (showPyqPreview) {
            setShowPyqPreview(false);
            return;
        }
        setShowDetails(false);
        setSelectedOption(null);
    };

    const handleSelect = (optionId) => {
        onSelect(optionId);
        onClose();
    };

    const handleAskAI = (question) => {
        // Close the modal
        onClose();
        
        // Navigate to chat with the question context
        navigate('/chat', { 
            state: { 
                askQuestion: question.question,
                questionData: question,
                subject: currentSubject,
                chapter: currentChapter,
                board: currentBoard,
                classLevel: currentClass,
                mode: 'Explain'
            }
        });
    };

    const handlePdfPyq = async () => {
        try {
            setPdfLoading(true);
            const safeChapter = currentChapter.replace(/[^a-z0-9]/gi, '_');
            const path = `pyqs/${currentBoard}/${currentClass}/${currentSubject}/${safeChapter}.pdf`;
            const storageRef = ref(storage, path);
            const url = await getDownloadURL(storageRef);
            setPdfUrl(url);
        } catch (error) {
            setPdfError('PDF not available - Upload via Admin Panel');
        } finally {
            setPdfLoading(false);
        }
    };

    const renderContent = () => {
        if (showPyqPreview) {
            return (
                <div className="space-y-6 text-center p-6">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={handleBack} className="p-3 rounded-xl hover:bg-white/5" style={{ color: themeTextSecondary }}>
                            ← Back
                        </button>
                        <h2 style={{ color: themeText }} className="text-2xl font-black">PYQ Ready! 🎯</h2>
                    </div>
                    
                    <div className="p-6 rounded-2xl mb-8" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', border: `1px solid ${themeBorder}` }}>
                        <h4 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: themeTextMuted }}>Neural Context Locked</h4>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <span className="text-xs block mb-1" style={{ color: themeTextMuted }}>Class</span>
                                <span className="font-black text-lg" style={{ color: themeText }}>{currentClass}</span>
                            </div>
                            <div>
                                <span className="text-xs block mb-1" style={{ color: themeTextMuted }}>Board</span>
                                <span className="font-black text-lg" style={{ color: themeText }}>{currentBoard}</span>
                            </div>
                            <div>
                                <span className="text-xs block mb-1" style={{ color: themeTextMuted }}>Subject</span>
                                <span className="font-black text-lg" style={{ color: themeText }}>{currentSubject || 'Select Subject'}</span>
                            </div>
                            <div>
                                <span className="text-xs block mb-1" style={{ color: themeTextMuted }}>Chapter</span>
                                <span className="font-black text-lg" style={{ color: themeText }}>{currentChapter || 'Select Chapter'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.button 
                            key="ai-pyq"
                            onClick={() => setShowAIPyqModal(true)}
                            whileHover={{ scale: 1.05 }}
                            className="group relative p-8 rounded-3xl font-black text-xl shadow-2xl overflow-hidden"
                            style={{ 
                                backgroundColor: primaryColor + '20',
                                color: primaryColor,
                                border: `2px solid ${primaryColor}`
                            }}
                        >
                            <div className="text-4xl mb-4 group-hover:rotate-12 transition-transform">🤖</div>
                            AI PYQs
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity rounded-3xl" />
                        </motion.button>

                        <motion.button 
                            key="pdf-pyq"
                            onClick={handlePdfPyq}
                            whileHover={{ scale: 1.05 }}
                            disabled={pdfLoading}
                            className="group relative p-8 rounded-3xl font-black text-xl shadow-2xl overflow-hidden"
                            style={{ 
                                backgroundColor: '#8b5cf620', 
                                color: '#8b5cf6', 
                                border: '2px solid #8b5cf6' 
                            }}
                        >
                            <div className="text-4xl mb-4">{pdfLoading ? '⏳' : '📚'}</div>
                            {pdfLoading ? 'Loading...' : 'Classic PDFs'}
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity rounded-3xl" />
                        </motion.button>
                    </div>
                </div>
            );
        }

        if (showDetails && selectedOption) {
            return (
                <div className="space-y-6 p-6">
                    <div className="flex items-center justify-between">
                        <button onClick={handleBack} className="p-3 rounded-xl hover:bg-white/5" style={{ color: themeTextSecondary }}>
                            ← Back
                        </button>
                        <h2 style={{ color: themeText }} className="text-2xl font-black text-center flex-1">Ready</h2>
                    </div>
                    <div className="text-center">
                        <p style={{ color: themeTextSecondary }} className="text-lg leading-relaxed mb-8">
                            {selectedOption.description}
                        </p>
                        <motion.button 
                            key="start-exam"
                            onClick={() => handleSelect(selectedOption.id)}
                            whileHover={{ scale: 1.05 }}
                            className="w-full p-5 rounded-3xl font-black text-xl shadow-2xl"
                            style={{ backgroundColor: primaryColor, color: 'white' }}
                        >
                            Start {selectedOption.title} →
                        </motion.button>
                    </div>
                </div>
            );
        }

        return (
            <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-black" style={{ color: themeText }}>Exam Prep</h2>
                    <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/5 transition-all" style={{ color: themeText }}>
                        <FaTimes size={20} />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {examPrepOptions.map((option, index) => {
                        const uniqueKey = `${option.id}-${index}-${currentClass}`;
                        return (
                            <motion.button 
                                key={uniqueKey}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05, y: -10 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleOptionClick(option)} 
                                className="group relative p-8 rounded-3xl overflow-hidden shadow-2xl"
                                style={{ 
                                    borderColor: themeBorder, 
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
                                    borderWidth: '1px'
                                }}
                            >
                                <div style={{ color: option.accentColor }} className="text-4xl mb-6 group-hover:scale-110 transition-transform">
                                    {option.icon}
                                </div>
                                <h3 className="text-2xl font-black mb-3 group-hover:translate-x-2 transition-transform" style={{ color: themeText }}>{option.title}</h3>
                                <p className="opacity-80 mb-6" style={{ color: themeTextSecondary }}>{option.subtitle}</p>
                                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity" 
                                    style={{ backgroundColor: option.accentColor }} />
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl" 
                onClick={onClose}
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative" 
                    style={{ backgroundColor: themeBgCard, border: `1px solid ${themeBorder}` }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {renderContent()}
                </motion.div>
            </motion.div>
            <AIPyqGenerator 
                isOpen={showAIPyqModal}
                onClose={() => setShowAIPyqModal(false)}
                filters={{ class: currentClass, board: currentBoard, subject: currentSubject, chapter: currentChapter }}
                theme={theme}
                onAskAI={handleAskAI}
            />
            <AnimatePresence>
                {pdfError && (
                    <motion.div 
                        key="pdf-error"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="fixed inset-0 z-[1010] flex items-center justify-center p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div 
                            className="bg-gradient-to-br from-red-500/10 to-rose-500/10 backdrop-blur-xl p-8 rounded-3xl border border-red-400/30 max-w-md shadow-2xl"
                            style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                        >
                            <div className="text-4xl mb-6 text-red-400">📄</div>
                            <h3 className="font-black text-xl mb-4 text-white">PDF Not Ready</h3>
                            <p className="text-white/90 mb-8 text-sm leading-relaxed text-center">
                                Board PDFs will be available soon via Admin upload.
                            </p>
                            <button 
                                onClick={() => setPdfError('')}
                                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl text-lg shadow-lg transition-all"
                            >
                                Got It
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
};

export default ExamPrepModal;
