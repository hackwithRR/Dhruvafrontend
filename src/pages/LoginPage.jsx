import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { FaShieldAlt, FaArrowRight, FaGoogle, FaEnvelope, FaLock, FaFingerprint, FaTimes, FaInbox, FaExclamationTriangle } from "react-icons/fa";
import Background from "../components/Background";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

// --- ADDED FOR DEPLOYMENT ---
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // States for Reset Logic
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await login(email, password);
      setIsVerified(true);
      setTimeout(() => navigate("/chat"), 2200);
    } catch (err) {
      toast.error("❌ Access Denied: Invalid Credentials");
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) return toast.warn("Enter your Node ID (Email)");
    setIsResetting(true);
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setShowResetModal(false);
      setShowSuccessModal(true); // Trigger the "Check Spam" Modal
    } catch (err) {
      toast.error("❌ Neural Link Failed: Email not found");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 relative selection:bg-fuchsia-500/40 overflow-hidden">
      <Background />
      <ToastContainer theme="dark" position="bottom-right" />

      {/* --- RESET INPUT MODAL --- */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl px-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[#0a0a0c] border border-white/10 p-10 rounded-[3rem] w-full max-w-md relative shadow-[0_0_80px_rgba(217,70,239,0.15)]"
            >
              <button onClick={() => setShowResetModal(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-all"><FaTimes /></button>
              <div className="mb-8">
                <h3 className="text-2xl font-[1000] text-white italic uppercase tracking-tighter">Initiate Recovery</h3>
                <p className="text-[9px] text-fuchsia-400/60 font-black uppercase tracking-[0.3em] mt-2">Node Identification Required</p>
              </div>
              <form onSubmit={handlePasswordReset} className="space-y-8">
                <div className="relative group">
                  <FaEnvelope className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-fuchsia-400 transition-all" />
                  <input
                    type="email"
                    placeholder="ENTER REGISTERED EMAIL"
                    className="w-full bg-transparent border-b border-white/10 py-5 pl-10 outline-none text-white text-sm font-bold tracking-widest focus:border-fuchsia-500 transition-all placeholder:text-white/10"
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#fff", color: "#000" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isResetting}
                  className="w-full py-5 bg-fuchsia-600/10 border border-fuchsia-500/50 text-fuchsia-400 font-black text-[10px] tracking-[0.4em] uppercase rounded-2xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.2)]"
                >
                  {isResetting ? "TRANSMITTING..." : "SEND RESET PROTOCOL"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SUCCESS / SPAM INSTRUCTION MODAL --- */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-3xl px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-sm p-10 bg-white/[0.02] border border-white/10 rounded-[3.5rem] shadow-[0_0_100px_rgba(255,255,255,0.05)]"
            >
              <div className="w-20 h-20 bg-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-fuchsia-500/40">
                <FaInbox className="text-3xl text-fuchsia-500 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Transmission Sent</h2>
              <p className="text-xs text-white/60 font-medium leading-relaxed mb-8">
                Neural reset protocols have been dispatched to your terminal.
                <br /><br />
                <span className="text-fuchsia-400 font-black flex items-center justify-center gap-2">
                  <FaExclamationTriangle /> CRITICAL:
                </span>
                If not found in your Inbox, check your <span className="text-white font-bold underline decoration-fuchsia-500 underline-offset-4">SPAM</span> and <span className="text-white font-bold underline decoration-fuchsia-500 underline-offset-4">TRASH</span> folders immediately.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowSuccessModal(false)}
                className="px-10 py-4 bg-white text-black font-black text-[10px] tracking-[0.3em] uppercase rounded-full shadow-2xl"
              >
                Acknowledged
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUCCESS OVERLAY */}
      <AnimatePresence>
        {isVerified && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl px-6"
          >
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-t-2 border-fuchsia-500 rounded-full shadow-[0_0_30px_rgba(217,70,239,0.5)]"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaFingerprint className="text-4xl sm:text-5xl md:text-6xl text-white animate-pulse" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase">Authorized</h2>
              <p className="text-fuchsia-400 text-[8px] sm:text-[10px] font-black tracking-[0.4em] sm:tracking-[0.6em] mt-4 uppercase">Decrypting Neural Link...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isVerified ? 0 : 1 }}
        className="relative z-10 w-full max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-xl"
      >
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] sm:rounded-[3rem] md:rounded-[4rem] p-8 sm:p-12 md:p-16 shadow-2xl overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="text-center mb-8 sm:mb-10 md:mb-14 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-4 sm:mb-6">
              <FaShieldAlt className="text-fuchsia-500" /> Secure Node
            </div>
            <h1 className="text-[clamp(3rem,15vw,6rem)] font-[1000] text-white italic tracking-tighter leading-none drop-shadow-sm">
              Anthariksh
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 sm:space-y-8">
            <div className="space-y-4 sm:space-y-6">
              <div className="relative group">
                <FaEnvelope className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-all text-sm sm:text-base" />
                <input
                  type="email"
                  placeholder="Communication Node"
                  className="w-full bg-transparent border-b border-white/10 py-3 sm:py-5 pl-8 sm:pl-10 outline-none text-white text-base sm:text-lg focus:border-purple-500 transition-all placeholder:text-white/30"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative group">
                <FaLock className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-fuchsia-400 transition-all text-sm sm:text-base" />
                <input
                  type="password"
                  placeholder="Security Cipher"
                  className="w-full bg-transparent border-b border-white/10 py-3 sm:py-5 pl-8 sm:pl-10 outline-none text-white text-base sm:text-lg focus:border-fuchsia-500 transition-all placeholder:text-white/30"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pt-2 sm:pt-4 space-y-4 sm:space-y-6">
              {/* --- NEW BIGGER ANIMATED FORGOT BUTTON --- */}
              <motion.button
                type="button"
                whileHover={{ x: 5, color: "#d946ef" }}
                onClick={() => setShowResetModal(true)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-[1000] text-white/20 uppercase tracking-[0.3em] transition-all group"
              >
                <span>Forgot Security Cipher?</span>
                <FaArrowRight className="opacity-0 group-hover:opacity-100 transition-all" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-4 sm:py-6 bg-white text-black font-[1000] text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.5em] uppercase rounded-full shadow-xl sm:shadow-2xl transition-all"
              >
                {isSubmitting ? "SYNCING..." : "AUTHORIZE ACCESS"}
              </motion.button>

              <button
                onClick={(e) => { e.preventDefault(); googleLogin(); }}
                type="button"
                className="w-full py-3 sm:py-4 bg-white/5 border border-white/10 text-white/30 hover:text-white rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 sm:gap-3 transition-colors"
              >
                <FaGoogle className="text-fuchsia-500" /> Google Sync Protocol
              </button>

              <p className="text-center text-[8px] sm:text-[10px] text-white/20 font-bold uppercase tracking-[0.2em] sm:tracking-[0.4em]">
                Unauthorized?{" "}
                <span
                  onClick={() => navigate("/register")}
                  className="text-fuchsia-400 cursor-pointer underline underline-offset-4 sm:underline-offset-8 decoration-fuchsia-500/30 hover:text-white transition-colors"
                >
                  Establish Node
                </span>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
