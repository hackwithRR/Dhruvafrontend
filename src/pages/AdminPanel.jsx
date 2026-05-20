import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaUsers, FaFilePdf, FaExclamationTriangle, FaPhone, FaChartBar } from 'react-icons/fa';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, listAll } from 'firebase/storage';

import { db, storage } from '../firebase';
import { useAdminAuth } from '../context/AdminContext';
import { adminLogout } from '../utils/adminOTP';
import AdminPDFUploader from '../components/AdminPDFUploader';
import Background from '../components/Background';
import ClickSpark from '../components/ClickSpark';
import { useAuth } from '../context/AuthContext';

import AdminLayoutShell from '../components/admin-ui/AdminLayoutShell';
import AdminTopBar from '../components/admin-ui/AdminTopBar';
import AdminSideTabs from '../components/admin-ui/AdminSideTabs';
import AdminStatCard from '../components/admin-ui/AdminStatCard';
import AdminInput from '../components/admin-ui/AdminInput';
import AdminButton from '../components/admin-ui/AdminButton';
import AdminEmptyState from '../components/admin-ui/AdminEmptyState';
import IssueCardThread from '../components/admin/IssueCardThread';

const AdminPanel = () => {
  const { adminPhone } = useAdminAuth();
  const { theme } = useAuth();
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
    { id: 'members', icon: FaUsers, label: 'Admin Members' },
  ];


  const panelBackgroundStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${themeColors.border}`,
  };

  return (
    <ClickSpark sparkColor="#00ffff" sparkCount={16} sparkRadius={30} global>
      <Background theme="Cyberpunk" />

      <AdminLayoutShell
        themeColors={themeColors}
        title="Admin Dashboard"
        subtitle={`Secure Panel • ${adminPhone || 'Phone Verified'}`}
        topRight={<AdminTopBar onLogout={handleLogout} themeColors={themeColors} />}
      >
        <AdminSideTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          themeColors={themeColors}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <AdminStatCard
                  icon={FaUsers}
                  title="Total Users"
                  value={stats.users}
                  glowColor="#60a5fa"
                  themeColors={themeColors}
                />
                <AdminStatCard
                  icon={FaFilePdf}
                  title="PDFs Uploaded"
                  value={stats.pdfs}
                  glowColor="#34d399"
                  themeColors={themeColors}
                />
                <AdminStatCard
                  icon={FaExclamationTriangle}
                  title="Open Issues"
                  value={stats.issues}
                  glowColor="#fb923c"
                  themeColors={themeColors}
                />
              </div>
            )}

            {activeTab === 'pdfs' && (
              <div className="rounded-3xl p-6 md:p-8" style={panelBackgroundStyle}>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: `linear-gradient(90deg, ${themeColors.primary}, rgba(168,85,247,0.95))` }}
                  >
                    <FaFilePdf className="text-white text-2xl" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black" style={{ color: themeColors.text }}>
                    Syllabus & PYQ Upload
                  </h2>
                </div>
                <AdminPDFUploader themeColors={themeColors} />
              </div>
            )}

            {activeTab === 'issues' && (
              <div className="rounded-3xl p-6 md:p-8" style={panelBackgroundStyle}>
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                  <div className="flex-1">
                    <AdminInput
                      value={newIssue}
                      onChange={(e) => setNewIssue(e.target.value)}
                      placeholder="Describe new issue..."
                      themeColors={themeColors}
                    />
                  </div>
                  <AdminButton
                    themeColors={themeColors}
                    variant="primary"
                    disabled={!newIssue.trim()}
                    onClick={async () => {
                      if (!newIssue.trim()) return;
                      try {
                        await addDoc(collection(db, 'issues'), {
                          title: newIssue,
                          status: 'open',
                          createdBy: adminPhone,
                          createdAt: serverTimestamp(),
                        });
                        setNewIssue('');
                      } catch (error) {
                        console.error('Failed to add issue:', error);
                      }
                    }}
                  >
                    Add Issue
                  </AdminButton>
                </div>

                <div className="space-y-3 max-h-96 overflow-auto pr-1">
                  {issues.map((issue) => {
                    const isOpen = issue.status === 'open';
                    const complaintId = issue?.complaintId ?? issue?.id ?? '';
                    const screenshotUrl = issue?.screenshotUrl;

                    return (
                      <IssueCardThread
                        key={issue.id}
                        issue={issue}
                        themeColors={themeColors}
                        isOpen={issue.status === 'open'}
                      >
                        <motion.div
                          className="p-5 rounded-2xl border group"
                          style={{
                            borderColor: 'rgba(255,255,255,0.10)',
                            background: 'rgba(255,255,255,0.03)',
                          }}
                          whileHover={{ y: -2 }}
                        >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-bold text-base" style={{ color: themeColors.text }}>
                              {issue.title}
                            </div>

                            {/* Always visible: description (as requested) */}
                            {issue.description ? (
                              <p className="mt-2 text-sm opacity-85" style={{ color: themeColors.textSecondary, lineHeight: 1.4 }}>
                                {issue.description}
                              </p>
                            ) : null}

                            {/* Always visible: screenshot thumbnail/link when present */}
                            {screenshotUrl ? (
                              <div className="mt-3">
                                <a
                                  href={screenshotUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border"
                                  style={{ borderColor: 'rgba(255,255,255,0.10)' }}
                                >
                                  <span className="text-xs font-bold" style={{ color: themeColors.textSecondary }}>
                                    View Screenshot
                                  </span>
                                </a>
                              </div>
                            ) : null}
                          </div>

                          {/* Hide status/id/controls until hover */}
                          <div className="flex flex-col items-end">
                            <span
                              className="px-3 py-1 rounded-full text-[11px] md:text-xs font-bold whitespace-nowrap"
                              style={{
                                background: isOpen ? 'rgba(251,146,60,0.18)' : 'rgba(52,211,153,0.16)',
                                color: isOpen ? '#fb923c' : '#34d399',
                                border: `1px solid ${isOpen ? 'rgba(251,146,60,0.35)' : 'rgba(52,211,153,0.35)'}`,
                                opacity: 0,
                                transform: 'translateY(6px)',
                                transition: 'opacity 160ms ease, transform 160ms ease',
                              }}
                            >
                              {issue.status?.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Hover-expanded details */}
                      <div
                          className="mt-4 opacity-0 translate-y-[6px] group-hover:opacity-100 group-hover:translate-y-0"
                          style={{
                            transition: 'opacity 160ms ease, transform 160ms ease',
                          }}
                        >
                          <div className="text-[11px] opacity-65" style={{ color: themeColors.textSecondary }}>
                            {complaintId ? `ID: ${complaintId}` : ''}
                          </div>

                          <div className="mt-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                            <div className="text-xs font-bold" style={{ color: themeColors.textSecondary }}>
                              {issue.createdByName ? `By ${issue.createdByName}` : `By ${issue.createdBy}`}
                            </div>
                            <div className="flex gap-3">
                              {isOpen ? (
                                <AdminButton
                                  themeColors={themeColors}
                                  variant="red"
                                  onClick={async () => {
                                    try {
                                      const {
                                        doc,
                                        updateDoc,
                                        arrayUnion,
                                      } = await import('firebase/firestore');
                                      const { db } = await import('../firebase');

                                      // Append status-change event to statusHistory
                                      await updateDoc(doc(db, 'issues', issue.id), {
                                        status: 'closed',
                                            statusHistory: arrayUnion({
                                          status: 'closed',
                                          changedAt: serverTimestamp(),
                                          changedBy: adminPhone,
                                        }),
                                      });
                                    } catch (e) {
                                      console.error('Failed to close issue', e);
                                    }
                                  }}
                                >
                                  Close
                                </AdminButton>
                              ) : (
                                <AdminButton
                                  themeColors={themeColors}
                                  variant="green"
                                  onClick={async () => {
                                    try {
                                      const {
                                        doc,
                                        updateDoc,
                                        arrayUnion,
                                      } = await import('firebase/firestore');
                                      const { db } = await import('../firebase');

                                      // Append status-change event to statusHistory
                                      await updateDoc(doc(db, 'issues', issue.id), {
                                        status: 'open',
                                        statusHistory: arrayUnion({
                                          status: 'open',
                                          changedAt: serverTimestamp(),
                                          changedBy: adminPhone,
                                        }),
                                      });
                                    } catch (e) {
                                      console.error('Failed to reopen issue', e);
                                    }
                                  }}
                                >
                                  Re-open
                                </AdminButton>
                              )}
                            </div>
                          </div>

                          {/* Optional full screenshot preview only on hover */}
                          {screenshotUrl ? (
                            <a
                              href={screenshotUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block mt-3 rounded-2xl overflow-hidden border"
                              style={{ borderColor: 'rgba(255,255,255,0.10)', background: 'rgba(0,0,0,0.15)' }}
                            >
                              <img src={screenshotUrl} alt={issue.name || 'issue screenshot'} className="w-full max-h-80 object-contain" />
                            </a>
                          ) : null}
                        </div>

                      </motion.div>
                      </IssueCardThread>
                    );
                  })}


                  {issues.length === 0 && (
                    <AdminEmptyState
                      title="No issues reported yet"
                      description="Add an issue to track reports in real time."
                      icon={<FaExclamationTriangle style={{ color: themeColors.primary }} className="mx-auto text-3xl" />}
                    />
                  )}
                </div>

              </div>
            )}

            {activeTab === 'members' && (
              <div className="rounded-3xl p-6 md:p-8" style={panelBackgroundStyle}>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: `linear-gradient(90deg, ${themeColors.primary}, rgba(168,85,247,0.95))` }}
                  >
                    <FaUsers className="text-white text-2xl" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black" style={{ color: themeColors.text }}>
                    Admin Members
                  </h2>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <AdminInput
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value)}
                      placeholder="+919876543210"
                      themeColors={themeColors}
                    />
                  </div>
                  <AdminButton themeColors={themeColors} variant="green" onClick={addAdminPhone}>
                    Add Admin
                  </AdminButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {adminPhones.map((phone) => (
                    <motion.div
                      key={phone}
                      className="p-5 rounded-2xl border"
                      style={{
                        borderColor: 'rgba(255,255,255,0.10)',
                        background: 'rgba(255,255,255,0.03)',
                      }}
                      whileHover={{ y: -2 }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <FaPhone className="text-primary" style={{ color: themeColors.primary }} />
                          <span style={{ color: themeColors.text }} className="font-semibold">
                            {phone}
                          </span>
                        </div>
                        <AdminButton
                          themeColors={themeColors}
                          variant="red"
                          onClick={() => removeAdminPhone(phone)}
                        >
                          Remove
                        </AdminButton>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </AdminLayoutShell>
    </ClickSpark>
  );
};


export default AdminPanel;
