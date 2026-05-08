import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPhone, FaSms, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { useAdminAuth } from '../context/AdminContext';
import { sendAdminOTP, verifyAdminOTP, isAdminPhone } from '../utils/adminOTP';
import { auth } from '../firebase';
import { RecaptchaVerifier } from 'firebase/auth';

const AdminLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'success'
  const [loading, setLoading] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { isAdminAuthenticated, setIsAdminAuthenticated, setAdminPhone } = useAdminAuth();
  const { userData, theme: activeTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initRecaptcha = async (containerId) => {
    return new Promise((resolve, reject) => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA verified');
          resolve(window.recaptchaVerifier);
        },
        'expired-callback': () => reject(new Error('reCAPTCHA expired'))
      });
      
      // Small delay to ensure ready
      setTimeout(() => {
        if (window.recaptchaVerifier?.render) {
          resolve(window.recaptchaVerifier);
        } else {
          reject(new Error('reCAPTCHA failed to initialize'));
        }
      }, 500);
    });
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // Pre-validate whitelist
      const isValidPhone = await isAdminPhone(phoneNumber);
      if (!isValidPhone) {
        setErrorMsg('❌ Phone not authorized. Contact super admin.');
        return;
      }

      // Initialize reCAPTCHA properly
      const verifier = await initRecaptcha('recaptcha-container');
      setRecaptchaVerifier(verifier);
      
      const result = await sendAdminOTP(phoneNumber, verifier);
      
      if (result.success) {
        setStep('otp');
      } else {
        setErrorMsg(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Phone submit error:', err);
      setErrorMsg(err.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await verifyAdminOTP(otp);
      if (result.success) {
        setIsAdminAuthenticated(true);
        setAdminPhone(phoneNumber);
        setStep('success');
        setTimeout(() => navigate('/admin'), 2000);
      }
    } catch (err) {
      console.error('OTP submit error:', err);
      setErrorMsg(err.message || 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-redirect if already admin authenticated
  if (isAdminAuthenticated) {
    navigate('/admin');
    return null;
  }

  const themeColors = {
    primary: activeTheme?.primaryHex || '#4f46e5',
    text: activeTheme?.isDark ? '#ffffff' : '#000000',
    textSecondary: activeTheme?.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
    bgCard: activeTheme?.isDark ? 'rgba(10,10,15,0.95)' : 'rgba(255,255,255,0.95)',
    border: activeTheme?.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: activeTheme?.hex || '#050505' }}>
      <Navbar userData={userData} />
      
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md relative"
          >
            {/* Error Display */}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl backdrop-blur-sm"
              >
                <p className="text-red-300 font-medium text-sm">{errorMsg}</p>
              </motion.div>
            )}

            {/* Floating Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1], x: [0, 20, 0] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full"
                style={{ background: `radial-gradient(circle at 30% 30%, ${themeColors.primary}40 0%, transparent 60%)`, filter: 'blur(80px)' }}
              />
              <motion.div
                animate={{ scale: [1.1, 1, 1.1], opacity: [0.08, 0.15, 0.08], x: [0, -15, 0] }}
                transition={{ duration: 10, repeat: Infinity, delay: 3 }}
                className="absolute -bottom-1/4 -right-1/4 w-[50%] h-[50%] rounded-full"
                style={{ background: `radial-gradient(circle at 70% 70%, ${themeColors.primary}30 0%, transparent 70%)`, filter: 'blur(60px)' }}
              />
            </div>

            {/* Login Card */}
            <div 
              className="relative p-8 md:p-10 rounded-3xl backdrop-blur-xl shadow-2xl"
              style={{
                background: themeColors.bgCard,
                border: `1px solid ${themeColors.border}`,
                boxShadow: `0 0 60px ${themeColors.primary}20, 0 25px 60px -15px rgba(0,0,0,0.4)`
              }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.primary}cc)`,
                    boxShadow: `0 0 30px ${themeColors.primary}50`
                  }}
                >
                  {step === 'phone' ? <FaPhone className="text-white text-xl" /> : <FaSms className="text-white text-xl" />}
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2" style={{ color: themeColors.text }}>
                  Admin Portal
                </h1>
                <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                  {step === 'phone' ? 'Enter whitelisted admin phone' : step === 'otp' ? 'Enter 6-digit OTP' : 'Access Granted!'}
                </p>
              </div>

              <div id="recaptcha-container" className="invisible h-0" />

              {step === 'phone' && (
                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: themeColors.primary }}>
                      <FaPhone size={16} />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono"
                      style={{
                        borderColor: themeColors.border,
                        color: themeColors.text,
                        backgroundColor: 'rgba(255,255,255,0.05)'
                      }}
                      required
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={loading || phoneNumber.length < 10}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-5 rounded-2xl font-black uppercase tracking-wider text-lg flex items-center justify-center gap-3 transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.primary}dd)`,
                      boxShadow: `0 8px 25px ${themeColors.primary}40`,
                      color: 'white'
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <FaSms size={16} />
                        Send OTP Code
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: themeColors.primary }}>
                      <FaSms size={16} />
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-center text-2xl font-mono tracking-widest"
                      style={{
                        borderColor: themeColors.border,
                        color: themeColors.text,
                        backgroundColor: 'rgba(255,255,255,0.05)'
                      }}
                      required
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-5 rounded-2xl font-black uppercase tracking-wider text-lg flex items-center justify-center gap-3 transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.primary}dd)`,
                      boxShadow: `0 8px 25px ${themeColors.primary}40`,
                      color: 'white'
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <FaArrowRight size={16} />
                        Enter Admin Panel
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {step === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 p-8"
                >
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                    className="w-24 h-24 mx-auto text-green-400"
                  >
                    <FaCheckCircle className="w-full h-full animate-pulse" />
                  </motion.div>
                  <div>
                    <h2 className="text-3xl font-black mb-2" style={{ color: themeColors.text }}>
                      Admin Access Granted!
                    </h2>
                    <p className="text-lg opacity-80" style={{ color: themeColors.textSecondary }}>
                      {phoneNumber} verified • Redirecting...
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-white/10 text-center">
                <p className="text-xs opacity-75" style={{ color: themeColors.textSecondary }}>
                  Dhruva Admin Portal v2.0 • Phone Auth Only
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminLogin;
