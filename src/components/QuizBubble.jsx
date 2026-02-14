import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// More comprehensive regex patterns to detect MCQ options (not anchored to line start)
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

// Function to parse MCQ content - improved version
const parseMCQ = (content) => {
    let question = "";
    let options = [];

    // Split content into lines and analyze
    const lines = content.split("\n").map(line => line.trim()).filter(line => line);

    if (lines.length < 2) {
        // Single line content - try to find options
        const optionMatch = content.match(/([A-D])[\.\)]\s*([^A-D]+)/g);
        if (optionMatch && optionMatch.length >= 2) {
            question = content.split(optionMatch[0])[0].trim();
            optionMatch.forEach(opt => {
                const keyMatch = opt.match(/^([A-D])/);
                if (keyMatch) {
                    const text = opt.replace(/^[A-D][\.\)]\s*/, "").trim();
                    if (text) options.push({ key: keyMatch[1], text });
                }
            });
        }
    } else {
        // Multi-line content
        // Strategy: Find lines that start with options (A., A), (A), etc.)
        const optionLines = [];
        const questionLines = [];

        for (const line of lines) {
            if (/^[\(\[\s]*[A-D][\)\]\.\s]/.test(line) || /^[A-D][\.\)]\s/.test(line)) {
                optionLines.push(line);
            } else if (questionLines.length <= 2) {
                // First few lines are likely the question
                questionLines.push(line);
            }
        }

        // If we found option lines, use them
        if (optionLines.length >= 2) {
            question = questionLines.join(" ").trim();

            for (const line of optionLines) {
                // Match patterns like "A) Water" or "A. Water" or "(A) Water"
                const match = line.match(/^[\(\[\s]*([A-D])[\)\]\.\s]+[\s]*(.+)/);
                if (match) {
                    options.push({ key: match[1], text: match[2].trim() });
                }
            }
        } else {
            // Fallback: assume first line is question, next 4 are options
            if (lines.length >= 5) {
                question = lines.slice(0, 2).join(" ").trim();
                const potentialOptions = lines.slice(2, 6);

                for (const line of potentialOptions) {
                    const match = line.match(/^[\(\[\s]*([A-D])[\)\]\.\s]+[\s]*(.+)/);
                    if (match) {
                        options.push({ key: match[1], text: match[2].trim() });
                    }
                }
            }
        }
    }

    // If still no options found, try one more approach - look for any A-D pattern anywhere
    if (options.length < 2) {
        const allMatches = [];
        let match;
        const globalRegex = /([A-D])[\.\)]\s+([^A-D\n]+)/g;
        while ((match = globalRegex.exec(content)) !== null) {
            if (match[2].trim()) {
                allMatches.push({ key: match[1], text: match[2].trim() });
            }
        }

        if (allMatches.length >= 2) {
            // First match's position determines where question ends
            const firstMatchIndex = content.indexOf(allMatches[0][0]);
            question = content.substring(0, firstMatchIndex).trim().replace(/\n/g, " ");
            options = allMatches;
        }
    }

    // Fallback: if still no options, treat entire content as question
    if (options.length === 0) {
        return { question: content, options: [], isValidMCQ: false };
    }

    return { question, options, isValidMCQ: options.length >= 2 && options.length <= 4 };
};

export default function QuizBubble({ message, onAnswerSelect, theme }) {
    const { content, role } = message;
    const [selectedOption, setSelectedOption] = useState(null);
    const [hasAnswered, setHasAnswered] = useState(false);

    // Debug: Log the content to understand what we're receiving
    console.log("QuizBubble received:", { content, role });

    // Check if content is an MCQ and parse it
    const mcqData = useMemo(() => {
        if (role !== "ai") {
            console.log("Not AI message, returning null");
            return null;
        }
        if (!isMCQ(content)) {
            console.log("Not detected as MCQ, content:", content.substring(0, 100));
            return null;
        }
        const parsed = parseMCQ(content);
        console.log("Parsed MCQ:", parsed);
        return parsed;
    }, [content, role]);

    // If not a valid MCQ, return null to use default rendering
    if (!mcqData || !mcqData.isValidMCQ) {
        console.log("Invalid MCQ, returning null");
        return null;
    }

    console.log("Rendering QuizBubble with options:", mcqData.options);

    const handleOptionSelect = (option) => {
        if (hasAnswered) return;

        setSelectedOption(option.key);
        setHasAnswered(true);

        // Send the answer back to AI
        const answerText = `${option.key}) ${option.text}`;
        if (onAnswerSelect) {
            onAnswerSelect(answerText);
        }
    };

    // Get theme-based colors
    const getThemeColors = () => {
        if (!theme) {
            return {
                primary: "indigo-600",
                primaryHex: "#4f46e5",
                text: "text-white",
                accent: "text-indigo-400",
                card: "bg-white/[0.03]",
                border: "border-white/10",
                isDark: true,
            };
        }
        return theme;
    };

    const themeColors = getThemeColors();

    return (
        <div className={`mt-4 p-5 rounded-2xl ${themeColors.card} border ${themeColors.border} shadow-lg`}>
            {/* Question with LaTeX support */}
            <div className="mb-4">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    className="prose prose-invert prose-sm max-w-none"
                >
                    {mcqData.question}
                </ReactMarkdown>
            </div>

            {/* Options as Radio Buttons */}
            <div className="space-y-3">
                {mcqData.options.map((option) => {
                    const isSelected = selectedOption === option.key;
                    const showGlow = isSelected && !hasAnswered;

                    return (
                        <button
                            key={option.key}
                            onClick={() => handleOptionSelect(option)}
                            disabled={hasAnswered}
                            className={`
                                w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300
                                ${showGlow
                                    ? `border-${themeColors.primary} shadow-[0_0_20px_${themeColors.primaryHex}]`
                                    : themeColors.border
                                }
                                ${hasAnswered
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer hover:bg-white/5 hover:border-white/20'
                                }
                            `}
                            style={showGlow ? {
                                borderColor: themeColors.primaryHex,
                                boxShadow: `0 0 25px ${themeColors.primaryHex}60`
                            } : {}}
                        >
                            {/* Custom Radio Button */}
                            <div className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                ${isSelected
                                    ? `border-${themeColors.primary} bg-${themeColors.primary}`
                                    : 'border-white/30'
                                }
                            `}
                                style={isSelected ? {
                                    borderColor: themeColors.primaryHex,
                                    backgroundColor: themeColors.primaryHex
                                } : {}}
                            >
                                {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                )}
                            </div>

                            {/* Option Text with LaTeX support */}
                            <span className={`flex-1 text-left text-sm font-medium ${themeColors.text}`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                >
                                    {option.text}
                                </ReactMarkdown>
                            </span>

                            {/* Option Key Badge */}
                            <span className={`
                                px-3 py-1 rounded-lg text-xs font-bold uppercase
                                ${isSelected
                                    ? `bg-${themeColors.primary} text-white`
                                    : 'bg-white/10 text-white/50'
                                }
                            `}
                                style={isSelected ? {
                                    backgroundColor: themeColors.primaryHex
                                } : {}}
                            >
                                {option.key}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Feedback Message */}
            {hasAnswered && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                    <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                        <span>✓</span>
                        Answer sent! Waiting for response...
                    </p>
                </div>
            )}
        </div>
    );
}
