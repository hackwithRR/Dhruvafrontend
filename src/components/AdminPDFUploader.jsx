import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, uploadBytesResumable, getDownloadURL, listAll } from 'firebase/storage';
import { storage } from '../firebase';
import { FaUpload, FaFilePdf, FaFolderOpen, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import ClickSpark from './ClickSpark';
import { syllabusData, getBoards, getClasses, getSubjects, getChapters } from '../utils/adminAuth';

const AdminPDFUploader = ({ themeColors }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [board, setBoard] = useState('CBSE');
  const [classLevel, setClassLevel] = useState('10');
  const [subject, setSubject] = useState('MATHEMATICS');
  const [chapter, setChapter] = useState('');
  const [pyqMode, setPyqMode] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Dynamic dropdown options
  const boards = getBoards();
  const classes = getClasses(board);
  const subjects = getSubjects(board, classLevel);
  const availableChapters = getChapters(board, classLevel, subject);

  const handleUpload = async () => {
    if (!file || !chapter.trim()) {
      return setError('Please select PDF and chapter');
    }

    setUploading(true);
    setError('');
    
    try {
      const safeChapter = chapter.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
      const path = pyqMode 
        ? `pyqs/${board}/${classLevel}/${subject}/${safeChapter}.pdf`
        : `syllabus/${board}/${classLevel}/${subject}/${safeChapter}.pdf`;
      
      const storageRef = ref(storage, path);

      const maxAttempts = 3;
      let lastError;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const snapshot = await uploadBytesResumable(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          setUploadUrl(url);
          return url;
        } catch (e) {
          lastError = e;
          const code = e?.code;
          const isRetryable = code === 'storage/retry-limit-exceeded' || code === 'storage/unknown' || code === 'storage/server-not-found';
          if (!isRetryable || attempt === maxAttempts) throw e;
          // exponential backoff: 500ms, 1s, 2s
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
        }
      }

      throw lastError;
    
      // Success feedback
      setStatus('success');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.message || 'Upload failed');
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const listUploadedFiles = async () => {
    try {
      const path = pyqMode ? `pyqs/` : `syllabus/`;
      const folderRef = ref(storage, path);
      const result = await listAll(folderRef);
      const urls = await Promise.all(
        result.items.slice(0, 10).map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return { path: itemRef.fullPath, url };
        })
      );
      setUploadedFiles(urls);
    } catch (error) {
      console.error('List files failed:', error);
    }
  };

  // Load files on mount and mode change
  useEffect(() => {
    listUploadedFiles();
  }, [pyqMode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl"
    >
      {/* Upload Form */}
      <div className="p-8 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
        <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
          <FaUpload />
          {pyqMode ? 'PYQ Upload' : 'Syllabus PDF Upload'}
        </h2>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2 opacity-75">Board</label>
            <select 
              value={board} 
              onChange={(e) => setBoard(e.target.value)}
              className="w-full p-4 bg-black/30 border border-white/20 rounded-2xl focus:ring-2 ring-primary-500 focus:border-transparent"
            >
              {boards.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 opacity-75">Class</label>
            <select 
              value={classLevel} 
              onChange={(e) => setClassLevel(e.target.value)}
              className="w-full p-4 bg-black/30 border border-white/20 rounded-2xl focus:ring-2 ring-primary-500"
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 opacity-75">Subject</label>
            <select 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-4 bg-black/30 border border-white/20 rounded-2xl focus:ring-2 ring-primary-500"
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2 opacity-75">Chapter</label>
            <select 
              value={chapter} 
              onChange={(e) => setChapter(e.target.value)}
              className="w-full p-4 bg-black/30 border border-white/20 rounded-2xl focus:ring-2 ring-primary-500"
            >
              <option value="">Select chapter or type custom</option>
              {availableChapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 p-3 bg-black/30 border border-white/20 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
              <FaFilePdf className="text-red-400" />
              <span>{file ? file.name : 'Select PDF'}</span>
            </label>
            <label className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-2xl cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={pyqMode}
                onChange={(e) => setPyqMode(e.target.checked)}
                className="w-5 h-5"
              />
              PYQ Mode
            </label>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl backdrop-blur-sm"
          >
            <p className="text-red-300 font-medium">{error}</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl"
          >
            <p className="text-emerald-300 font-medium flex items-center gap-2">
              <FaCheckCircle />
              Upload successful!
            </p>
          </motion.div>
        )}

<ClickSpark sparkColor="#00ff88">
  <motion.button
    onClick={handleUpload}
    disabled={!file || uploading || !chapter}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="w-full py-6 px-8 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xl rounded-3xl shadow-2xl flex items-center justify-center gap-3 transition-all glow-pulse"
    style={{ backgroundColor: themeColors?.primary || '#10b981' }}
  >
          {uploading ? (
            <>
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <FaUpload />
              Upload PDF to Firebase Storage
            </>
          )}
        </motion.button>
      </ClickSpark>

        {uploadUrl && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-6 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl"
            style={{ backgroundColor: themeColors?.primary + '20', borderColor: themeColors?.primary + '40' }}
          >
            <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: themeColors?.primary + '80' }}>
              <FaFilePdf />
              Upload Successful!
            </h3>
            <a 
              href={uploadUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-300 hover:text-emerald-200 font-mono text-sm break-all block p-2 bg-white/10 rounded-xl"
              style={{ color: themeColors?.primary + '80' }}
            >
              {uploadUrl}
            </a>
          </motion.div>
        )}
      </div>

      {/* Recent Uploads */}
      <div className="p-8 bg-gradient-to-br from-gray-900/30 to-black/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl mt-12">
        <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
          <FaFolderOpen />
          Recent Uploads ({pyqMode ? 'PYQs' : 'Syllabus PDFs'})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uploadedFiles.slice(0, 6).map((f, i) => (
            <motion.div 
              key={f.path} 
              className="p-6 bg-black/20 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
              whileHover={{ y: -4 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <FaFilePdf className="text-red-400 text-xl" />
                <div className="font-mono text-sm opacity-75 truncate" title={f.path}>
                  {f.path.split('/').slice(-2).join('/')}
                </div>
              </div>
              <a 
                href={f.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 font-medium text-sm block"
              >
                📥 Download
              </a>
            </motion.div>
          ))}
          {uploadedFiles.length === 0 && (
            <motion.div 
              className="col-span-full text-center py-20 opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <FaFolderOpen className="w-20 h-20 mx-auto mb-4 text-gray-500" />
              <p>No PDFs uploaded yet. Use the uploader above!</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPDFUploader;

