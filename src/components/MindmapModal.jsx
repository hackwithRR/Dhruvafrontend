/**
 * PadhoyaarAI - Mindmap Modal
 * Generates real mindmaps from chapter content with LaTeX math support
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTimes,
    FaBrain,
    FaSyncAlt,
    FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import MindmapViewer from './MindmapViewer';

const MindmapModal = ({ isOpen, onClose, chapterText, userData, theme = {}, chapter, subject }) => {
    const { currentUser } = useAuth();
    const [mindmapData, setMindmapData] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const mindmapRef = useRef(null);

    const chapterName = chapter || userData?.chapter || 'Chapter';
    const subjectName = subject || userData?.subject || 'Science';
    const board = userData?.board || 'CBSE';
    const classLevel = userData?.classLevel || userData?.class || '10';


    // Convert LaTeX math to Unicode for Mermaid compatibility
    const convertLatexToUnicode = (text) => {
        if (!text) return text;

        let converted = text;

        // Common LaTeX to Unicode conversions
        const conversions = [
            // Fractions: \frac{a}{b} → a/b
            { pattern: /\\frac\{([^}]+)\}\{([^}]+)\}/g, replacement: '$1/$2' },
            // Square root: \sqrt{x} → √x
            { pattern: /\\sqrt\{([^}]+)\}/g, replacement: '√($1)' },
            { pattern: /\\sqrt/g, replacement: '√' },
            // Greek letters
            { pattern: /\\alpha/g, replacement: 'α' },
            { pattern: /\\beta/g, replacement: 'β' },
            { pattern: /\\gamma/g, replacement: 'γ' },
            { pattern: /\\delta/g, replacement: 'δ' },
            { pattern: /\\theta/g, replacement: 'θ' },
            { pattern: /\\lambda/g, replacement: 'λ' },
            { pattern: /\\mu/g, replacement: 'μ' },
            { pattern: /\\pi/g, replacement: 'π' },
            { pattern: /\\sigma/g, replacement: 'σ' },
            { pattern: /\\Sigma/g, replacement: 'Σ' },
            { pattern: /\\Delta/g, replacement: 'Δ' },
            { pattern: /\\Omega/g, replacement: 'Ω' },
            // Math symbols
            { pattern: /\\pm/g, replacement: '±' },
            { pattern: /\\times/g, replacement: '×' },
            { pattern: /\\cdot/g, replacement: '·' },
            { pattern: /\\div/g, replacement: '÷' },
            { pattern: /\\infty/g, replacement: '∞' },
            { pattern: /\\rightarrow/g, replacement: '→' },
            { pattern: /\\Rightarrow/g, replacement: '⇒' },
            { pattern: /\\leftarrow/g, replacement: '←' },
            { pattern: /\\Leftarrow/g, replacement: '⇐' },
            { pattern: /\\leq/g, replacement: '≤' },
            { pattern: /\\geq/g, replacement: '≥' },
            { pattern: /\\neq/g, replacement: '≠' },
            { pattern: /\\approx/g, replacement: '≈' },
            { pattern: /\\sim/g, replacement: '~' },
            { pattern: /\\propto/g, replacement: '∝' },
            { pattern: /\\in/g, replacement: '∈' },
            { pattern: /\\notin/g, replacement: '∉' },
            { pattern: /\\subset/g, replacement: '⊂' },
            { pattern: /\\supset/g, replacement: '⊃' },
            { pattern: /\\cup/g, replacement: '∪' },
            { pattern: /\\cap/g, replacement: '∩' },
            { pattern: /\\emptyset/g, replacement: '∅' },
            { pattern: /\\forall/g, replacement: '∀' },
            { pattern: /\\exists/g, replacement: '∃' },
            { pattern: /\\nexists/g, replacement: '∄' },
            { pattern: /\\neg/g, replacement: '¬' },
            { pattern: /\\wedge/g, replacement: '∧' },
            { pattern: /\\vee/g, replacement: '∨' },
            { pattern: /\\oplus/g, replacement: '⊕' },
            { pattern: /\\otimes/g, replacement: '⊗' },
            { pattern: /\\partial/g, replacement: '∂' },
            { pattern: /\\nabla/g, replacement: '∇' },
            { pattern: /\\int/g, replacement: '∫' },
            { pattern: /\\sum/g, replacement: 'Σ' },
            { pattern: /\\prod/g, replacement: '∏' },
            { pattern: /\\sqrt/g, replacement: '√' },
            { pattern: /\\degree/g, replacement: '°' },
            { pattern: /\\angle/g, replacement: '∠' },
            { pattern: /\\perp/g, replacement: '⊥' },
            { pattern: /\\parallel/g, replacement: '∥' },
            // Remove LaTeX commands that don't convert
            { pattern: /\\[a-zA-Z]+/g, replacement: '' },
            // Remove braces
            { pattern: /[{}]/g, replacement: '' },
            // Remove backslashes
            { pattern: /\\/g, replacement: '' }
        ];

        conversions.forEach(({ pattern, replacement }) => {
            converted = converted.replace(pattern, replacement);
        });

        return converted;
    };

    // Process node labels to convert LaTeX
    const processNodes = (nodes) => {
        if (!nodes || !Array.isArray(nodes)) return nodes;

        return nodes.map(node => ({
            ...node,
            label: convertLatexToUnicode(node.label)
        }));
    };


    // Generate mindmap on open
    useEffect(() => {
        if (isOpen && !mindmapData && !isGenerating) {
            generateMindmap();
        }
    }, [isOpen]);

    // Generate structure from chapter name using AI
    const generateFromChapterName = async (chapter, subject) => {
        // Always use AI to generate real content
        try {
            const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-e5h8.onrender.com").replace(/\/$/, "");

            const systemPrompt = `You are an expert ${subject} teacher creating a COMPREHENSIVE mindmap for the chapter "${chapter}".

Create a detailed mindmap with COMPLETE information, full definitions, all formulas, and real examples.

RESPOND ONLY WITH VALID JSON:
{
  "nodes": [
    {"id": 0, "label": "${chapter}", "level": 0},
    {"id": 1, "label": "Topic Name: complete explanation with all details", "level": 1, "parent": 0},
    {"id": 2, "label": "Subtopic: full description including formulas and examples", "level": 2, "parent": 1}
  ]
}

RULES:
- Create 6-8 MAIN TOPICS specific to "${chapter}" with COMPLETE descriptions
- Each main topic should have 3-4 SUBTOPICS with FULL details
- Include: definitions, formulas, properties, examples, applications
- Label format: "Name: complete explanation (50-100 characters)"
- Total 20-30 nodes with COMPREHENSIVE CONTENT
- DO NOT use brief descriptions - include ALL relevant information

MATH FORMATTING - Use Unicode symbols instead of LaTeX:
- Fractions: Use "a/b" instead of \\frac{a}{b}
- Exponents: Use "x²" "x³" "x^n" instead of x^2
- Square roots: Use "√x" instead of \\sqrt{x}
- Pi: Use "π" instead of \\pi
- Greek letters: Use α β γ θ Δ Σ directly
- Plus/minus: Use "±" instead of \\pm
- Multiplication: Use "×" or "·" instead of \\times or \\cdot
- Arrows: Use "→" "⇒" instead of \\rightarrow

EXAMPLE MATH EXPRESSIONS:
- "Quadratic formula: x = (-b ± √(b²-4ac))/2a"
- "Area of circle: A = πr²"
- "Pythagoras: a² + b² = c²"
- "Trigonometry: sin²θ + cos²θ = 1"

OUTPUT ONLY VALID JSON. No markdown, no explanations.`;


            const formData = new FormData();
            formData.append("userId", currentUser?.uid || 'anonymous');
            formData.append("message", `Create a detailed mindmap for ${subject} chapter: ${chapter}`);
            formData.append("systemInstruction", systemPrompt);
            formData.append("mode", "Explain");
            formData.append("subject", subject);
            formData.append("chapter", chapter);
            formData.append("board", board);
            formData.append("class", classLevel);

            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const data = await response.json();
            const aiResponse = data.reply;

            // Extract JSON
            let parsedData;
            try {
                const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
                parsedData = JSON.parse(jsonStr.trim());
            } catch (parseErr) {
                console.error('Parse error:', parseErr);
                return createSmartFallback(chapter, subject);
            }

            if (!parsedData.nodes || !Array.isArray(parsedData.nodes)) {
                return createSmartFallback(chapter, subject);
            }

            // Convert LaTeX to Unicode in all node labels
            parsedData.nodes = processNodes(parsedData.nodes);

            return parsedData;

        } catch (err) {
            console.error('AI generation error:', err);
            return createSmartFallback(chapter, subject);
        }
    };

    // Smart fallback with subject-specific templates - COMPREHENSIVE VERSION
    const createSmartFallback = (chapter, subject) => {
        const subjectTemplates = {
            'MATHEMATICS': [
                { label: 'Definitions & Concepts: Complete definitions with mathematical notation and examples', subs: ['Key Terms: Full definitions with formulas and notation', 'Basic Concepts: Detailed explanations with derivations', 'Important Formulas: All formulas with variables explained and units', 'Types & Categories: Classification with examples for each type'] },
                { label: 'Properties & Rules: Complete list of properties with proofs and applications', subs: ['Main Properties: Full statement with proof outline and usage', 'Special Cases: Edge cases with examples and exceptions', 'Applications: Real-world problems solved using these properties', 'Relationships: Connections with other mathematical concepts'] },
                { label: 'Solved Examples: Step-by-step solutions with explanations', subs: ['Basic Problems: Simple examples with detailed working steps', 'Advanced Problems: Complex multi-step solutions with reasoning', 'Practice Questions: Varied problems with hints and final answers', 'Common Mistakes: Errors to avoid with correct approach'] },
                { label: 'Exercise Problems: Complete coverage of all question types', subs: ['Short Answer: Quick concept checks with brief solutions', 'Long Answer: Detailed problems requiring full explanations', 'MCQ Practice: Multiple choice with all options analyzed', 'Assertion-Reason: Statement-based questions with justification'] }
            ],
            'PHYSICS': [
                { label: 'Laws & Principles: Fundamental laws with mathematical formulations', subs: ['Fundamental Laws: Complete statement with conditions and limitations', 'Derivations: Step-by-step derivation from first principles', 'Key Equations: All equations with variables defined and units', 'Assumptions: Underlying assumptions and their validity'] },
                { label: 'Concepts & Theory: Detailed theoretical explanations', subs: ['Core Concepts: In-depth explanations with diagrams and analogies', 'Definitions: Precise definitions with technical terms explained', 'Units & Dimensions: Dimensional analysis and unit conversions', 'Graphical Analysis: Interpretation of graphs and relationships'] },
                { label: 'Numerical Problems: Complete problem-solving approach', subs: ['Formula Based: Direct application with step-by-step solution', 'Concept Based: Problems requiring conceptual understanding', 'Advanced: Multi-concept problems with complex reasoning', 'Previous Year: Board exam questions with solutions'] },
                { label: 'Applications: Real-world and technological applications', subs: ['Real World Uses: Everyday applications with working principles', 'Daily Life Examples: Common phenomena explained scientifically', 'Technology: Modern devices and their physics principles', 'Industry: Industrial applications and engineering uses'] }
            ],
            'CHEMISTRY': [
                { label: 'Chemical Concepts: Complete theoretical framework', subs: ['Definitions: Precise chemical definitions with examples', 'Properties: Physical and chemical properties with explanations', 'Reactions: All important reactions with conditions and products', 'Mechanisms: Reaction mechanisms with electron movement'] },
                { label: 'Equations & Formulas: Comprehensive chemical mathematics', subs: ['Chemical Equations: Balanced equations with state symbols', 'Molecular Formulas: Structural and molecular formulas explained', 'Balancing: Methods for balancing complex redox reactions', 'Stoichiometry: Mole concept calculations with examples'] },
                { label: 'Periodic Table: Systematic study of elements', subs: ['Element Properties: Detailed properties of important elements', 'Trends: Periodic trends with explanations and graphs', 'Groups & Periods: Characteristics of each group with examples', 'Exceptions: Anomalous behavior with reasons explained'] },
                { label: 'Practical Applications: Laboratory and industrial chemistry', subs: ['Lab Experiments: Complete procedures with observations', 'Industrial Uses: Manufacturing processes and applications', 'Environmental: Environmental chemistry and green chemistry', 'Safety: Safety precautions and hazard handling'] }
            ],
            'BIOLOGY': [
                { label: 'Structure & Function: Detailed anatomical and physiological study', subs: ['Anatomy: Complete structural details with diagrams', 'Physiology: Functional mechanisms and processes', 'Mechanisms: Biochemical and biophysical mechanisms', 'Adaptations: Structural and functional adaptations'] },
                { label: 'Processes & Cycles: Complete life processes and cycles', subs: ['Life Processes: Detailed steps of metabolic processes', 'Biological Cycles: Complete cycles with all stages', 'Systems: Organ systems and their coordination', 'Regulation: Homeostasis and control mechanisms'] },
                { label: 'Classification: Systematic taxonomy and diversity', subs: ['Taxonomy: Classification hierarchy with examples', 'Characteristics: Distinguishing features of each group', 'Examples: Representative organisms with full details', 'Evolution: Evolutionary relationships and phylogeny'] },
                { label: 'Importance: Ecological and human significance', subs: ['Ecological Role: Ecosystem functions and food webs', 'Human Health: Medical importance and disease relevance', 'Conservation: Biodiversity conservation strategies', 'Biotechnology: Applications in medicine and agriculture'] }
            ],
            'HISTORY': [
                { label: 'Timeline & Events: Comprehensive chronological coverage', subs: ['Key Dates: Important dates with significance explained', 'Major Events: Detailed description of historical events', 'Chronology: Sequence of events with causal connections', 'Periods: Historical periods with characteristic features'] },
                { label: 'Important People: Detailed biographical and contribution analysis', subs: ['Leaders: Political leaders with their policies and impact', 'Reformers: Social reformers with movements and achievements', 'Contributors: Cultural, scientific, and economic contributors', 'Opposition: Resistance leaders and their strategies'] },
                { label: 'Causes & Effects: Comprehensive cause-effect analysis', subs: ['Root Causes: Underlying economic, social, political causes', 'Immediate Effects: Short-term consequences and reactions', 'Long Term Impact: Historical significance and legacy', 'Global Connections: International relations and influences'] },
                { label: 'Significance: Historical and contemporary relevance', subs: ['Historical Importance: Place in broader historical narrative', 'Modern Relevance: Connections to present-day issues', 'Lessons: Historical lessons and their applications', 'Sources: Primary and secondary sources with evaluation'] }
            ],
            'GEOGRAPHY': [
                { label: 'Location & Extent: Comprehensive spatial understanding', subs: ['Geographic Location: Absolute and relative location details', 'Boundaries: Natural and political boundaries with neighbors', 'Size: Area, dimensions, and comparative size analysis', 'Strategic Importance: Geopolitical significance'] },
                { label: 'Physical Features: Complete physical geography', subs: ['Landforms: Formation, types, and distribution of landforms', 'Climate: Climate types, factors, and seasonal variations', 'Natural Resources: Resource distribution and utilization', 'Disasters: Natural hazards and mitigation strategies'] },
                { label: 'Human Geography: Comprehensive human aspects', subs: ['Population: Demographics, distribution, and migration patterns', 'Industries: Industrial locations, types, and development', 'Agriculture: Farming types, crops, and agricultural practices', 'Settlements: Urban and rural settlement patterns'] },
                { label: 'Environmental Issues: Complete environmental geography', subs: ['Challenges: Environmental problems with causes and effects', 'Conservation: Protection strategies and protected areas', 'Sustainability: Sustainable development practices', 'Climate Change: Global warming impacts and adaptations'] }
            ]
        };


        const templates = subjectTemplates[subject?.toUpperCase()] || subjectTemplates['MATHEMATICS'];

        const nodes = [{ id: 0, label: chapter, level: 0 }];

        templates.forEach((topic, idx) => {
            const topicId = idx + 1;
            nodes.push({
                id: topicId,
                label: topic.label,
                level: 1,
                parent: 0
            });

            topic.subs.forEach((sub, subIdx) => {
                nodes.push({
                    id: 100 + (idx * 10) + subIdx,
                    label: sub,
                    level: 2,
                    parent: topicId
                });
            });
        });

        return { nodes };
    };



    const generateMindmap = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            // Always try to generate with AI first
            if (!chapterText || chapterText.length < 100) {
                console.log('No chat text, generating from chapter name with AI');
                const aiData = await generateFromChapterName(chapterName, subject);
                setMindmapData(aiData);
                setIsGenerating(false);
                return;
            }


            const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-e5h8.onrender.com").replace(/\/$/, "");

            // Create prompt for COMPREHENSIVE mindmap with full details
            const systemPrompt = `You are a mindmap generator for ${subjectName} - ${chapterName}. Create a COMPLETE mindmap with full information.

RESPOND ONLY WITH VALID JSON in this exact format:
{
  "nodes": [
    {"id": 0, "label": "${chapterName}", "level": 0},
    {"id": 1, "label": "Topic Name: complete explanation with definition and details", "level": 1, "parent": 0},
    {"id": 2, "label": "Subtopic: full description including formulas, steps, or examples", "level": 2, "parent": 1},
    {"id": 3, "label": "Example: detailed worked example with solution steps", "level": 2, "parent": 1}
  ]
}

RULES:
- id: unique number starting from 0
- level: 0=root(chapter name), 1=main topics, 2=sub-topics/examples
- parent: id of parent node (0 for root's children)
- label format: "Name: complete detailed explanation" (60-120 characters)
- Include 6-8 main topics (level 1) with FULL descriptions
- Include 3-4 sub-points under each main topic (level 2) with ALL details
- Total 20-30 nodes with COMPREHENSIVE content
- Include: definitions, formulas, properties, steps, examples, applications
- DO NOT use brief descriptions - provide COMPLETE information

MATH FORMATTING - Use Unicode symbols instead of LaTeX:
- Fractions: Use "a/b" instead of \\frac{a}{b}
- Exponents: Use "x²" "x³" "x^n" instead of x^2
- Square roots: Use "√x" instead of \\sqrt{x}
- Pi: Use "π" instead of \\pi
- Greek letters: Use α β γ θ Δ Σ directly
- Plus/minus: Use "±" instead of \\pm
- Multiplication: Use "×" or "·" instead of \\times or \\cdot
- Arrows: Use "→" "⇒" instead of \\rightarrow

EXCELLENT LABEL EXAMPLES:
- "Quadratic formula: x = (-b ± √(b²-4ac))/2a"
- "Area of circle: A = πr²"
- "Pythagoras: a² + b² = c²"
- "Trigonometry: sin²θ + cos²θ = 1"
- "Linear Equations: ax + b = 0, solution x = -b/a"
- "Cell Structure: Eukaryotic cells have nucleus, cytoplasm, cell membrane, mitochondria, ER, Golgi"

OUTPUT ONLY VALID JSON. No other text.`;


            const formData = new FormData();
            formData.append("userId", currentUser?.uid || 'anonymous');
            formData.append("message", chapterText || `Create a mindmap for ${chapterName}`);
            formData.append("systemInstruction", systemPrompt);
            formData.append("mode", "Explain");
            formData.append("subject", subjectName);
            formData.append("chapter", chapterName);

            formData.append("board", board);
            formData.append("class", classLevel);

            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.reply;

            console.log('AI Response:', aiResponse);

            // Extract JSON from response
            let parsedData;
            try {
                // Try to find JSON in code blocks
                const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
                parsedData = JSON.parse(jsonStr.trim());
            } catch (parseErr) {
                console.error('Parse error:', parseErr);
                // Fallback: use smart fallback
                parsedData = createSmartFallback(chapterName, subjectName);
            }


            // Validate structure
            if (!parsedData.nodes || !Array.isArray(parsedData.nodes)) {
                parsedData = createSmartFallback(chapterName, subjectName);
            }

            // Convert LaTeX to Unicode in all node labels
            parsedData.nodes = processNodes(parsedData.nodes);

            setMindmapData(parsedData);

        } catch (err) {
            console.error('Generation error:', err);
            setError(err.message);
            // Use smart fallback
            setMindmapData(createSmartFallback(chapterName, subjectName));
        } finally {
            setIsGenerating(false);
        }
    };



    // Extract real topics from chapter text using simple NLP
    const extractTopicsFromText = (text) => {
        console.log('=== EXTRACTING TOPICS ===');
        console.log('Input text length:', text?.length);
        console.log('First 200 chars:', text?.substring(0, 200));

        if (!text || text.length < 50) {
            console.log('Text too short, returning null');
            return null;
        }

        // Split into sentences and find key phrases
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        console.log('Found sentences:', sentences.length);

        // Look for capitalized phrases (likely important terms)
        const importantTerms = [];
        const termPattern = /\b([A-Z][a-zA-Z\s]{2,25})\b/g;

        sentences.forEach((sentence, idx) => {
            let match;
            while ((match = termPattern.exec(sentence)) !== null) {
                const term = match[1].trim();
                // Filter out common words
                if (!['The', 'This', 'That', 'These', 'Those', 'There', 'Their', 'They', 'Then', 'Than'].includes(term.split(' ')[0])) {
                    importantTerms.push(term);
                }
            }
        });

        console.log('Found important terms:', importantTerms.length);
        console.log('Sample terms:', importantTerms.slice(0, 10));

        // Count frequency and get top terms
        const termCounts = {};
        importantTerms.forEach(term => {
            termCounts[term] = (termCounts[term] || 0) + 1;
        });

        // Get unique terms sorted by frequency
        const sortedTerms = Object.entries(termCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([term]) => term);

        console.log('Sorted unique terms:', sortedTerms);

        // If we found real terms, use them
        if (sortedTerms.length >= 3) {
            const topics = sortedTerms.map((term, i) => ({
                id: i + 1,
                label: term.substring(0, 25),
                level: 1,
                parent: 0
            }));
            console.log('Returning real topics:', topics);
            return topics;
        }

        console.log('Not enough terms found, returning null');
        return null;
    };







    if (!isOpen) return null;

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
                    className="relative w-full max-w-6xl max-h-[90vh] rounded-3xl overflow-hidden bg-[#0a0a0f] border border-white/10 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 flex items-center justify-center text-2xl">
                                <FaBrain className="text-indigo-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase text-white">
                                    Neural Mindmap
                                </h2>
                                <p className="text-xs opacity-60">{chapterName} • {subjectName} • Class {classLevel} • {board}</p>

                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={generateMindmap}
                                disabled={isGenerating}
                                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50"
                                title="Regenerate"
                            >
                                <FaSyncAlt className={`${isGenerating ? 'animate-spin' : ''} text-white`} size={14} />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                            >
                                <FaTimes className="text-white" size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="h-[calc(90vh-100px)] p-6" ref={mindmapRef}>
                        {isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full"
                                />
                                <p className="text-indigo-400 text-sm font-bold uppercase mt-6 animate-pulse">
                                    Analyzing {chapterName}...
                                </p>
                            </div>
                        ) : error && !mindmapData ? (
                            <div className="h-full flex flex-col items-center justify-center p-8">
                                <FaExclamationTriangle className="text-red-400 text-4xl mb-4" />
                                <p className="text-red-400 font-bold">{error}</p>
                                <button
                                    onClick={generateMindmap}
                                    className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <MindmapViewer
                                mindmapData={mindmapData}
                                chapterName={chapterName}
                                subject={subjectName}
                                board={board}
                                classLevel={classLevel}
                                theme={theme}
                                onRegenerate={generateMindmap}
                            />


                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MindmapModal;
