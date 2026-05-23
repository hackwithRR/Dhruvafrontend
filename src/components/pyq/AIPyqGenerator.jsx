import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaEye, FaEyeSlash, FaSync, FaBrain, FaExclamationTriangle, FaHistory } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import axios from "axios";
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-e5h8.onrender.com").replace(/\/$/, "");

const AIPyqGenerator = ({ isOpen, onClose, filters = {}, theme = {}, onAskAI }) => {
  const { userData, currentUser } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [pyqs, setPyqs] = useState([]);
  const [showAnswers, setShowAnswers] = useState({});
  const [error, setError] = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [cachedQuestions, setCachedQuestions] = useState([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  const board = filters.board || userData?.board || 'CBSE';
  const classLevel = filters.class || userData?.classLevel || '10';
  const subject = filters.subject || 'Mathematics';
  const chapter = filters.chapter || 'Algebra';

  const isDark = theme?.isDark !== false;
  const primaryColor = theme?.primaryHex || '#6366f1';
  const bgColor = isDark ? 'bg-slate-900' : 'bg-white';
  const bgOverlay = isDark ? 'bg-black/90' : 'bg-gray-100/95';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-white/75' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';
  const cardBg = isDark ? 'bg-slate-800/50' : 'bg-white/80';
  const buttonBg = isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300';

  const getChapterDocRef = useCallback(() => {
    const effectiveBoard = board || userData?.board || 'CBSE';
    const effectiveClass = classLevel || userData?.classLevel || userData?.class || '10';
    const chapterKey = `${effectiveBoard}__${effectiveClass}__${subject}__${chapter}`;
    return doc(db, 'users', currentUser?.uid, 'pyqAiByChapter', chapterKey);
  }, [board, classLevel, subject, chapter, currentUser?.uid, userData]);

  const loadHistory = useCallback(async () => {
    if (!currentUser?.uid) return;
    if (!subject || !chapter) return;

    setCacheLoaded(false);
    setCachedQuestions([]);
    try {
      const chapterDocRef = getChapterDocRef();
      const chapterSnap = await getDoc(chapterDocRef);

      if (!chapterSnap.exists()) {
        setCachedQuestions([]);
        return;
      }

      // sessions subcollection (newest first)
      const sessionsColRef = collection(chapterDocRef, 'sessions');
      const q = query(sessionsColRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const first = snap.docs[0];
        const data = first.data() || {};
        setCachedQuestions(Array.isArray(data.questions) ? data.questions : []);
      } else {
        setCachedQuestions([]);
      }
    } catch (e) {
      console.error('AI PYQ history load failed:', e);
      toast.error(`AI PYQ history load failed: ${e?.message || 'unknown error'}`);
      setCachedQuestions([]);
    } finally {
      setCacheLoaded(true);
    }
  }, [currentUser?.uid, subject, chapter, getChapterDocRef]);

  useEffect(() => {
    if (showHistory) loadHistory();
  }, [showHistory, loadHistory]);

  const generatePYQs = async () => {
    setIsGenerating(true);
    setError('');
    setPyqs([]);

    try {
      const sessionId = Date.now().toString();

      const formData = new FormData();
      formData.append("userId", "pyq-" + Date.now());
      formData.append(
        "message",
        `Generate 12 ${board} board exam PYQs for Class ${classLevel} ${subject} Chapter "${chapter}". Return ONLY valid JSON array.`
      );

      const boardSpecificFormat = board.toUpperCase() === 'ICSE'
        ? `ICSE PYQ RULES (YOU MUST FOLLOW):
- Generate actual ICSE board-style PYQ problems (numerical / statement-based questions), not general theory-only notes.
- 1-mark question: include the full question statement + answer MUST contain exactly 1 short point (1 line).
- 2-mark question: include the full question statement + answer MUST contain exactly 2 distinct points.
- 3-mark question: include the full question + answer MUST contain exactly 3 clear answer points.
- 5-mark question: include the full question with necessary data + answer MUST contain exactly 5 marking-scheme steps/points.

FORMATTING:
- Use [BOLD]text[/BOLD] for important terms.
- Use // for line breaks.
- Avoid special unicode characters; use plain ASCII only.`
        : `CBSE PYQ RULES (YOU MUST FOLLOW):
- Generate actual CBSE board-style PYQ problems (numerical / statement-based questions), not general theory-only notes.
- 1 MARKS: write the full 1-mark question statement; answer MUST be exactly 1 short point (1 line).
- 2 MARKS: write the full 2-mark question statement; answer MUST contain exactly 2 points.
- 3 MARKS: write the full 3-mark question statement; answer MUST contain exactly 3 points.
- 5 MARKS: write the full 5-mark question statement; answer MUST contain exactly 5 marking-scheme steps/points.

FORMATTING:
- Use [BOLD]text[/BOLD] for important terms.
- Use // for line breaks.
- Avoid special unicode characters; use plain ASCII only.`;

      formData.append(
        "systemInstruction",
        `You are a JSON generator. Output ONLY a valid JSON array. No text before or after.

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
7. NO markdown code blocks, NO explanations, ONLY the JSON array`
      );

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
      cleanJSON = cleanJSON.replace(/```json\s*/gi, '');
      cleanJSON = cleanJSON.replace(/```\s*$/gi, '');
      cleanJSON = cleanJSON.trim();

      const arrayStart = cleanJSON.indexOf('[');
      const arrayEnd = cleanJSON.lastIndexOf(']');
      if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
        cleanJSON = cleanJSON.substring(arrayStart, arrayEnd + 1);
      }

      cleanJSON = cleanJSON
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .replace(/"answer"\s*:\s*"([^"]*)"/g, (match, p1) => {
          return '"answer":"' + p1.replace(/"/g, "'") + '"';
        })
        .replace(/"question"\s*:\s*"([^"]*)"/g, (match, p1) => {
          return '"question":"' + p1.replace(/"/g, "'") + '"';
        });

      let questions = [];
      try {
        const parsed = JSON.parse(cleanJSON);
        questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.pyqs || []);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        const objectMatches = cleanJSON.match(/\{[^}]*\}/g);
        if (objectMatches) {
          questions = objectMatches
            .map(str => {
              try { return JSON.parse(str); } catch { return null; }
            })
            .filter(Boolean);
        }
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Could not parse AI response into valid questions');
      }

      // Persist to Firestore history/cache
      try {
        const chapterDocRef = getChapterDocRef();

        const normalizedQuestions = questions
          .filter((q) => q && (typeof q.question === 'string' || typeof q.answer === 'string'))
          .map((q, i) => ({
            id: q?.id || `${Date.now()}-${i}`,
            question: typeof q?.question === 'string' ? q.question : '',
            marks: q?.marks ?? q?.mark ?? 1,
            answer: typeof q?.answer === 'string' ? q.answer : (q?.step_by_step_answer ?? '')
          }));

        const sessionsColRef = collection(chapterDocRef, 'sessions');
        const sessionDocRef = doc(sessionsColRef, sessionId);

        await setDoc(sessionDocRef, {
          sessionId,
          createdAt: serverTimestamp(),
          questions: normalizedQuestions,
          subject,
          chapter,
          board,
          classLevel,
        });

        await setDoc(
          chapterDocRef,
          {
            questions: normalizedQuestions,
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
      } catch (persistErr) {
        console.error('Failed to persist AI PYQ history:', persistErr);
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

  const toggleAnswer = (id) => {
    setShowAnswers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const processInlineFormatting = (text) => {
    if (!text) return null;

    const parts = String(text).split(/(\[BOLD\][\s\S]*?\[\/BOLD\]|\$\$[\s\S]*?\$\$)/g);

    return parts.map((part, i) => {
      if (!part) return null;

      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2).trim();
        return (
          <span
            key={i}
            style={{
              backgroundColor: primaryColor + '15',
              color: primaryColor,
              border: `1px solid ${primaryColor}40`,
              borderRadius: 10,
              padding: '8px 12px',
              display: 'inline-block',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: 13
            }}
          >
            {`$$${formula}$$`}
          </span>
        );
      }

      if (part.includes('[BOLD]') && part.includes('[/BOLD]')) {
        const content = part.replace('[BOLD]', '').replace('[/BOLD]', '');
        return (
          <strong key={i} style={{ color: primaryColor, fontWeight: 800 }} className="text-lg px-1">
            {content}
          </strong>
        );
      }

      return <span key={i}>{part}</span>;
    });
  };

  const formatAnswer = (text) => {
    if (!text) return 'Detailed solution loading...';

    const normalized = String(text).replace(/\/\//g, '\n');
    const lines = normalized.split('\n');

    return lines.map((line, idx) => (
      <p key={idx} className="leading-relaxed my-2 text-base">
        {processInlineFormatting(line.trim())}
      </p>
    ));
  };

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
              onClick={() => setShowHistory(s => !s)}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-3 font-black rounded-2xl shadow-xl transition-all hover:opacity-90 disabled:opacity-70"
              style={{
                background: `linear-gradient(to right, ${primaryColor}20, ${primaryColor}10)`,
                border: `1px solid ${primaryColor}50`,
                color: primaryColor
              }}
              aria-label="History"
              title="Previously generated questions for this chapter"
            >
              <FaHistory size={18} />
              {showHistory ? 'Hide History' : 'History'}
            </button>

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

          {showHistory && (
            <div className="p-6 rounded-3xl border backdrop-blur-xl" style={{ borderColor: primaryColor + '30', backgroundColor: primaryColor + '10' }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-black" style={{ color: primaryColor }}>Previously generated for this chapter</h4>
                <span className="text-xs font-bold" style={{ color: primaryColor + 'cc' }}>{cachedQuestions?.length || 0}</span>
              </div>

              {cacheLoaded ? (
                cachedQuestions?.length > 0 ? (
                  <div className="space-y-4">
                    {cachedQuestions.map((q, idx) => {
                      const qId = q?.id || idx;
                      return (
                        <div
                          key={qId}
                          className="w-full p-4 rounded-2xl border"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderColor: primaryColor + '25'
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-black" style={{ color: primaryColor }}>Q{idx + 1}</span>
                            <span className="text-xs font-bold" style={{ color: primaryColor + 'cc' }}>[{q?.marks || 1} Marks]</span>
                          </div>
                          <div className="text-sm leading-relaxed" style={{ color: theme?.text || '#fff' }}>
                            {q?.question ? <span>{processInlineFormatting(q.question)}</span> : 'Question'}
                          </div>

                          <div className="mt-4 flex gap-3">
                            <button
                              onClick={() => toggleAnswer(qId)}
                              className="px-4 py-2 text-white font-black rounded-xl transition-all flex-1"
                              style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)` }}
                            >
                              {showAnswers[qId] ? 'Hide Answer' : 'Show Answer'}
                            </button>

                            {onAskAI && (
                              <button
                                onClick={() => onAskAI(q)}
                                className="px-4 py-2 font-black rounded-xl transition-all"
                                style={{
                                  background: `linear-gradient(to right, ${primaryColor}20, ${primaryColor}10)`,
                                  border: `1px solid ${primaryColor}50`,
                                  color: primaryColor
                                }}
                                title="Ask AI for solution/explanation"
                              >
                                Ask AI
                              </button>
                            )}
                          </div>

                          <AnimatePresence>
                            {showAnswers[qId] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4"
                              >
                                <div className="p-4 rounded-2xl border" style={{ borderColor: primaryColor + '30', background: primaryColor + '10' }}>
                                  <div className="font-black mb-3" style={{ color: primaryColor }}>Solution</div>
                                  <div className={`text-base leading-relaxed whitespace-pre-wrap ${textMuted}`}>
                                    {formatAnswer(q?.answer || q?.step_by_step_answer)}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <FaBrain className="text-6xl opacity-30 mx-auto mb-4" style={{ color: primaryColor }} />
                    <h3 className="text-xl font-black mb-2" style={{ color: primaryColor }}>No history found</h3>
                    <p className={textMuted}>Generate PYQs and they will show up here.</p>
                  </div>
                )
              ) : (
                <div className="py-10">
                  <div className="flex items-center justify-center">
                    <div className="w-10 h-10 border-4 rounded-full animate-spin mr-4" style={{ borderColor: primaryColor + '30', borderTopColor: primaryColor }} />
                    <div>
                      <p className="font-bold" style={{ color: primaryColor }}>Loading history...</p>
                      <p className="text-sm" style={{ color: primaryColor + '70' }}>Checking cached PYQs</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!showHistory && (
            <>
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
                    Click Generate to create <br />
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
                    {pyqs.map((q, index) => {
                      const qId = q?.id || index;
                      return (
                        <motion.div
                          key={qId}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`group bg-gradient-to-br ${cardBg} backdrop-blur-xl rounded-2xl p-8 border ${borderColor} transition-all`}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = primaryColor + '40';
                            e.currentTarget.style.boxShadow = `0 0 30px ${primaryColor}30`;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '';
                            e.currentTarget.style.boxShadow = '';
                          }}
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
                              onClick={() => toggleAnswer(qId)}
                              className="flex-1 flex items-center justify-center gap-3 py-4 px-8 text-white font-black rounded-2xl shadow-2xl transition-all uppercase tracking-wide hover:opacity-90"
                              style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)` }}
                            >
                              {showAnswers[qId] ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                              {showAnswers[qId] ? 'Hide Answer' : 'Show Answer'}
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
                              >
                                <FaBrain size={16} />
                                <span className="hidden sm:inline">Ask AI</span>
                              </button>
                            )}
                          </div>

                          <AnimatePresence>
                            {showAnswers[qId] && (
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
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AIPyqGenerator;

