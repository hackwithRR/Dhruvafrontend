import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, listAll } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminContext';
import { adminLogout } from '../utils/adminOTP';
import { useAuth } from '../context/AuthContext';
import AdminRemadeShell from '../components/admin-ui/AdminRemadeShell';
import AdminPDFUploader from '../components/AdminPDFUploader';
import AdminCreateIssueSection from '../components/admin-ui/AdminCreateIssueSection';
import Background from '../components/Background';
import ClickSpark from '../components/ClickSpark';

import { FaChartBar, FaFilePdf, FaExclamationTriangle, FaUsers, FaPlus, FaTrash, FaPhone, FaBookOpen, FaTriangleExclamation } from 'react-icons/fa';

// Icons used by AdminRemadeShell (and some inline fallbacks)
// These are imported here to avoid eslint no-undef errors.


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

  const onAddIssue = async () => {
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
  };

  const onDeleteIssue = async (issueId) => {
    try {
      await deleteDoc(doc(db, 'issues', issueId));
    } catch (e) {
      console.error('Failed to delete issue', e);
    }
  };

  const normalizeIssueStatus = (s) => {
    if (!s) return 'open';
    const v = String(s).toLowerCase();
    if (v === 'closed') return 'closed';
    return 'open';
  };

  const setIssueStatus = async (issueId, nextStatus) => {
    const canonical = normalizeIssueStatus(nextStatus);
    try {
      await updateDoc(doc(db, 'issues', issueId), {
        status: canonical,
        statusHistory: arrayUnion({
          status: canonical,
          // arrayUnion cannot reliably store serverTimestamp() in all configurations.
          // Use client timestamp to avoid: "Function arrayUnion() called with invalid data. serverTimestamp() can only be used with update() and set()".
          changedAt: Date.now(),
          changedBy: adminPhone,
        }),
      });
    } catch (e) {
      console.error('Failed to set issue status', e);
    }
  };

  const onToggleIssueStatus = async (issueId) => {
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return;
    const current = normalizeIssueStatus(issue.status);
    const nextStatus = current === 'open' ? 'closed' : 'open';
    await setIssueStatus(issueId, nextStatus);
  };

  return (
    <ClickSpark sparkColor="#00ffff" sparkCount={16} sparkRadius={30} global>
      <Background theme="Cyberpunk" />

      <AdminRemadeShell
        themeColors={themeColors}
        adminPhone={adminPhone}
        activeSection={activeTab}
        setActiveSection={setActiveTab}
        stats={stats}
        issues={issues}
        newIssue={newIssue}
        setNewIssue={setNewIssue}
        adminPhones={adminPhones}
        setAdminPhones={setAdminPhones}
        newAdminPhone={newAdminPhone}
        setNewAdminPhone={setNewAdminPhone}
        isSuperAdmin={adminPhone === '+919148860082'}
        onAddIssue={onAddIssue}
        onDeleteIssue={onDeleteIssue}
        onAddAdminPhone={addAdminPhone}
        onRemoveAdminPhone={removeAdminPhone}
        onToggleIssueStatus={onToggleIssueStatus}
      />
    </ClickSpark>
  );
};

export default AdminPanel;

