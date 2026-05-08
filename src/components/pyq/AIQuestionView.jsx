import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaLightbulb, FaSyncAlt } from 'react-icons/fa';
import HintButton from './HintButton';

<<<<<<< HEAD
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-toastify';

import { renderFormattedAnswer, renderInline } from '../../utils/pyqFormatting';



const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-e5h8.onrender.com").replace(/\/$/, "");

const AIQuestionView = ({ theme, board, classLevel, subject, chapter, updateStats }) => {
  const { currentUser, userData } = useAuth();


=======
const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-e5h8.onrender.com").replace(/\/$/, "");

const AIQuestionView = ({ theme, board, classLevel, subject, chapter, updateStats }) => {
>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hintCount, setHintCount] = useState(0);
  const [solved, setSolved] = useState(false);

  const isDark = theme?.isDark !== false;
  const primaryColor = theme?.primaryHex || "#6366f1";

<<<<<<< HEAD


  const [cachedQuestions, setCachedQuestions] = useState([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);


  const getChapterDocRef = useCallback(() => {
    const effectiveBoard = board || userData?.board || 'CBSE';
    const effectiveClass = classLevel || userData?.classLevel || userData?.class || '10';

    // Stable ID for this chapter context
    const chapterKey = `${effectiveBoard}__${effectiveClass}__${subject}__${chapter}`;

    return doc(db, 'users', currentUser?.uid, 'pyqAiByChapter', chapterKey);
  }, [currentUser?.uid, board, classLevel, subject, chapter, userData]);

  const loadCache = useCallback(async () => {
    if (!currentUser?.uid) return;
    if (!subject || !chapter) return;

    setCacheLoaded(false);

    try {
      // New behavior: chapter-level doc (source of truth)
      const chapterDocRef = getChapterDocRef();
      const snap = await getDoc(chapterDocRef);

      if (snap.exists()) {
        const data = snap.data();
        setCachedQuestions(Array.isArray(data?.questions) ? data.questions : []);
        return;
      }

      // Fallback to legacy cache (so old users still see something)
      const effectiveBoard = board || userData?.board || 'CBSE';
      const effectiveClass = classLevel || userData?.classLevel || userData?.class || '10';
      const cacheKey = `${effectiveBoard}|${effectiveClass}|${subject}|${chapter}`;

      const flatPathParts = ['users', currentUser.uid, 'pyqAiCacheFlat', cacheKey];
      const flatDocRef = doc(db, ...flatPathParts);
      const flatSnap = await getDoc(flatDocRef);

      if (flatSnap.exists()) {
        const data = flatSnap.data();
        setCachedQuestions(Array.isArray(data?.questions) ? data.questions : []);
        return;
      }

      const pathParts = [
        'users',
        currentUser.uid,
        'pyqAiCache',
        effectiveBoard,
        effectiveClass,
        subject || 'UnknownSubject',
        chapter || 'UnknownChapter',
        'cache'
      ];

      const cacheDocRef = doc(db, ...pathParts);
      const legacySnap = await getDoc(cacheDocRef);
      if (legacySnap.exists()) {
        const data = legacySnap.data();
        setCachedQuestions(Array.isArray(data?.questions) ? data.questions : []);
      } else {
        setCachedQuestions([]);
      }
    } catch (e) {
      console.error('AI PYQ cache load failed:', e);
      toast.error('AI PYQ cache load failed (check console)');
      setCachedQuestions([]);
    } finally {
      setCacheLoaded(true);
    }

  }, [currentUser?.uid, board, classLevel, subject, chapter, userData, getChapterDocRef]);

  useEffect(() => {
    if (!subject || !chapter || !currentUser?.uid) return;
    loadCache();
  }, [loadCache]);


  useEffect(() => {
    // DB-backed source of truth restore
    if (!cacheLoaded) return;

    if (cachedQuestions?.length > 0) {
      const first = cachedQuestions[0] || {};

      // Restore at least question + answer from DB
      setQuestion(first);
      setAnswer(first?.answer || '');

      // Preserve UI progress if we have it for this chapter; otherwise default.
      // (Hint/solved are not guaranteed to exist in the stored question doc.)
      try {
        const effectiveBoard = board || userData?.board || 'CBSE';
        const effectiveClass = classLevel || userData?.classLevel || userData?.class || '10';
        const key = `pyqAiUiState:${currentUser?.uid}:${effectiveBoard}:${effectiveClass}:${subject}:${chapter}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          setHintCount(parsed?.hintCount || 0);
          setSolved(!!parsed?.solved);
          return;
        }
      } catch {
        // ignore
      }

      setSolved(false);
      setHintCount(0);
      return;
    }

    setQuestion(null);
    setAnswer('');
    setSolved(false);
    setHintCount(0);
  }, [cacheLoaded, cachedQuestions, board, classLevel, subject, chapter, currentUser?.uid, userData]);




  // Generate AI PYQ (append to cache)
=======
  // Generate AI PYQ
>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b
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
<<<<<<< HEAD
- Generate exactly ONE board-level question.
- Marks must be either 3 or 5.
- Must be accurate to ${board} board exam expectations.

MARKS-ACCURATE SOLUTION (CRITICAL):
- If Marks = 3: write the solution as exactly 3 points/steps. Label them "Step 1", "Step 2", "Step 3".
- If Marks = 5: write the solution as exactly 5 points/steps. Label them "Step 1" ... "Step 5".
- Each step must be relevant and contribute to the final answer.
- No extra paragraphs beyond the required steps.

MATHS (NUMERICAL/PROBLEM-SOLVING) FORMAT:
- Use step-by-step reasoning with formulas/substitution.
- Keep final answer clearly stated in the last step.

FORMATTING:
- Use // for line breaks inside the Solution.
- Use [BOLD]text[/BOLD] for key terms and formulas.
- Use LaTeX math only as $$...$$.
- Use plain ASCII characters only (no special unicode).
=======
- 3-5 marks typical ${board} board question
- Include marks [3/5 Marks]
- LaTeX math: $$E=mc^2$$
- Board-style: precise, diagram-ready
- Difficulty: actual board level
>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b

OUTPUT FORMAT:
**Question:** [question text]
**Topic:** [subtopic from chapter]
**Marks:** [3 or 5]
<<<<<<< HEAD
**Solution:** [exactly 3 or 5 steps/points with marking-scheme style]
=======
**Solution:** [step-by-step board solution with marking scheme]
>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b

Generate BOTH question AND solution.`;

      const res = await fetch(`${API_BASE}/chat?message=Generate+PYQ+with+solution&systemInstruction=${encodeURIComponent(systemPrompt)}&subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}&board=${encodeURIComponent(board)}&classLevel=${encodeURIComponent(classLevel)}&mode=PYQ-SOLUTION`);

<<<<<<< HEAD

=======
>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b
      if (!res.ok) throw new Error('Failed to generate question');

      const data = await res.json();
      const aiQuestion = data.reply;

      // Parse question from AI response
      const questionMatch = aiQuestion.match(/\*\*Question:\*\*\s*(.+?)(?=\*\*Topic:|$)/s);
      const topicMatch = aiQuestion.match(/\*\*Topic:\*\*\s*(.+)/);
      const marksMatch = aiQuestion.match(/\*\*Marks:\*\*\s*(\d+)/);
      const solutionMatch = aiQuestion.match(/\*\*Solution:\*\*\s*(.+)/s);

<<<<<<< HEAD
      let nextQuestion = null;
      let nextAnswer = '';

      if (questionMatch) {
        nextQuestion = {
          id: Date.now().toString(),
          text: questionMatch[1].trim().replace(/\*\*(.*?)\*\*/g, '$1'),
          topic: topicMatch ? topicMatch[1].trim() : chapter,
          marks: marksMatch ? parseInt(marksMatch[1]) : 3
        };
        nextAnswer = solutionMatch ? solutionMatch[1].trim() : 'Solution loading...';
      } else {
        nextQuestion = {
          id: Date.now().toString(),
          text: aiQuestion.trim(),
          topic: chapter,
          marks: 3
        };
        nextAnswer = 'See explanation above.';
      }

      // NEW behavior: overwrite chapter doc so returning to chapter shows the same question
      const chapterDocRef = getChapterDocRef();

      const newItem = { ...nextQuestion, answer: nextAnswer };

      await setDoc(
        chapterDocRef,
        {
          questions: [newItem],
          updatedAt: Date.now(),
          subject,
          chapter,
          board,
          classLevel,
          regenByUser: true,
          regeneratedAt: Date.now(),
        },
        { merge: false }
      );

      setCachedQuestions([newItem]);

      setQuestion(nextQuestion);
      setAnswer(nextAnswer);

=======
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

>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b
    } catch (err) {
      setError('Failed to generate question. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
<<<<<<< HEAD
  }, [chapter, subject, board, classLevel, currentUser?.uid, cachedQuestions, getChapterDocRef]);

=======
  }, [chapter, subject, board, classLevel]);
>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b

  // Progressive hints
  const getHintText = () => {
    switch (hintCount) {
      case 1: return "💡 Think about the core concept of this chapter. What formula or principle applies here?";
      case 2: return "🔍 Break the problem into smaller steps. What information is given vs what you need to find?";
      case 3: return "📝 Write down the relevant formula and identify which variables you know.";
      default: return answer || 'Loading solution...';
    }
  };

<<<<<<< HEAD

=======
  useEffect(() => {
    if (chapter && subject) {
      generateQuestion();
    }
  }, [chapter, subject, generateQuestion]);
>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b

  const handleSolutionReveal = () => {
    if (!solved) {
      setSolved(true);
      if (updateStats) updateStats({ solved: 1, score: 10 });
    }
  };

<<<<<<< HEAD
  // IMPORTANT: when modal is closed/unmounted, persist latest UI state
  // (question/answer/hints) so reopening doesn't reset to empty.
  useEffect(() => {
    if (!currentUser?.uid) return;
    if (!question) return;

    // Persist UI state permanently for this exact context.
    // It should only change when user regenerates (New Question button).
    const key = `pyqAiUiState:${currentUser.uid}:${board || userData?.board || 'CBSE'}:${classLevel || userData?.classLevel || userData?.class || '10'}:${subject}:${chapter}`;

    const payload = {
      question,
      answer,
      hintCount,
      solved
    };

    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      // ignore storage errors (private mode, quota, etc.)
    }
  }, [currentUser?.uid, question, answer, hintCount, solved, board, classLevel, subject, chapter, userData]);


  // On mount/cache load, restore UI state if present.
  useEffect(() => {
    if (!currentUser?.uid) return;
    if (!subject || !chapter) return;

    const effectiveBoard = board || userData?.board || 'CBSE';
    const effectiveClass = classLevel || userData?.classLevel || userData?.class || '10';

    const key = `pyqAiUiState:${currentUser.uid}:${effectiveBoard}:${effectiveClass}:${subject}:${chapter}`;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      if (parsed?.question) {
        setQuestion(parsed.question);
        setAnswer(parsed.answer || parsed.question?.answer || '');
        setHintCount(parsed.hintCount || 0);
        setSolved(!!parsed.solved);
      }
    } catch (e) {
      // ignore
    }
  }, [currentUser?.uid, board, classLevel, subject, chapter, userData]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Put History button strictly next to New Question */}
          <motion.button
            onClick={() => setShowHistory(s => !s)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-3 rounded-2xl font-bold transition-all border"
            style={{
              backgroundColor: primaryColor + '10',
              color: primaryColor,
              borderColor: primaryColor + '30'
            }}
            aria-label="History"
            title="Previously generated questions for this chapter"
          >
            {showHistory ? 'Hide History' : 'History'}
          </motion.button>

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
        </div>

=======
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
>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b

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

<<<<<<< HEAD

      {/* History Panel */}
      {showHistory && cachedQuestions?.length > 0 && (
        <div className="p-6 rounded-3xl border backdrop-blur-xl" style={{ borderColor: primaryColor + '30', backgroundColor: primaryColor + '10' }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-black" style={{ color: primaryColor }}>Previously generated for this chapter</h4>
            <span className="text-xs font-bold" style={{ color: primaryColor + 'cc' }}>{cachedQuestions.length}</span>
          </div>

          <div className="space-y-4">
            {cachedQuestions.map((q, idx) => (
              <motion.button
                key={q?.id || idx}
                onClick={() => {
                  setQuestion(q);
                  setAnswer(q?.answer || '');
                  setHintCount(0);
                  setSolved(false);
                }}
                className="w-full text-left p-4 rounded-2xl border transition-all"
                style={{
                  background: (question?.id && q?.id && question.id === q.id) ? (primaryColor + '15') : 'rgba(255,255,255,0.03)',
                  borderColor: (question?.id && q?.id && question.id === q.id) ? (primaryColor + '50') : (primaryColor + '25')
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black" style={{ color: primaryColor }}>Q{idx + 1}</span>
                  <span className="text-xs font-bold" style={{ color: primaryColor + 'cc' }}>[{q?.marks || 1} Marks]</span>
                </div>
                <div className="text-sm leading-relaxed" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
                  {q?.text ? q.text.replace(/\s+/g, ' ').slice(0, 120) + (q.text.length > 120 ? '...' : '') : 'Question'}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Question Display */}
      {question ? (

=======
      {/* Question Display */}
      {question ? (
>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b
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
<<<<<<< HEAD
            {renderInline(question.text, { primaryColor })}
          </div>


=======
            <div dangerouslySetInnerHTML={{
              __html: question.text
                .replace(/\$\$(.+?)\$\$/g, `<span class="px-2 py-1 rounded font-mono" style="background-color: ${primaryColor}20; color: ${primaryColor}; border: 1px solid ${primaryColor}40">$1</span>`)
                .replace(/\*\*(.*?)\*\*/g, `<strong style="color: ${primaryColor}">$1</strong>`)
            }} />
          </div>

>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b
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
<<<<<<< HEAD
              renderFormattedAnswer(answer, { primaryColor })
=======
              <div dangerouslySetInnerHTML={{
                __html: answer
                  .replace(/\$\$(.+?)\$\$/g, `<span class="px-2 py-1 rounded font-mono" style="background-color: ${primaryColor}20; color: ${primaryColor}; border: 1px solid ${primaryColor}40">$1</span>`)
                  .replace(/\*\*(.*?)\*\*/g, `<strong style="color: ${primaryColor}">$1</strong>`)
              }} />
>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b
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
