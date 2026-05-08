import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaFilePdf, FaSearch, FaSpinner, FaExclamationTriangle,
  FaArrowLeft, FaArrowRight, FaCheckCircle
} from 'react-icons/fa';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import HintButton from './HintButton';
import SolutionReveal from './SolutionReveal';

const ClassicQuestionView = ({ theme, board, classLevel, subject, chapter, updateStats }) => {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [solved, setSolved] = useState(false);

  const isDark = theme?.isDark !== false;
  const primaryColor = theme?.primaryHex || "#6366f1";

  // Sample questions for demo when PDF not available
  const sampleQuestions = [
    {
      id: 1,
      text: `Explain the key concepts of <strong>${chapter}</strong> with suitable examples.`,
      marks: 5,
      solution: `<div><strong>📚 Step-by-step Solution:</strong></div><div class="mt-4 space-y-3"><div><strong>1. Definition:</strong> Write the main definition from the chapter</div><div><strong>2. Key Points:</strong> List 3-4 important points</div><div><strong>3. Example:</strong> Provide a relevant example</div><div><strong>4. Diagram:</strong> Draw and label the diagram</div></div><div class="mt-4 p-3 bg-green-100 rounded-lg text-sm"><strong>Marks Distribution:</strong> Definition(1) + Points(2) + Example(1) + Diagram(1) = 5 Marks</div>`
    },
    {
      id: 2,
      text: `Derive the formula for ${chapter} and explain each term.`,
      marks: 3,
      solution: `<div><strong>📝 Derivation:</strong></div><div class="mt-4 space-y-3"><div><strong>Step 1:</strong> Start with the basic equation</div><div><strong>Step 2:</strong> Apply the relevant principle</div><div><strong>Step 3:</strong> Simplify and get final formula</div></div><div class="mt-4 p-3 bg-blue-100 rounded-lg text-sm"><strong>Important:</strong> Remember to mention all assumptions and define each variable.</div>`
    },
    {
      id: 3,
      text: `Compare and contrast the important aspects of ${chapter}.`,
      marks: 5,
      solution: `<div><strong>📊 Comparison Table:</strong></div><table class="mt-4 w-full border"><tr><th>Aspect 1</th><th>Aspect 2</th></tr><tr><td>Point 1</td><td>Point 2</td></tr></table><div class="mt-4 p-3 bg-amber-100 rounded-lg text-sm"><strong>Tip:</strong> Use tables for comparison questions in board exams.</div>`
    }
  ];

  const [questions, setQuestions] = useState(sampleQuestions);

  // Fetch PDF from Firebase Storage
  const fetchPyqPdf = async () => {
    if (!subject || !chapter) return;

    setLoading(true);
    setError('');

    try {
      const safeChapter = chapter.replace(/[^a-z0-9]/gi, '_');
      const safeSubject = subject.replace(/[^a-z0-9]/gi, '_');
      const path = `pyqs/${board}/${classLevel}/${safeSubject}/${safeChapter}.pdf`;

      console.log('Fetching PYQ PDF:', path);
      const storageRef = ref(storage, path);

      try {
        const url = await getDownloadURL(storageRef);
        setPdfUrl(url);
        // In a full implementation, parse PDF content here
        setError('');
      } catch (err) {
        // PDF doesn't exist - use sample questions
        setQuestions(sampleQuestions.map(q => ({
          ...q,
          text: q.text.replace('${chapter}', chapter)
        })));
        setError(`No PDF found for "${chapter}". Showing sample questions.`);
      }

    } catch (err) {
      console.error('PDF fetch error:', err);
      setQuestions(sampleQuestions.map(q => ({
        ...q,
        text: q.text.replace('${chapter}', chapter)
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chapter && subject) {
      fetchPyqPdf();
    }
  }, [chapter, subject, board, classLevel]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleSolutionReveal = () => {
    if (!solved && currentQuestion) {
      setSolved(true);
      updateStats?.({ solved: solved + 1, score: (updateStats?.score || 0) + currentQuestion.marks * 2 });
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center p-20 rounded-3xl border-2 border-dashed text-center min-h-[400px]"
        style={{
          borderColor: primaryColor + '30',
          color: theme?.text + '40' || 'rgba(255,255,255,0.4)'
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)`,
            boxShadow: `0 0 30px ${primaryColor}40`
          }}
        >
          <FaSpinner className="text-white text-2xl" />
        </motion.div>
        <p className="text-lg font-bold mb-2" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
          Loading PYQ PDF...
        </p>
        <p className="text-sm" style={{ color: theme?.text + '60' || 'rgba(255,255,255,0.5)' }}>
          Fetching chapter-wise questions from storage
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Question Navigator */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-white/20 backdrop-blur-xl border"
        style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
              Q{currentQuestionIndex + 1}
            </span>
            <div className="h-8 w-px" style={{ background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
            <span className="text-sm font-medium" style={{ color: theme?.text + '70' || 'rgba(255,255,255,0.6)' }}>
              {questions.length} Questions
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
          >
            <FaArrowLeft size={16} style={{ color: theme?.text }} />
          </motion.button>

          <span className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{
              background: primaryColor + '20',
              color: primaryColor,
              border: `1px solid ${primaryColor}40`
            }}>
            [{currentQuestion?.marks} Marks]
          </span>

          <motion.button
            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
          >
            <FaArrowRight size={16} style={{ color: theme?.text }} />
          </motion.button>
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion ? (
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-8 rounded-3xl border-2 shadow-2xl bg-white/30 backdrop-blur-xl"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
        >
          <div className="prose prose-lg max-w-none leading-relaxed mb-8" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
            <div dangerouslySetInnerHTML={{ __html: currentQuestion.text }} />
          </div>

          {/* Solution with Hint System */}
          <div className="border-t pt-6" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
                Need Help?
              </h4>
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

            {hintCount > 0 && (
              <SolutionReveal
                solution={currentQuestion.solution}
                theme={theme}
                hintCount={hintCount}
              />
            )}

            {hintCount === 0 && (
              <p className="text-sm text-center py-4" style={{ color: theme?.text + '60' || 'rgba(255,255,255,0.5)' }}>
                💡 Click "Get Hint" for progressive help, or try solving first!
              </p>
            )}
          </div>
        </motion.div>
      ) : error ? (
        <motion.div
          className="p-12 rounded-3xl border-2 text-center min-h-[400px] flex flex-col items-center justify-center"
          style={{ borderColor: '#ef444430', backgroundColor: '#ef444410' }}
        >
          <FaExclamationTriangle className="text-5xl text-orange-500 mb-6" />
          <h3 className="text-xl font-bold mb-4" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
            No Questions Found
          </h3>
          <p className="text-sm mb-6" style={{ color: theme?.text + '80' || 'rgba(255,255,255,0.7)' }}>{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchPyqPdf}
            className="px-8 py-3 rounded-2xl font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Retry
          </motion.button>
        </motion.div>
      ) : null}

      {/* PDF Download (if available) */}
      {pdfUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border flex items-center justify-between"
          style={{
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/20">
              <FaFilePdf className="text-red-500" size={20} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
                Full PDF Available
              </p>
              <p className="text-xs" style={{ color: theme?.text + '60' || 'rgba(255,255,255,0.5)' }}>
                Download complete PYQ paper
              </p>
            </div>
          </div>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Download PDF
          </a>
        </motion.div>
      )}
    </div>
  );
};

export default ClassicQuestionView;
