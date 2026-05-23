import React, { useState, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { motion, AnimatePresence } from "framer-motion";
import "katex/dist/katex.min.css";

// Detection for MCQ patterns
const MCQ_PATTERNS = [
    /\b\**[A-D]\**\)[\s]/,
    /\b\**[A-D]\**\.\s/,
    /\b\(\**[A-D]\**\)[\s]/,
];

const isMCQ = (content) => MCQ_PATTERNS.some((pattern) => pattern.test(content));

const parseMCQ = (content) => {
    let question = "";
    let options = [];
    const lines = content.split("\n").map(line => line.trim()).filter(line => line);

    const optionLines = lines.filter(line => /^[\(\[\s]*[A-D][\)\]\.\s]/.test(line));
    const questionLines = lines.filter(line => !/^[\(\[\s]*[A-D][\)\]\.\s]/.test(line));

    if (optionLines.length >= 2) {
        question = questionLines.join("\n\n").trim();
        optionLines.forEach(line => {
            const match = line.match(/^[\(\[\s]*([A-D])[\)\]\.\s]+[\s]*(.+)/);
            if (match) options.push({ key: match[1], text: match[2].trim() });
        });
    }

    return {
        question,
        options,
        isValidMCQ: options.length >= 2
    };
};

export default function QuizBubble({ message, onAnswerSelect, quizProgress = { current: 1, total: 5 } }) {
    const { content, role } = message;
    const [selectedOption, setSelectedOption] = useState(null);
    const [hasAnswered, setHasAnswered] = useState(false);

    // FIX: Resets the state whenever a new question message is received
    useEffect(() => {
        setSelectedOption(null);
        setHasAnswered(false);
    }, [content]);

    const mcqData = useMemo(() => {
        if (role !== "ai" || !isMCQ(content)) return null;
        return parseMCQ(content);
    }, [content, role]);

    if (!mcqData || !mcqData.isValidMCQ) return null;

    const handleOptionSelect = (option) => {
        if (hasAnswered) return;
        setSelectedOption(option.key);
        setHasAnswered(true);

        if (onAnswerSelect) {
            onAnswerSelect(`My answer is ${option.key}) ${option.text}`);
        }
    };

    const progressPercent = (quizProgress.current / quizProgress.total) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 rounded-[2rem] border-2 bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl relative overflow-hidden"
        >
            {/* Progress Header */}
            <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
                    Phase {quizProgress.current} of {quizProgress.total}
                </span>
                <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                    />
                </div>
            </div>

            {/* Question Area */}
            <div className="mb-8 px-2">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    className="text-lg font-bold leading-relaxed text-white/90 prose-invert"
                >
                    {mcqData.question}
                </ReactMarkdown>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 gap-3">
                {mcqData.options.map((option) => {
                    const isSelected = selectedOption === option.key;

                    return (
                        <button
                            key={option.key}
                            // FIXED: Changed handleSelect to handleOptionSelect
                            onClick={() => handleOptionSelect(option)}
                            disabled={hasAnswered}
                            className={`
                                group w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300
                                ${isSelected
                                    ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                                    : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/20"}
                                ${hasAnswered && !isSelected ? "opacity-40" : "opacity-100"}
                            `}
                        >
                            <div className={`
                                w-8 h-8 rounded-xl border-2 flex items-center justify-center font-black text-xs transition-all
                                ${isSelected ? "bg-cyan-500 border-cyan-400 text-black" : "border-white/10 text-white/40 group-hover:border-white/30"}
                            `}>
                                {option.key}
                            </div>

                            <div className="flex-1 text-left text-sm font-medium text-white/80">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {option.text}
                                </ReactMarkdown>
                            </div>

                            {isSelected && (
                                <motion.div layoutId="check" className="text-cyan-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>
                            )}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence>
                {hasAnswered && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2"
                    >
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                            Awaiting Game Master Validation...
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
