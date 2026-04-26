import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaEye, FaEyeSlash, FaSync, FaBrain, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import axios from "axios";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-e5h8.onrender.com").replace(/\/$/, "");

const AIPyqGenerator = ({ isOpen, onClose, filters = {}, theme = {}, onAskAI }) => {
    const { userData, currentUser } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [pyqs, setPyqs] = useState([]);
    const [showAnswers, setShowAnswers] = useState({});
    const [error, setError] = useState('');

    const board = filters.board || userData?.board || 'CBSE';
    const classLevel = filters.class || userData?.classLevel || '10';
    const subject = filters.subject || 'Mathematics';
    const chapter = filters.chapter || 'Algebra';

    // Theme-aware colors
    const isDark = theme?.isDark !== false;
    const primaryColor = theme?.primaryHex || '#6366f1';
    const bgColor = isDark ? 'bg-slate-900' : 'bg-white';
    const bgOverlay = isDark ? 'bg-black/90' : 'bg-gray-100/95';
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-white/75' : 'text-gray-600';
    const borderColor = isDark ? 'border-white/10' : 'border-gray-200';
    const cardBg = isDark ? 'bg-slate-800/50' : 'bg-white/80';
    const buttonBg = isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300';

    const generatePYQs = async () => {
        setIsGenerating(true);
        setError('');
        setPyqs([]);

        try {
            const formData = new FormData();
            formData.append("userId", "pyq-" + Date.now());
            formData.append("message", `Generate 12 ${board} board exam PYQs for Class ${classLevel} ${subject} Chapter "${chapter}". Return ONLY valid JSON array.`);
            
            const boardSpecificFormat = board.toUpperCase() === 'ICSE' 
                ? `ICSE FORMAT RULES:
- 5-mark: Definition + 2-3 point-wise explanations + rule/law + example. Total 150-200 words. Use bullet points.
- 3-mark: Exactly 3 clear points, point-wise format, 80-100 words.
- 2-mark: Exactly 2 distinct points, each 1 mark, 50-60 words, short and direct.
- 1-mark: Brief explanation, 40-50 words.
- Use [BOLD]text[/BOLD] for important terms, use * for bullet points, use // for line breaks.`
                : `CBSE FORMAT RULES:
- 2 MARKS (2 points = 2 marks):
  * Point 1: definition / fact
  * Point 2: key feature / example / rule
  * No explanation or extra detail
  * Total: 60-80 words
- 3 MARKS (3 points = 3 marks):
  * Point 1: definition / concept
  * Point 2: explanation / property
  * Point 3: application / example / principle
  * Keep each point short and independent
  * Total: 150-180 words
- 5 MARKS (Structured full answer):
  * Point 1: definition (1 mark)
  * Point 2: key explanation
  * Point 3: detailed explanation
  * Point 4: supporting point / rule
  * Point 5: example / application / diagram idea
  * Total: 800+ words, extremely detailed
- 1-mark: Brief explanation, 40-50 words
- Use [BOLD]text[/BOLD] for important terms, use * for bullet points, use // for line breaks.`;

            formData.append("systemInstruction", `You are a JSON generator. Output ONLY a valid JSON array. No text before or after.

Generate 12 ${board} board exam PYQs for Class ${classLevel} ${subject} Chapter "${chapter}".

${boardSpecificFormat}

JSON FORMAT:
[{"question":"...","marks":1,"answer":"..."}]

CRITICAL RULES:
1. The answer field MUST use // for newlines (NOT actual newlines)
2. Use [BOLD]text[/BOLD] for bold formatting (NOT **text**)
3. Use ONLY plain ASCII characters - no special unicode
4. NEVER use unescaped quotes inside answer strings
5. If a quote is needed inside an answer, use single quotes ' instead
6. Output MUST be valid JSON that can be parsed by JSON.parse()
7. NO markdown code blocks, NO explanations, ONLY the JSON array`);

            formData.append("subject", subject);
            formData.append("chapter", chapter);
            formData.append("mode", "PYQ");
            formData.append("board", board);
            formData.append("class", classLevel);

            const response = await axios.post(`${API_BASE}/chat`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const aiResponse = response.data.reply;
            console.log('Raw AI Response:', aiResponse);

            // Robust JSON extraction and sanitization
            let cleanJSON = aiResponse;
            
            // Remove markdown code blocks
            cleanJSON = cleanJSON.replace(/```json\s*/gi, '');
            cleanJSON = cleanJSON.replace(/```\s*$/gi, '');
            cleanJSON = cleanJSON.trim();
            
            // Find the JSON array
            const arrayStart = cleanJSON.indexOf('[');
            const arrayEnd = cleanJSON.lastIndexOf(']');
            
            if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
                cleanJSON = cleanJSON.substring(arrayStart, arrayEnd + 1);
            }
            
            // Fix common JSON issues - ORDER MATTERS
            cleanJSON = cleanJSON
                // Remove null bytes and control chars
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
                // Fix unescaped quotes inside strings (replace " with ' inside values)
                .replace(/"answer"\s*:\s*"([^"]*)"/g, (match, p1) => {
                    return '"answer":"' + p1.replace(/"/g, "'") + '"';
                })
                // Fix any remaining unescaped quotes in other fields
                .replace(/"question"\s*:\s*"([^"]*)"/g, (match, p1) => {
                    return '"question":"' + p1.replace(/"/g, "'") + '"';
                });

            console.log('Cleaned JSON:', cleanJSON);

            let questions = [];
            try {
                const parsed = JSON.parse(cleanJSON);
                questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.pyqs || []);
            } catch (parseError) {
                console.error('Parse error:', parseError);
                
                // Last resort: extract objects manually
                const objectMatches = cleanJSON.match(/\{[^}]*\}/g);
                if (objectMatches) {
                    questions = objectMatches
                        .map(str => {
                            try {
                                return JSON.parse(str);
                            } catch (e) {
                                return null;
                            }
                        })
                        .filter(q => q !== null);
                }
            }

            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error('Could not parse AI response into valid questions');
            }

            setPyqs(questions);
            toast.success(`✅ ${questions.length} PYQs Generated!`);
        } catch (err) {
            console.error('Full Error:', err);
            if (err.response) {
                setError(`Backend Error ${err.response.status}: ${JSON.stringify(err.response.data).slice(0, 200)}`);
            } else if (err.request) {
                setError('No response from server. Check your internet connection.');
            } else {
                setError(err.message || 'PYQ Generation Failed');
            }
            toast.error('PYQ Generation Failed');
        } finally {
            setIsGenerating(false);
        }
    };

    // Professional formatting with proper structure detection
    const formatAnswer = (text) => {
        if (!text) return 'Detailed solution loading...';
        
        // Replace // with actual newlines for display
        text = text.replace(/\/\//g, '\n');
        
        // Split into lines for processing
        const lines = text.split('\n');
        
        // Process the entire text to handle multi-line structures
        const elements = [];
        let currentList = [];
        let listKey = null;
        
        const flushList = () => {
            if (currentList.length > 0) {
                elements.push(
                    <div key={listKey} className="my-4 space-y-3">
                        {currentList}
                    </div>
                );
                currentList = [];
                listKey = null;
            }
        };
        
        lines.forEach((line, lineIndex) => {
            // Skip empty lines - flush any pending list
            if (!line.trim()) {
                flushList();
                elements.push(<div key={`space-${lineIndex}`} className="h-4" />);
                return;
            }
            
            const trimmedLine = line.trim();
            
            // Check if this is a bullet point
            const bulletMatch = trimmedLine.match(/^[\*\-\•]\s*(.+)/);
            if (bulletMatch) {
                const content = bulletMatch[1];
                const processedContent = processInlineFormatting(content);
                
                if (!listKey) listKey = `list-${lineIndex}`;
                currentList.push(
                    <div key={lineIndex} className="flex items-start gap-3 group">
                        <span className="mt-2.5 w-2 h-2 rounded-full flex-shrink-0 shadow-lg" 
                            style={{ backgroundColor: primaryColor, boxShadow: `0 0 8px ${primaryColor}60` }} />
                        <span className="leading-relaxed text-base">{processedContent}</span>
                    </div>
                );
                return;
            }
            
            // Not a bullet - flush any pending list
            flushList();
            
            // Check if line is a heading (ends with :)
            const headingMatch = trimmedLine.match(/^(Step \d+|Explanation|Given|To Find|Proof|Solution|Working|Note|Remember|Key Points|Important|Summary|Conclusion):/i);
            if (headingMatch) {
                const processedContent = processInlineFormatting(trimmedLine);
                elements.push(
                    <div key={lineIndex} className="mt-6 mb-3">
                        <h5 className="font-black text-lg tracking-wide flex items-center gap-2" style={{ color: primaryColor }}>
                            <span className="w-1 h-6 rounded-full" style={{ backgroundColor: primaryColor }} />
                            {processedContent}
                        </h5>
                    </div>
                );
                return;
            }
            
            // Check if line starts with a number (numbered list)
            const numberMatch = trimmedLine.match(/^(\d+)\.\s*(.+)/);
            if (numberMatch) {
                const num = numberMatch[1];
                const content = numberMatch[2];
                const processedContent = processInlineFormatting(content);
                
                elements.push(
                    <div key={lineIndex} className="flex items-start gap-3 my-2">
                        <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-white shadow-lg"
                            style={{ backgroundColor: primaryColor }}>
                            {num}
                        </span>
                        <span className="leading-relaxed text-base pt-0.5">{processedContent}</span>
                    </div>
                );
                return;
            }
            
            // Regular paragraph
            const processedContent = processInlineFormatting(trimmedLine);
            elements.push(
                <p key={lineIndex} className="leading-relaxed my-2 text-base">
                    {processedContent}
                </p>
            );
        });
        
        // Flush any remaining list
        flushList();
        
        return elements;
    };
    
    // Helper function to process inline formatting
    const processInlineFormatting = (text) => {
        if (!text) return null;
        
        // Split by [BOLD] and $$formula$$ patterns - more flexible regex
        const parts = text.split(/(\[BOLD\][\s\S]*?\[\/BOLD\]|\$\$[\s\S]*?\$\$)/g);
        
        return parts.map((part, i) => {
            // Handle [BOLD]text[/BOLD] - using includes for reliability
            if (part.includes('[BOLD]') && part.includes('[/BOLD]')) {
                const content = part.replace('[BOLD]', '').replace('[/BOLD]', '');
                return (
                    <strong key={i} style={{ color: primaryColor, fontWeight: 700 }} className="text-lg px-1">
                        {content}
                    </strong>
                );
            }
            // Handle $$formula$$ - LaTeX style
            if (part.startsWith('$$') && part.endsWith('$$')) {
                const formula = part.slice(2, -2);
                return (
                    <span key={i} className="inline-block px-3 py-1.5 mx-1 rounded-lg font-mono text-sm border shadow-lg"
                        style={{ 
                            backgroundColor: primaryColor + '15', 
                            color: primaryColor,
                            borderColor: primaryColor + '30',
                            boxShadow: `0 0 15px ${primaryColor}20`
                        }}>
                        {formula}
                    </span>
                );
            }
            // Regular text - auto-bold key terms and handle **markdown** bold
            const keyTerms = ['Definition:', 'Formula:', 'Therefore:', 'Hence:', 'Proof:', 'Example:', 'Solution:', 'Step', 'Note:', 'Important:', 'Key Points:', 'Remember:'];
            let processed = part;
            
            // Handle **text** markdown bold
            processed = processed.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${primaryColor};font-weight:700;">$1</strong>`);
            
            keyTerms.forEach(term => {
                const regex = new RegExp(`(${term})`, 'gi');
                processed = processed.replace(regex, `<strong style="color:${primaryColor};font-weight:700;">$1</strong>`);
            });
            return <span key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
        });
    };

    const toggleAnswer = (id) => {
        setShowAnswers(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const LoadingSkeleton = () => (
        <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/3"></div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 ${bgOverlay} backdrop-blur-2xl`}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className={`w-full max-w-4xl max-h-[90vh] ${bgColor} rounded-3xl border ${borderColor} shadow-2xl overflow-hidden`}
                onClick={e => e.stopPropagation()}
            >
                <div className={`p-8 border-b ${borderColor} flex items-center justify-between ${cardBg} backdrop-blur-sm z-10 sticky top-0`}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
                            <FaBrain className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black" style={{ color: primaryColor }}>
                                REAL PYQ Generator
                            </h2>
                            <p className={`text-sm ${textMuted}`}>Class {classLevel} {board} | {subject} - {chapter}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={generatePYQs}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-6 py-3 text-white font-black rounded-2xl shadow-xl transition-all hover:opacity-90 disabled:opacity-70"
                            style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)` }}
                        >
                            {isGenerating ? <FaSync className="animate-spin" /> : <FaBrain />}
                            {isGenerating ? 'Generating...' : 'Generate PYQs'}
                        </button>
                        <button onClick={onClose} className={`p-3 ${buttonBg} rounded-2xl ${textColor} transition-all`}>
                            <FaTimes size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-8 max-h-[75vh] overflow-y-auto space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-500/10 border border-red-400/30 rounded-2xl p-8 text-center"
                        >
                            <FaExclamationTriangle className="text-red-400 mx-auto mb-4 text-4xl" />
                            <h3 className="text-xl font-black text-red-300 mb-2">Generation Failed</h3>
                            <p className="text-red-200 mb-6">{error}</p>
                            <button
                                onClick={generatePYQs}
                                className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-all"
                            >
                                Retry
                            </button>
                        </motion.div>
                    )}

                    {isGenerating ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="w-16 h-16 border-4 rounded-full animate-spin mr-4" style={{ borderColor: primaryColor + '30', borderTopColor: primaryColor }} />
                            <div>
                                <p className="font-bold text-lg" style={{ color: primaryColor }}>Generating PYQs...</p>
                                <p className="text-sm mt-1" style={{ color: primaryColor + '70' }}>Connecting to AI</p>
                            </div>
                        </div>
                    ) : pyqs.length === 0 ? (
                        <div className="text-center py-24">
                            <FaBrain className="text-6xl opacity-30 mx-auto mb-8" style={{ color: primaryColor }} />
                            <h3 className={`text-3xl font-black mb-6 ${textColor}`}>Ready to Generate</h3>
                            <p className={`text-xl opacity-75 mb-12 max-w-lg mx-auto leading-relaxed ${textMuted}`}>
                                Click Generate to create <br/>
                                <span style={{ color: primaryColor }}>Class {classLevel} {board} PYQs</span>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: primaryColor + '10', border: `1px solid ${primaryColor}30` }}>
                                <h3 className="text-2xl font-black mb-2" style={{ color: primaryColor }}>✅ {pyqs.length} Questions Generated</h3>
                                <div className={`flex justify-center items-center gap-8 text-sm ${textMuted}`}>
                                    <span>{pyqs.filter(q => q.marks === 1).length} × 1 Mark</span>
                                    <span>{pyqs.filter(q => q.marks === 2).length} × 2 Marks</span>
                                    <span>{pyqs.filter(q => q.marks === 3).length} × 3 Marks</span>
                                    <span>{pyqs.filter(q => q.marks === 5).length} × 5 Marks</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {pyqs.map((q, index) => (
                                    <motion.div
                                        key={q.id || index}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`group bg-gradient-to-br ${cardBg} backdrop-blur-xl rounded-2xl p-8 border ${borderColor} transition-all`}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = primaryColor + '40'; e.currentTarget.style.boxShadow = `0 0 30px ${primaryColor}30`; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
                                    >
                                        <div className={`flex items-center justify-between mb-6 pb-4 border-b ${borderColor}`}>
                                            <div className="flex items-center gap-4">
                                                <span className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-2xl" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
                                                    Q{index + 1}
                                                </span>
                                                <span className="px-4 py-2 text-xs font-black rounded-xl text-white shadow-lg" style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)` }}>
                                                    [{q.marks || 1} Mark{q.marks > 1 ? 's' : ''}]
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <h4 className={`text-xl font-black mb-6 leading-tight ${textColor}`}>
                                                {processInlineFormatting(q.question) || 'Question loading...'}
                                            </h4>
                                        </div>

                                        <div className="flex gap-3 mt-4">
                                            <button 
                                                onClick={() => toggleAnswer(q.id || index)}
                                                className="flex-1 flex items-center justify-center gap-3 py-4 px-8 text-white font-black rounded-2xl shadow-2xl transition-all uppercase tracking-wide hover:opacity-90"
                                                style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)` }}
                                                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 20px ${primaryColor}40`}
                                                onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                                            >
                                                {showAnswers[q.id || index] ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                                {showAnswers[q.id || index] ? 'Hide Answer' : 'Show Answer'}
                                            </button>
                                            
                                            {onAskAI && (
                                                <button 
                                                    onClick={() => onAskAI(q)}
                                                    className="flex items-center justify-center gap-2 py-4 px-6 font-black rounded-2xl shadow-2xl transition-all uppercase tracking-wide hover:opacity-90 border-2"
                                                    style={{ 
                                                        background: `linear-gradient(to right, ${primaryColor}20, ${primaryColor}10)`,
                                                        borderColor: primaryColor + '50',
                                                        color: primaryColor
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.background = `linear-gradient(to right, ${primaryColor}40, ${primaryColor}20)`;
                                                        e.currentTarget.style.boxShadow = `0 0 20px ${primaryColor}30`;
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.background = `linear-gradient(to right, ${primaryColor}20, ${primaryColor}10)`;
                                                        e.currentTarget.style.boxShadow = '';
                                                    }}
                                                >
                                                    <FaBrain size={16} />
                                                    <span className="hidden sm:inline">Ask AI</span>
                                                </button>
                                            )}
                                        </div>

                                        <AnimatePresence>
                                            {showAnswers[q.id || index] && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className={`mt-8 pt-8 border-t ${borderColor}`}
                                                >
                                                    <div className="p-8 rounded-2xl border backdrop-blur-xl" style={{ background: `linear-gradient(to right, ${primaryColor}10, ${primaryColor}10)`, borderColor: primaryColor + '30' }}>
                                                        <h5 className={`font-black text-xl mb-6 flex items-center gap-3 uppercase tracking-wide`} style={{ color: primaryColor }}>
                                                            <FaBrain style={{ color: primaryColor }} size={20} />
                                                            Solution
                                                        </h5>
                                                        <div className={`text-lg leading-relaxed whitespace-pre-wrap ${textMuted}`}>
                                                            {formatAnswer(q.answer || q.step_by_step_answer)}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AIPyqGenerator;

