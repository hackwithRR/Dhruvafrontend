return (
  <div
    className={`flex h-[100dvh] w-full ${activeTheme.bg} ${activeTheme.text} overflow-hidden font-sans`}
  >
    <ToastContainer theme="dark" />

    {/* --- 💎 FULL VOICE OVERLAY --- */}
    <AnimatePresence>
      {isLiveMode && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-between py-20 px-6"
        >
          <div className="text-center">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
              {subject}
            </h1>
            <p className="text-xs font-bold text-white/20 uppercase tracking-widest mt-2">
              {chapter || "Neural Link Active"}
            </p>
          </div>

          <div className="relative w-64 h-64 border border-white/10 rounded-full flex items-center justify-center bg-white/[0.02]">
            <div className="flex items-end gap-2 h-16">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: isAiSpeaking
                      ? [10, 60, 10]
                      : isListening
                      ? [10, 30, 10]
                      : 4
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    delay: i * 0.1
                  }}
                  className="w-3 bg-indigo-500 rounded-full"
                />
              ))}
            </div>
          </div>

          <button
            onClick={toggleLiveMode}
            className="px-10 py-5 bg-white/5 hover:bg-red-500/20 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] transition-colors"
          >
            Disconnect Link
          </button>
        </motion.div>
      )}
    </AnimatePresence>

    {/* --- 🛠️ SIDEBAR --- */}
    <AnimatePresence>
      {showSidebar && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSidebar(false)}
            className="fixed inset-0 bg-black/60 z-[450] backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            className="fixed inset-y-0 left-0 w-80 bg-[#080808] border-r border-white/10 z-[451] p-8 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-10">
              <FaBrain className="text-indigo-500" size={24} />
              <h3 className="text-xl font-black uppercase tracking-tighter">
                Dhruva Core
              </h3>
            </div>

            <div className="flex-1 space-y-6">
              <div className="p-6 rounded-3xl bg-indigo-600/5 border border-indigo-500/20">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    Current Level
                  </div>
                  <FaTrophy className="text-indigo-500 opacity-50" />
                </div>
                <div className="text-3xl font-black tracking-tighter mb-4">
                  LVL {Math.floor(userData.xp / 1000) + 1}
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{
                      width: `${Math.min(
                        (userData.dailyXp / 500) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
                <div className="text-[9px] text-white/30 uppercase mt-2 text-right">
                  {userData.dailyXp} / 500 Daily XP
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase opacity-20 tracking-widest px-2">
                  Top Scholars
                </label>
                {leaderboard.map((u, i) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold ${
                          i === 0 ? "text-yellow-500" : "opacity-30"
                        }`}
                      >
                        0{i + 1}
                      </span>
                      <span className="text-xs font-bold truncate w-24 uppercase">
                        {u.displayName || "User"}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-indigo-500">
                      {u.xp}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                auth.signOut();
                navigate("/login");
              }}
              className="w-full p-5 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-red-500/10"
            >
              <FaSignOutAlt /> Logout
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* --- 📟 MAIN INTERFACE --- */}
    <div className="flex-1 flex flex-col relative h-full">
      <Navbar currentUser={currentUser} userData={userData} />
      /* ===========================
   XP + LEVEL HELPERS
=========================== */

const getLevelFromXP = (xp) => Math.floor(xp / 100) + 1;

const incrementXP = async (amount = 10) => {
  if (!user) return;
  const newXP = (userData?.xp || 0) + amount;

  await updateDoc(doc(db, "users", user.uid), {
    xp: newXP,
    level: getLevelFromXP(newXP),
    lastActive: serverTimestamp(),
  });
};

/* ===========================
   SESSION SAVE / LOAD
=========================== */

const saveSession = async () => {
  if (!user || !messages.length) return;

  await addDoc(collection(db, "sessions"), {
    uid: user.uid,
    messages,
    subject,
    chapter,
    createdAt: serverTimestamp(),
  });

  toast.success("Session saved");
};

