import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, deleteDoc, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminContext';
import { adminLogout } from '../utils/adminOTP';
import { useAuth } from '../context/AuthContext';
import AdminRemadeShell from '../components/admin-ui/AdminRemadeShell';
import AdminRemadeShellMobile from '../components/admin-ui/AdminRemadeShellMobile';
import AdminPDFUploader from '../components/AdminPDFUploader';
import AdminCreateIssueSection from '../components/admin-ui/AdminCreateIssueSection';
import AdminNavbar from '../components/AdminNavbar';
import Background from '../components/Background';
import ClickSpark from '../components/ClickSpark';
import { toast } from 'react-toastify';


import { FaChartBar, FaFilePdf, FaExclamationTriangle, FaUsers, FaPlus, FaTrash, FaPhone, FaBookOpen, FaTriangleExclamation } from 'react-icons/fa';

// Icons used by AdminRemadeShell (and some inline fallbacks)
// These are imported here to avoid eslint no-undef errors.


const AdminPanel = () => {
  const { adminPhone } = useAdminAuth();
  const { theme } = useAuth();
  const navigate = useNavigate();
  const [adminTheme, setAdminTheme] = useState(theme || 'Phantom'); // Default to Phantom

  const onToggleTheme = () => {
    if (adminTheme === 'RoyalParchment') {
      setAdminTheme('Phantom');
    } else {
      setAdminTheme('RoyalParchment');
    }
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ users: 0, pdfs: 0, issues: 0 });
  const [chartData, setChartData] = useState([]);
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [newIssue, setNewIssue] = useState('');
  const [adminPhones, setAdminPhones] = useState(['+919876543210', '+919123456789']);
  const [newAdminPhone, setNewAdminPhone] = useState('');


  // Theme mapping from AuthContext theme string
  const themes = {
    Phantom: { 
      primary: "#38bdf8", 
      text: "#f8fafc", 
      sub: "rgba(248, 250, 252, 0.65)", 
      border: "rgba(255, 255, 255, 0.12)", 
      card: "rgba(15, 23, 42, 0.9)",
      accent: "#f43f5e",
      graph: {
        total: "#38bdf8",
        open: "#fbbf24",
        closed: "#10b981",
        users: "#818cf8"
      },
      isDark: true 
    },
    RoyalParchment: { 
      primary: "#92400e", 
      text: "#451a03", 
      sub: "rgba(69, 26, 3, 0.65)", 
      border: "rgba(146, 64, 14, 0.2)", 
      card: "rgba(254, 252, 232, 0.95)",
      accent: "#b91c1c",
      graph: {
        total: "#92400e",
        open: "#d97706",
        closed: "#166534",
        users: "#78350f"
      },
      isDark: false 
    },
    Cyberpunk: { 
      primary: "#a855f7", 
      text: "#ffffff", 
      sub: "rgba(255, 255, 255, 0.7)", 
      border: "rgba(255, 255, 255, 0.15)", 
      card: "rgba(10, 10, 15, 0.98)",
      accent: "#00ff88",
      graph: {
        total: "#a855f7",
        open: "#ec4899",
        closed: "#06b6d4",
        users: "#00ff88"
      },
      isDark: true 
    },
    default: { 
      primary: "#38bdf8", 
      text: "#f8fafc", 
      sub: "rgba(248, 250, 252, 0.65)", 
      border: "rgba(255, 255, 255, 0.12)", 
      card: "rgba(15, 23, 42, 0.85)", 
      accent: "#f43f5e",
      graph: { total: "#38bdf8", open: "#fbbf24", closed: "#10b981", users: "#818cf8" },
      isDark: true 
    }
  };
  const currentTheme = themes[adminTheme] || themes.default;
  const themeColors = { 
    ...currentTheme,
    primaryHex: currentTheme.primary,
    bgCard: currentTheme.card,
    textSecondary: currentTheme.sub
  };

  // Real-time stats & issues listener
  useEffect(() => {
    // User count
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snap) => {
      const usersList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
      setStats(prev => ({ ...prev, users: usersList.length }));
    }, (err) => {
      console.warn('Admin users listener blocked:', err?.code || err?.message || err);
      setStats(prev => ({ ...prev, users: 0 }));
    });

    // Real-time PDF count listener
    const pdfsQuery = query(collection(db, 'syllabus_metadata'));
    const unsubscribePDFs = onSnapshot(pdfsQuery, (snap) => {
      setStats(prev => ({ ...prev, pdfs: snap.size }));
    }, (err) => {
      console.warn('PDFs listener blocked:', err);
      setStats(prev => ({ ...prev, pdfs: 0 }));
    });

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
      unsubscribePDFs();
      unsubscribeIssues();
    };
  }, []);

  // Real-time aggregation for Operational Overview Graph (Last 7 Days)
  useEffect(() => {
    const calculateTrends = () => {
      const days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const trendData = days.map(date => {
        const dayStart = new Date(date).setHours(0, 0, 0, 0);
        const dayEnd = new Date(date).setHours(23, 59, 59, 999);

        // Filter issues for this day
        const createdOnDay = issues.filter(issue => {
          const ts = issue.createdAt?.toDate ? issue.createdAt.toDate().getTime() : new Date(issue.createdAt).getTime();
          return ts >= dayStart && ts < dayEnd;
        });

        // Issues resolved today (using statusHistory for accurate throughput)
        const resolvedOnDay = issues.filter(issue => {
          if (issue.status !== 'closed') return false;
          const history = issue.statusHistory || [];
          const lastClosed = [...history].reverse().find(h => h.status === 'closed');
          const ts = lastClosed ? lastClosed.changedAt : null;
          return ts && ts >= dayStart && ts < dayEnd;
        });

        // Backlog: Cumulative open issues at the end of this day
        const totalCreatedUntilEnd = issues.filter(issue => {
          const ts = issue.createdAt?.toDate ? issue.createdAt.toDate().getTime() : new Date(issue.createdAt).getTime();
          return ts <= dayEnd;
        }).length;

        const totalResolvedUntilEnd = issues.filter(issue => {
          if (issue.status !== 'closed') return false;
          const history = issue.statusHistory || [];
          const lastClosed = [...history].reverse().find(h => h.status === 'closed');
          return lastClosed && lastClosed.changedAt <= dayEnd;
        }).length;

        const backlogAtEnd = totalCreatedUntilEnd - totalResolvedUntilEnd;

        const dayUsers = users.filter(user => {
          try {
            if (!user.createdAt) return false;
            // Handle Firestore Timestamp, JS Date, or ISO String
            const createdDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
            const ts = createdDate.getTime();
            return !isNaN(ts) && ts >= dayStart && ts < dayEnd;
          } catch (e) {
            return false;
          }
        });

        return {
          label: date.split('-').slice(1).join('/'), // Format: MM/DD
          total: createdOnDay.length, // New work arriving today
          open: backlogAtEnd, // Current pressure (total active backlog)
          closed: resolvedOnDay.length, // Productivity (resolved today)
          newUsers: dayUsers.length,
          resolutionRate: createdOnDay.length ? Math.round((resolvedOnDay.length / createdOnDay.length) * 100) : (resolvedOnDay.length ? 100 : 0)
        };
      });
      
      setChartData(trendData);
    };

    if (issues.length >= 0 && users.length >= 0) {
      calculateTrends();
    }
  }, [issues, users]);

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
    { id: 'materials', icon: FaFilePdf, label: 'Materials' },
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
    <ClickSpark sparkColor={themeColors.primary} sparkCount={16} sparkRadius={30} global>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="relative"
      >
        <Background theme={adminTheme} />
        
        <div className="min-h-screen flex flex-col relative z-10 w-full overflow-x-hidden">
          <div className="md:hidden">
            <AdminNavbar 
              adminPhone={adminPhone} 
              themeColors={themeColors} 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabs={tabs}
            />
          </div>

          <main className="flex-1">
            {/* Desktop Shell Rendering */}
            <div className="hidden md:block">
              <AdminRemadeShell
                themeColors={themeColors}
                adminPhone={adminPhone}
                activeSection={activeTab}
                setActiveSection={setActiveTab}
                stats={stats}
              chartData={chartData}
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
                onToggleTheme={onToggleTheme}
              />
            </div>

            {/* Mobile Shell Rendering */}
            <div className="md:hidden">
              <AdminRemadeShellMobile
                themeColors={themeColors}
                adminPhone={adminPhone}
                activeSection={activeTab}
                setActiveSection={setActiveTab}
                stats={stats}
              chartData={chartData}
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
                onToggleTheme={onToggleTheme}
              />
            </div>
          </main>
        </div>
      </motion.div>
    </ClickSpark>
  );
};

export default AdminPanel;
