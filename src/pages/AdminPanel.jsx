import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaFilePdf, FaExclamationTriangle, FaPhone, FaSignOutAlt, FaChartBar } from 'react-icons/fa';
import { useAdminAuth } from '../context/AdminContext';
import { adminLogout } from '../utils/adminOTP';
import AdminPDFUploader from '../components/AdminPDFUploader';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, listAll } from 'firebase/storage';
import { db, storage } from '../firebase';
import AdminNavbar from '../components/AdminNavbar';
import Background from '../components/Background';
import ClickSpark from '../components/ClickSpark';
import BorderGlow from '../components/BorderGlow';
import RippleEffect from '../components/RippleEffect';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
  const { adminPhone, adminUser } = useAdminAuth();
  const { userData, theme } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ users: 0, pdfs: 0, issues: 0 });
  const [issues, setIssues] = useState([]);
  const [newIssue, setNewIssue] = useState('');
  const [adminPhones, setAdminPhones] = useState(['+919876543210', '+919123456789']);
  const [newAdminPhone, setNewAdminPhone] = useState('');

  // Theme mapping from AuthContext theme string
  const themes = {
    DeepSpace: { primaryHex: "#4f46e5", isDark: true },
    Light: { primaryHex: "#4f46e5", isDark: false },
    Cyberpunk: { primaryHex: "#06b6d4", isDark: true },
    // Add more as needed
    default: { primaryHex: "#4f46e5", isDark: true }
  };
  const currentTheme = themes[theme] || themes.default;
  const themeColors = {
    primary: currentTheme.primaryHex,
    text: currentTheme.isDark ? '#ffffff' : '#000000',
    textSecondary: currentTheme.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
    bgCard: currentTheme.isDark ? 'rgba(10,10,15,0.95)' : 'rgba(255,255,255,0.95)',
    border: currentTheme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
  };

  // Real-time stats & issues listener
  useEffect(() => {
    // User count
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snap) => {
      setStats(prev => ({ ...prev, users: snap.size }));
    }, (err) => {
      console.warn('Admin users listener blocked:', err?.code || err?.message || err);
      setStats(prev => ({ ...prev, users: 0 }));
    });

    // PDF count from storage