const loadSession = (session) => {
  setMessages(session.messages || []);
  setShowSessions(false);
};

const deleteSession = async (id) => {
  await deleteDoc(doc(db, "sessions", id));
  toast.info("Session deleted");
};

/* ===========================
   LIVE VOICE TOGGLE
=========================== */

const startLiveMode = () => {
  if (!liveEnabled) return;
  setLiveMode(true);
};

const stopLiveMode = () => {
  setLiveMode(false);
  window.speechSynthesis.cancel();
};

/* ===========================
   IMAGE UPLOAD
=========================== */

const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => setImagePreview(reader.result);
  reader.readAsDataURL(file);
};

/* ===========================
   QUICK REPLIES
=========================== */

const quickReplies = [
  "Explain simply",
  "Give example",
  "Quiz me",
  "Important points",
];

/* ===========================
   MAIN JSX RETURN
=========================== */

return (
  <div className="app-root">

    {/* NAVBAR – RESTORED */}
    <Navbar onSave={saveSession} onSessions={() => setShowSessions(true)} />

    {/* SIDEBAR */}
    <Sidebar>
      <div className="xp-card">
        <h3>Level {userData?.level || 1}</h3>
        <progress value={userData?.xp || 0} max={100} />
      </div>

      <button onClick={() => auth.signOut()}>Logout</button>
    </Sidebar>

    {/* CHAT AREA */}
    <main className="chat-area">
      <AnimatePresence>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={msg.role}
          >
            {msg.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* QUICK REPLIES */}
      <div className="quick-replies">
        {quickReplies.map((q) => (
          <button key={q} onClick={() => sendMessage(q)}>
            {q}
          </button>
        ))}
      </div>

      {/* INPUT BAR */}
      <div className="input-bar">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
        />

        <input type="file" onChange={handleImageUpload} />

        <button onClick={() => sendMessage(input)}>Send</button>
      </div>
    </main>

    {/* SESSION MODAL */}
    <AnimatePresence>
      {showSessions && (
        <SessionModal
          sessions={sessions}
          onLoad={loadSession}
          onDelete={deleteSession}
          onClose={() => setShowSessions(false)}
        />
      )}
    </AnimatePresence>

    {/* LIVE VOICE OVERLAY */}
    <AnimatePresence>
      {liveMode && (
        <motion.div
          className="live-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="avatar-ring" />
          <button onClick={stopLiveMode}>Exit</button>
        </motion.div>
      )}
    </AnimatePresence>

    <ToastContainer />
  </div>
);
      /* ===========================
   FIRESTORE LISTENERS
=========================== */

useEffect(() => {
  if (!currentUser) return;

  // User XP + profile
  const unsubUser = onSnapshot(
    doc(db, "users", currentUser.uid),
    (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
      }
    }
  );

  // Leaderboard
  const q = query(
    collection(db, "users"),
    orderBy("xp", "desc"),
    limit(5)
  );

  const unsubLeaderboard = onSnapshot(q, (snap) => {
    setLeaderboard(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    );
  });

  return () => {
    unsubUser();
    unsubLeaderboard();
  };
}, [currentUser]);

/* ===========================
   SESSION HISTORY (VAULT)
=========================== */

useEffect(() => {
  if (!currentUser) return;

  const q = query(
    collection(db, "users", currentUser.uid, "sessions"),
    orderBy("lastUpdate", "desc"),
    limit(20)
  );

  const unsub = onSnapshot(q, (snap) => {
    setSessions(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    );
  });

  return unsub;
}, [currentUser]);

/* ===========================
   TIMER (SESSION LENGTH)
=========================== */

useEffect(() => {
  const timer = setInterval(() => {
    setTimer((t) => t + 1);
  }, 1000);

  return () => clearInterval(timer);
}, []);

/* ===========================
   SCROLL TO BOTTOM
=========================== */

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages]);

/* ===========================
   END OF COMPONENT
=========================== */

export default Chat;
