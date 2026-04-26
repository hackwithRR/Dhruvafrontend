import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaLightbulb, FaSyncAlt } from 'react-icons/fa';
import HintButton from './HintButton';

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-e5h8.onrender.com").replace(/\/$/, "");

const AIQuestionView = ({ theme, board, classLevel, subject, chapter, updateStats }) => {
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hintCount, setHintCount] = useState(0);
  const [solved, setSolved] = useState(false);

  const isDark = theme?.isDark !== false;
  const primaryColor = theme?.primaryHex || "#6366f1";

  // Generate AI PYQ
  const generateQuestion = useCallback(async () => {
    if (!chapter || !subject) return;

    setLoading(true);
    setError('');
    setHintCount(0);
    setSolved(false);

    try {
      const systemPrompt = `You are generating authentic ${board} board exam PYQs for Class ${classLevel} ${subject}.

Chapter: "${chapter}"
Board: ${board}
Class: ${classLevel}

RULES:
- 3-5 marks typical ${board} board question
- Include marks [3/5 Marks]
- LaTeX math: $$E=mc^2$$
- Board-style: precise, diagram-ready
- Difficulty: actual board level

OUTPUT FORMAT:
**Question:** [question text]
**Topic:** [subtopic from chapter]
**Marks:** [3 or 5]
**Solution:** [step-by-step board solution with marking scheme]

Generate BOTH question AND solution.`;

      const res = await fetch(`${API_BASE}/chat?message=Generate+PYQ+with+solution&systemInstruction=${encodeURIComponent(systemPrompt)}&subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}&board=${encodeURIComponent(board)}&classLevel=${encodeURIComponent(classLevel)}&mode=PYQ-SOLUTION`);

      if (!res.ok) throw new Error('Failed to generate question');

      const data = await res.json();
      const aiQuestion = data.reply;

      // Parse question from AI response
      const questionMatch = aiQuestion.match(/\*\*Question:\*\*\s*(.+?)(?=\*\*Topic:|$)/s);
      const topicMatch = aiQuestion.match(/\*\*Topic:\*\*\s*(.+)/);
      const marksMatch = aiQuestion.match(/\*\*Marks:\*\*\s*(\d+)/);
      const solutionMatch = aiQuestion.match(/\*\*Solution:\*\*\s*(.+)/s);

      if (questionMatch) {
        setQuestion({
          text: questionMatch[1].trim().replace(/\*\*(.*?)\*\*/g, '$1'),
          topic: topicMatch ? topicMatch[1].trim() : chapter,
          marks: marksMatch ? parseInt(marksMatch[1]) : 3
        });
        setAnswer(solutionMatch ? solutionMatch[1].trim() : 'Solution loading...');
      } else {
        setQuestion({ text: aiQuestion.trim(), topic: chapter, marks: 3 });
        setAnswer('See explanation above.');
      }

    } catch (err) {
      setError('Failed to generate question. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [chapter, subject, board, classLevel]);

  // Progressive hints
  const getHintText = () => {
    switch (hintCount) {
      case 1: return "💡 Think about the core concept of this chapter. What formula or principle applies here?";
      case 2: return "🔍 Break the problem into smaller steps. What information is given vs what you need to find?";
      case 3: return "📝 Write down the relevant formula and identify which variables you know.";
      default: return answer || 'Loading solution...';
    }
  };

  useEffect(() => {
    if (chapter && subject) {
      generateQuestion();
    }
  }, [chapter, subject, generateQuestion]);

  const handleSolutionReveal = () => {
    if (!solved) {
      setSolved(true);
      if (updateStats) updateStats({ solved: 1, score: 10 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <motion.button
          onClick={generateQuestion}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all"
          style={{
            backgroundColor: primaryColor + '20',
            color: primaryColor,
            border: `1px solid ${primaryColor}40`
          }}
        >
          <FaSyncAlt size={16} className={`transition-transform ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating...' : 'New Question'}
        </motion.button>

        <HintButton
          hintCount={hintCount}
          onHint={() => {
            setHintCount(c => c + 1);
            if (hintCount >= 3) handleSolutionReveal();
          }}
          maxHints={4}
          theme={theme}
        />
      </div>

      {/* Question Display */}
      {question ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl border-2 bg-white/20 shadow-2xl backdrop-blur-xl"
          style={{ borderColor: primaryColor + '30' }}
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-2xl font-black" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
              Question
            </h3>
            <span className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-600 font-bold text-sm border border-amber-500/30">
              [{question.marks} Marks]
            </span>
          </div>

          <div className="prose prose-lg max-w-none leading-relaxed mb-6" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
            <div dangerouslySetInnerHTML={{
              __html: question.text
                .replace(/\$\$(.+?)\$\$/g, `<span class="px-2 py-1 rounded font-mono" style="background-color: ${primaryColor}20; color: ${primaryColor}; border: 1px solid ${primaryColor}40">$1</span>`)
                .replace(/\*\*(.*?)\*\*/g, `<strong style="color: ${primaryColor}">$1</strong>`)
            }} />
          </div>

          <div className="pt-6 border-t flex items-center gap-3"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <span className="text-sm" style={{ color: theme?.text + '70' || 'rgba(255,255,255,0.6)' }}>Topic:</span>
            <span className="px-3 py-1 rounded-lg font-bold text-sm border" style={{ backgroundColor: primaryColor + '20', color: primaryColor, borderColor: primaryColor + '30' }}>
              {question.topic}
            </span>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed text-center"
          style={{
            borderColor: primaryColor + '30',
            color: theme?.text + '50' || 'rgba(255,255,255,0.5)'
          }}
        >
          <FaLightbulb className="text-5xl mb-6 opacity-30" />
          <p className="text-lg font-bold mb-2" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>Ready for PYQs</p>
          <p className="text-sm" style={{ color: theme?.text + '60' || 'rgba(255,255,255,0.5)' }}>AI will generate board-level questions for your chapter</p>
        </motion.div>
      )}

      {/* Hints Area */}
      {hintCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-6 rounded-3xl border backdrop-blur-xl"
          style={{
            backgroundColor: hintCount >= 4 ? '#fbbf2420' : '#10b98120',
            borderColor: hintCount >= 4 ? '#fbbf2430' : '#10b98130'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${hintCount === 1 ? 'bg-yellow-400' : hintCount === 2 ? 'bg-orange-400' : hintCount === 3 ? 'bg-blue-400' : 'bg-green-400'}`} />
            <h4 className="font-bold text-lg" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
              {hintCount === 1 && '💡 Light Hint'}
              {hintCount === 2 && '🔍 Medium Hint'}
              {hintCount === 3 && '📝 Strong Hint'}
              {hintCount >= 4 && '✅ Full Solution'}
            </h4>
          </div>

          <div className="prose prose-lg max-w-none" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
            {hintCount >= 4 ? (
              <div dangerouslySetInnerHTML={{
                __html: answer
                  .replace(/\$\$(.+?)\$\$/g, `<span class="px-2 py-1 rounded font-mono" style="background-color: ${primaryColor}20; color: ${primaryColor}; border: 1px solid ${primaryColor}40">$1</span>`)
                  .replace(/\*\*(.*?)\*\*/g, `<strong style="color: ${primaryColor}">$1</strong>`)
              }} />
            ) : (
              <p>{getHintText()}</p>
            )}
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border-2 text-center"
          style={{ borderColor: '#ef444430', backgroundColor: '#ef444410', color: theme?.text || (isDark ? '#fff' : '#000') }}
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default AIQuestionView;