// eslint-disable-next-line no-undef
const countPDFs = async () => {
      try {
        // eslint-disable-next-line no-undef
        const syllabusRef = ref(storage, 'syllabus/');
        // eslint-disable-next-line no-undef
        const pyqsRef = ref(storage, 'pyqs/');
        const [syllabusRes, pyqsRes] = await Promise.all([listAll(syllabusRef), listAll(pyqsRes)]);
        const totalPDFs = syllabusRes.items.length + pyqsRes.items.length;
        setStats(prev => ({ ...prev, pdfs: totalPDFs }));
      } catch (err) {
        console.log('PDF count error:', err);
      }
    };
    countPDFs();

    // Issues
    const issuesQuery = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));
    const unsubscribeIssues = onSnapshot(issuesQuery, (snap) => {
      const issuesList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIssues(issuesList);
      setStats(prev => ({ ...prev, issues: issuesList.length }));
    }, (err) => {
      console.warn('Issues listener blocked:', err?.code || err?.message || err);
      setIssues([]);
      setStats(prev => ({ ...prev, issues: 0 }));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeIssues();
    };
  }, []);

  const handleLogout = async () => {
    await adminLogout();
    navigate('/adminlogin');
  };

  const addAdminPhone = async () => {
    if (newAdminPhone && !adminPhones.includes(newAdminPhone)) {
      setAdminPhones([...adminPhones, newAdminPhone]);
      setNewAdminPhone('');
      // TODO: Save to Firestore adminConfig
    }
  };

  const removeAdminPhone = (phoneToRemove) => {
    setAdminPhones(adminPhones.filter(phone => phone !== phoneToRemove));
    // TODO: Remove from Firestore adminConfig
  };

  const tabs = [
    { id: 'dashboard', icon: FaChartBar, label: 'Dashboard' },
    { id: 'pdfs', icon: FaFilePdf, label: 'PDF Upload' },
    { id: 'issues', icon: FaExclamationTriangle, label: 'Issues' },
    { id: 'members', icon: FaUsers, label: 'Admin Members' }
  ];

  return (
    <ClickSpark sparkColor="#00ffff" sparkCount={16} sparkRadius={30} global>
      <Background theme="Cyberpunk" />
      <AdminNavbar adminPhone={adminPhone} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="p-8 max-w-7xl mx-auto pt-4 relative z-10"> 
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-2xl flex items-center justify-center">
              <FaChartBar className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black" style={{ color: themeColors.text }}>Admin Dashboard</h1>
              <p className="text-lg" style={{ color: themeColors.textSecondary }}>
                Secure Panel • {adminPhone || 'Phone Verified'}
              </p>
            </div>
          </div>
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 px-6 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl font-medium"
          >
            <FaSignOutAlt />
            Logout
          </motion.button>
        </motion.div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all group ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-2xl' 
                  : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
              style={{ borderColor: themeColors.border }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className={`text-2xl ${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`} />
              <span className="font-semibold text-sm">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-8"
        >
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BorderGlow glowColor="220 100 60" glowIntensity={1.2} className="p-8 rounded-3xl text-center cursor-pointer" whileHover={{ rotateX: 8, rotateY: 8, scale: 1.08 }}>
                <FaUsers className="w-16 h-16 mx-auto mb-4 text-blue-400 animate-pulse" />
                <h3 className="text-3xl font-black mb-2" style={{ color: themeColors.text }}>Total Users</h3>
                <p className="text-4xl font-black" style={{ color: themeColors.primary }}>{stats.users}</p>
              </BorderGlow>
              <BorderGlow glowColor="140 100 60" glowIntensity={1.2} className="p-8 rounded-3xl text-center cursor-pointer" whileHover={{ rotateX: -5, rotateY: 10, scale: 1.08 }}>
                <FaFilePdf className="w-16 h-16 mx-auto mb-4 text-green-400 animate-bounce" />
                <h3 className="text-3xl font-black mb-2" style={{ color: themeColors.text }}>PDFs Uploaded</h3>
                <p className="text-4xl font-black" style={{ color: themeColors.primary }}>{stats.pdfs}</p>
              </BorderGlow>
              <BorderGlow glowColor="25 100 60" glowIntensity={1.2} className="p-8 rounded-3xl text-center cursor-pointer" whileHover={{ rotateX: -8, rotateY: -8, scale: 1.08 }}>
                <FaExclamationTriangle className="w-16 h-16 mx-auto mb-4 text-orange-400 animate-spin slow-spin" />
                <h3 className="text-3xl font-black mb-2" style={{ color: themeColors.text }}>Open Issues</h3>
                <p className="text-4xl font-black" style={{ color: themeColors.primary }}>{stats.issues}</p>
              </BorderGlow>
            </div>
          )}

          {activeTab === 'pdfs' && (
            <div style={{ background: themeColors.bgCard, padding: '2rem', borderRadius: '24px', border: `1px solid ${themeColors.border}` }}>
              <h2 className="text-3xl font-black mb-8" style={{ color: themeColors.text }}>📄 Syllabus & PYQ Upload</h2>
              <AdminPDFUploader themeColors={themeColors} />
            </div>
          )}

          {activeTab === 'issues' && (
            <div style={{ background: themeColors.bgCard, padding: '2rem', borderRadius: '24px', border: `1px solid ${themeColors.border}` }}>
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                <input
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  placeholder="Describe new issue..."
                  className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl"
                  style={{ color: themeColors.text }}
                />
                <button
                  onClick={async () => {
                    if (newIssue.trim()) {
                      try {
                        await addDoc(collection(db, 'issues'), {
                          title: newIssue,
                          status: 'open',
                          createdBy: adminPhone,
                          createdAt: serverTimestamp()
                        });
                        setNewIssue('');
                      } catch (error) {
                        console.error('Failed to add issue:', error);
                      }
                    }
                  }}
                  className="px-8 py-4 bg-primary text-white font-black rounded-2xl hover:shadow-xl transition-all"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  Add Issue
                </button>
              </div>
              <div className="space-y-4 max-h-96 overflow-auto">
                {issues.map((issue) => (
                  <motion.div
                    key={issue.id}
                    className="p-6 bg-white/5 rounded-2xl border border-white/10"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold" style={{ color: themeColors.text }}>{issue.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        issue.status === 'open' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {issue.status?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm opacity-75" style={{ color: themeColors.textSecondary }}>
                      By {issue.createdBy} • {issue.createdAt?.toDate ? issue.createdAt.toDate().toLocaleString() : 'Just now'}
                    </p>
                  </motion.div>
                ))}
                {issues.length === 0 && (
                  <p className="text-center py-12 opacity-50" style={{ color: themeColors.textSecondary }}>
                    No issues reported yet 🎉
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div style={{ background: themeColors.bgCard, padding: '2rem', borderRadius: '24px', border: `1px solid ${themeColors.border}` }}>
              <h2 className="text-3xl font-black mb-8" style={{ color: themeColors.text }}>👥 Admin Members</h2>
              <div className="flex gap-4 mb-8">
                <input
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl"
                  style={{ color: themeColors.text }}
                />
                <button
                  onClick={addAdminPhone}
                  className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl transition-all"
                >
                  Add Admin
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminPhones.map((phone) => (
                  <div key={phone} className="p-6 bg-white/5 rounded-2xl flex items-center justify-between border border-white/10">
                    <div className="flex items-center gap-3">
                      <FaPhone className="text-primary" />
                      <span style={{ color: themeColors.text }}>{phone}</span>
                    </div>
                    <button 
                      className="text-red-400 hover:text-red-300 p-1 rounded" 
                      onClick={() => removeAdminPhone(phone)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
  </ClickSpark>
  );
};

export default AdminPanel;
