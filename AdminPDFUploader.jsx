import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUpload, FaFilePdf, FaFolderOpen, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import ClickSpark from './ClickSpark';
import { getBoards, getClasses, getSubjects, getChapters, uploadSyllabusMaterial, getMaterials } from '../utils/adminAuth';

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
  const [category, setCategory] = useState('notes');
  const categories = ['notes', 'pyqs', 'cheatsheets'];

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
      // Standardize the filename automatically before upload
      const type = pyqMode ? 'pyqs' : category;
      const safeChapter = chapter.trim().replace(/[^a-z0-9]/gi, '_').toUpperCase();
      const autoName = `${classLevel}_${board.toUpperCase()}_${subject.toUpperCase()}_${safeChapter}_${type.toUpperCase()}.pdf`;
      
      // Create a new File object with the standardized name
      const renamedFile = new File([file], autoName, { type: file.type });

      const base64Data = await uploadSyllabusMaterial(renamedFile, {
        board,
        classLevel: String(classLevel),
        subject,
        chapter,
        type
      });

      setUploadUrl(base64Data);
    
      // Success feedback
      setStatus('success');
      listUploadedFiles(); // Refresh history immediately after upload
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
      // Broaden the search to show most recent uploads for this mode (Notes or PYQs)
      // This ensures the history shows items even if current dropdowns don't match
      const materials = await getMaterials({
        type: pyqMode ? 'pyqs' : category
      });
      
      // Client-side sort by timestamp to avoid index requirements
      const sorted = (materials || [])
        .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
        .slice(0, 10);

      setUploadedFiles(sorted.map(m => ({
        ...m,
        path: `${m.board}/${m.classLevel}/${m.subject}/${m.type}/${m.chapter}`,
        url: m.content
      })));
    } catch (error) {
      console.error('List files failed:', error);
    }
  };

  // Load files on mount and mode change
  useEffect(() => {
    listUploadedFiles();
  }, [pyqMode, board, classLevel, subject, category]);

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
          <div>
            <label className="block text-sm font-medium mb-2 opacity-75">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-4 bg-black/30 border border-white/20 rounded-2xl focus:ring-2 ring-primary-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'pyqs' ? 'pyqs' : c}
                </option>
              ))}
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
              Upload PDF to Firestore (Base64)
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
              View Uploaded Base64 Document
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
              className="p-6 bg-black/40 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group relative overflow-hidden"
              whileHover={{ y: -4 }}
            >
              {/* Version Badge */}
              <div className="absolute top-2 right-2 px-2 py-1 bg-primary-500/20 text-primary-400 text-[10px] font-black rounded-lg border border-primary-500/30">
                V{f.version || 1}
              </div>

              <div className="flex items-center gap-3 mb-3">
                <FaFilePdf className="text-red-400 text-xl" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" title={f.fileName || f.chapter}>
                    {f.fileName || f.chapter}
                  </div>
                  <div className="font-mono text-[10px] opacity-50 truncate">
                    {f.path}
                  </div>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                <div className="text-[11px] opacity-70 flex justify-between">
                  <span>Updated:</span>
                  <span className="font-medium text-white/90">
                    {f.updatedAt?.toDate ? f.updatedAt.toDate().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
                  </span>
                </div>
                <div className="text-[11px] opacity-70 flex justify-between">
                  <span>Size:</span>
                  <span className="font-medium text-white/90">{f.fileSize ? `${(f.fileSize / 1024).toFixed(1)} KB` : 'N/A'}</span>
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
