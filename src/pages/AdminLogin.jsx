import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  CircleAlert,
  Command,
  EyeOff,
  Lock,
  Phone,
  Shield,

  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { RecaptchaVerifier } from 'firebase/auth';
import { isAdminPhone, sendAdminOTP, verifyAdminOTP } from '../utils/adminOTP';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!m) return;
    const onChange = () => setReduced(!!m.matches);
    onChange();
    m.addEventListener?.('change', onChange);
    return () => m.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

function FloatingInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  error,
  rightSlot,
  disabled,
  onEnter,
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = String(value ?? '').length > 0;

  return (
    <div className="relative">
      <motion.div
        animate={error ? { x: [0, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className="relative"
      >
        <div
          className={
            'rounded-3xl border bg-white/5 px-4 ' +
            (error ? 'border-red-500/60 ring-1 ring-red-500/20' : 'border-white/15 ring-0') +
            ' transition-all focus-within:border-white/25 focus-within:ring-1 focus-within:ring-white/10'
          }
        >
          <div className="relative">
            <input
              id={id}
              type={type}
              value={value}
              onChange={onChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholder || ' '}
              autoComplete={autoComplete}
              inputMode={inputMode}
              maxLength={maxLength}
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onEnter) onEnter();
              }}
              className={
                'w-full bg-transparent pt-5 pb-3 text-white placeholder-transparent outline-none ' +
                'text-[15px] md:text-[16px] font-semibold'
              }
            />
            <label
              htmlFor={id}
              className={
                'pointer-events-none absolute left-0 top-0 ml-4 transition-all ' +
                (focused || hasValue
                  ? 'text-white/70 text-[11px] -translate-y-1.5'
                  : 'text-white/35 text-[13px] translate-y-3')
              }
            >
              {label}
            </label>
          </div>
          {rightSlot ? <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div> : null}
        </div>
      </motion.div>
    </div>
  );
}

function RememberToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={
        'w-full flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ' +
        'border-white/10 bg-white/5 hover:bg-white/10 transition-all'
      }
      aria-pressed={checked}
    >
      <div className="flex items-center gap-3">
        <div
          className={
            'w-10 h-6 rounded-full border transition-all relative ' +
            (checked ? 'border-emerald-400/40 bg-emerald-400/20' : 'border-white/15 bg-white/5')
          }
        >
          <motion.div
            layout
            className={
              'absolute top-1 left-1 w-4 h-4 rounded-full bg-white/80 shadow-sm'
            }
            style={{
              transform: checked ? 'translateX(14px)' : 'translateX(0px)',
            }}
            transition={{ type: 'spring', stiffness: 520, damping: 35 }}
          />
        </div>
        <div className="text-sm font-bold text-white/80">Remember Me</div>
      </div>
      <div className="text-xs font-black text-white/50">Local session</div>
    </button>
  );
}

export default function AdminLogin() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const navigate = useNavigate();

  const { isAdminAuthenticated, setIsAdminAuthenticated, setAdminPhone } = useAdminAuth();
  const { theme: activeTheme } = useAuth();

  const themeColors = useMemo(() => {
    const map = {
      DeepSpace: { primary: '#4f46e5', hex: '#050505', text: '#fff', isDark: true },
      Light: { primary: '#4f46e5', hex: '#0b0b12', text: '#fff', isDark: true },
      Cyberpunk: { primary: '#06b6d4', hex: '#04040a', text: '#fff', isDark: true },
      default: { primary: '#4f46e5', hex: '#050505', text: '#fff', isDark: true },
    };
    return map[activeTheme] || map.default;
  }, [activeTheme]);

  const [step, setStep] = useState('phone'); // phone | otp | success
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [remember, setRemember] = useState(true);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const recaptchaVerifierRef = useRef(null);

  const initRecaptcha = async (containerId) => {
    return new Promise((resolve, reject) => {
      try {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
        }

        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
          callback: () => resolve(window.recaptchaVerifier),
          'expired-callback': () => reject(new Error('reCAPTCHA expired')),
        });

        setTimeout(() => {
          if (window.recaptchaVerifier?.render) {
            resolve(window.recaptchaVerifier);
          } else {
            reject(new Error('reCAPTCHA failed to initialize'));
          }
        }, 400);
      } catch (e) {
        reject(e);
      }
    });
  };

  useEffect(() => {
    if (!isAdminAuthenticated) return;
    navigate('/admin');
  }, [isAdminAuthenticated, navigate]);

  const submitPhone = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const normalized = phoneNumber.replace(/\D/g, '');
      const pretty = phoneNumber.trim();

      if (!(await isAdminPhone(pretty || normalized))) {
        setErrorMsg('❌ Phone not authorized. Contact super admin.');
        return;
      }

      const verifier = await initRecaptcha('recaptcha-container');
      recaptchaVerifierRef.current = verifier;

      const result = await sendAdminOTP(pretty || normalized, verifier);
      if (result?.success) {
        setStep('otp');
      } else {
        setErrorMsg(result?.error || 'Failed to send OTP');
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await verifyAdminOTP(otp);
      if (result?.success) {
        setIsAdminAuthenticated(true);
        setAdminPhone(phoneNumber);
        setStep('success');
        setTimeout(() => navigate('/admin'), 1100);
      } else {
        setErrorMsg('Invalid OTP. Try again.');
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const showShake = !!errorMsg && (prefersReducedMotion ? false : true);

  const buttonContent = (primaryLabel, spinnerLabel) => {
    if (!loading) return primaryLabel;
    return (
      <span className="inline-flex items-center gap-2">
        <motion.span
          className="w-4 h-4 border-2 border-white/30 border-t-white/90 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
        {spinnerLabel}
      </span>
    );
  };

  const primaryBg = `linear-gradient(135deg, ${themeColors.primary}, rgba(168,85,247,0.9))`;

  if (isAdminAuthenticated) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(circle at 20% 10%, ${themeColors.primary}40, transparent 55%), radial-gradient(circle at 80% 30%, rgba(168,85,247,0.35), transparent 55%), linear-gradient(180deg, #05050a, ${themeColors.hex})`,
        }}
      />

      {/* subtle animated grid */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-30"
        style={{ backgroundSize: '44px 44px' }}
        animate={
          prefersReducedMotion
            ? undefined
            : { backgroundPosition: ['0px 0px', '60px 30px', '0px 0px'] }
        }
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 -z-10 opacity-50" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl">
          <div className="hidden md:grid md:grid-cols-5 gap-6 items-stretch">
            <div className="md:col-span-2 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-70" style={{ background: `radial-gradient(circle at 30% 30%, ${themeColors.primary}55, transparent 60%)` }} />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-60" style={{ background: 'radial-gradient(circle at 70% 70%, rgba(168,85,247,0.45), transparent 65%)' }} />

              <motion.div
                initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/70">
                  <Sparkles className="w-4 h-4" style={{ color: themeColors.primary }} />
                  PREMIUM ADMIN ACCESS
                </div>

                <h2 className="mt-6 text-4xl font-black tracking-tight text-white">
                  Secure by design.
                </h2>
                <p className="mt-3 text-white/70 leading-relaxed">
                  Phone-whitelisted authentication with OTP verification and hardened micro-interactions.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    { t: 'Glass UI + Motion', d: 'Crisp framer transitions' },
                    { t: 'Accessibility First', d: 'Keyboard-friendly controls' },
                    { t: 'Validation Feedback', d: 'Shake & check states' },
                  ].map((x) => (
                    <div key={x.t} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <div className="text-sm font-black text-white/90">{x.t}</div>
                      <div className="text-xs text-white/60 mt-1">{x.d}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="md:col-span-3">
              {/* Mobile-first card */}
              <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_80px_rgba(79,70,229,0.18)] overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${themeColors.primary}20, rgba(168,85,247,0.12))` }} />

                <div className="relative p-7 md:p-10">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/10 flex items-center justify-center">
                        <Shield className="w-6 h-6" style={{ color: themeColors.primary }} />
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.65, ease: 'easeOut' }}
                      className="mt-4"
                    >
                      <div className="text-xs font-black uppercase tracking-[0.35em] text-white/50">WELCOME BACK</div>
                      <div className="mt-2 text-3xl md:text-4xl font-black tracking-tight">
                        <span className="text-white">Admin</span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/50">
                          Portal
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-white/65">{step === 'phone' ? 'Enter your whitelisted phone.' : step === 'otp' ? 'Verify your OTP.' : 'Access granted.'}</div>
                    </motion.div>
                  </div>

                  <div id="recaptcha-container" className="invisible h-0" />

                  <AnimatePresence mode="wait">
                    {step === 'phone' && (
                      <motion.form
                        key="phone"
                        onSubmit={submitPhone}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="mt-6 space-y-4"
                      >
                        <FloatingInput
                          id="admin-phone"
                          label="Phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+91 98765 43210"
                          inputMode="tel"
                          autoComplete="tel"
                          error={!!errorMsg}
                          rightSlot={<Phone className="w-4 h-4" style={{ color: themeColors.primary }} />}
                        />

                        <RememberToggle checked={remember} onChange={setRemember} />

                        {errorMsg && (
                          <motion.div
                            className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 flex items-start gap-2"
                            initial={{ opacity: 0, y: -10 }}
                            animate={showShake ? { opacity: 1, y: 0 } : { opacity: 1 }}
                            transition={{ duration: 0.25 }}
                            role="alert"
                          >
                            <CircleAlert className="w-4 h-4 mt-0.5" style={{ color: '#f87171' }} />
                            <div className="text-sm font-semibold text-red-100">{errorMsg}</div>
                          </motion.div>
                        )}

                        <div className="flex items-center justify-between">
                          <button type="button" onClick={() => setShowForgot(true)} className="text-sm font-bold text-white/70 hover:text-white transition">
                            Forgot Password?
                          </button>

                          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/55">
                            <Command className="w-4 h-4" style={{ color: themeColors.primary }} />
                            Secure OTP
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={loading}
                          className="w-full rounded-2xl py-4 font-black tracking-wide text-white flex items-center justify-center gap-2"
                          style={{ background: primaryBg, boxShadow: `0 0 28px ${themeColors.primary}40` }}
                          animate={errorMsg ? { boxShadow: `0 0 28px rgba(248,113,113,0.5)` } : undefined}
                        >
                          {buttonContent('Send OTP', 'Sending...')}
                        </motion.button>
                      </motion.form>
                    )}

                    {step === 'otp' && (
                      <motion.form
                        key="otp"
                        onSubmit={submitOtp}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="mt-6 space-y-4"
                      >
                        <FloatingInput
                          id="admin-otp"
                          label="OTP"
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          inputMode="numeric"
                          maxLength={6}
                          error={!!errorMsg}
                          rightSlot={<MessageCircle className="w-4 h-4" style={{ color: themeColors.primary }} />}
                          disabled={loading}
                        />

                        <div className="text-xs text-white/55 font-semibold">
                          Sent to: <span className="text-white/80">{phoneNumber}</span>
                        </div>

                        {errorMsg && (
                          <motion.div
                            className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 flex items-start gap-2"
                            initial={{ opacity: 0, y: -10 }}
                            animate={showShake ? { opacity: 1, y: 0 } : { opacity: 1 }}
                            transition={{ duration: 0.25 }}
                            role="alert"
                          >
                            <CircleAlert className="w-4 h-4 mt-0.5" style={{ color: '#f87171' }} />
                            <div className="text-sm font-semibold text-red-100">{errorMsg}</div>
                          </motion.div>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={loading || otp.length !== 6}
                          className="w-full rounded-2xl py-4 font-black tracking-wide text-white flex items-center justify-center gap-2"
                          style={{ background: primaryBg, boxShadow: `0 0 28px ${themeColors.primary}40` }}
                        >
                          {loading ? (
                            <span className="inline-flex items-center gap-2">
                              <motion.span
                                className="w-4 h-4 border-2 border-white/30 border-t-white/90 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                              />
                              Verifying...
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <ArrowRight className="w-4 h-4" />
                              Enter Admin Panel
                            </span>
                          )}
                        </motion.button>

                        <button
                          type="button"
                          onClick={() => {
                            setStep('phone');
                            setOtp('');
                            setErrorMsg('');
                          }}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70 hover:bg-white/10 transition"
                        >
                          Edit Phone
                        </button>
                      </motion.form>
                    )}

                    {step === 'success' && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-6 text-center space-y-4"
                      >
                        <motion.div
                          className="mx-auto w-16 h-16 rounded-3xl border border-emerald-400/25 bg-emerald-400/10 flex items-center justify-center"
                          animate={{ rotate: prefersReducedMotion ? 0 : 360 }}
                          transition={{ duration: 1, ease: 'easeInOut' }}
                        >
                          <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.35 }}
                          >
                            <Check className="w-7 h-7" style={{ color: '#34d399' }} />
                          </motion.div>
                        </motion.div>

                        <div className="text-2xl font-black text-white">Access Granted</div>
                        <div className="text-sm text-white/65">{phoneNumber} verified • Redirecting...</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-7 pt-6 border-t border-white/10 text-center">
                    <div className="text-xs font-bold text-white/50">Dhruva Admin Portal • OTP Phone Auth</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden">
            <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_80px_rgba(79,70,229,0.18)] overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${themeColors.primary}20, rgba(168,85,247,0.12))` }} />
              <div className="relative p-7">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl border border-white/10 bg-white/10 flex items-center justify-center">
                    <Shield className="w-6 h-6" style={{ color: themeColors.primary }} />
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                  >
                    <div className="mt-4 text-xs font-black uppercase tracking-[0.35em] text-white/50">WELCOME BACK</div>
                    <div className="mt-2 text-3xl font-black tracking-tight">
                      <span className="text-white">Admin</span>
                      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/50">Portal</span>
                    </div>
                    <div className="mt-2 text-sm text-white/65">{step === 'phone' ? 'Enter your whitelisted phone.' : step === 'otp' ? 'Verify your OTP.' : 'Access granted.'}</div>
                  </motion.div>
                </div>

                <div id="recaptcha-container" className="invisible h-0" />

                <AnimatePresence mode="wait">
                  {step === 'phone' && (
                    <motion.form
                      key="phone-m"
                      onSubmit={submitPhone}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="mt-6 space-y-4"
                    >
                      <FloatingInput
                        id="admin-phone-m"
                        label="Phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        inputMode="tel"
                        autoComplete="tel"
                        error={!!errorMsg}
                        rightSlot={<Phone className="w-4 h-4" style={{ color: themeColors.primary }} />}
                      />
                      <RememberToggle checked={remember} onChange={setRemember} />

                      {errorMsg && (
                        <motion.div
                          className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 flex items-start gap-2"
                          initial={{ opacity: 0, y: -10 }}
                          animate={showShake ? { opacity: 1, y: 0 } : { opacity: 1 }}
                          transition={{ duration: 0.25 }}
                          role="alert"
                        >
                          <CircleAlert className="w-4 h-4 mt-0.5" style={{ color: '#f87171' }} />
                          <div className="text-sm font-semibold text-red-100">{errorMsg}</div>
                        </motion.div>
                      )}

                      <div className="flex items-center justify-between">
                        <button type="button" onClick={() => setShowForgot(true)} className="text-sm font-bold text-white/70 hover:text-white transition">
                          Forgot Password?
                        </button>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-2xl py-4 font-black tracking-wide text-white flex items-center justify-center gap-2"
                        style={{ background: primaryBg, boxShadow: `0 0 28px ${themeColors.primary}40` }}
                      >
                        {buttonContent('Send OTP', 'Sending...')}
                      </motion.button>
                    </motion.form>
                  )}

                  {step === 'otp' && (
                    <motion.form
                      key="otp-m"
                      onSubmit={submitOtp}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="mt-6 space-y-4"
                    >
                      <FloatingInput
                        id="admin-otp-m"
                        label="OTP"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        inputMode="numeric"
                        maxLength={6}
                        error={!!errorMsg}
                        rightSlot={<MessageCircle className="w-4 h-4" style={{ color: themeColors.primary }} />}
                        disabled={loading}
                      />
                      <div className="text-xs text-white/55 font-semibold">
                        Sent to: <span className="text-white/80">{phoneNumber}</span>
                      </div>

                      {errorMsg && (
                        <motion.div
                          className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 flex items-start gap-2"
                          initial={{ opacity: 0, y: -10 }}
                          animate={showShake ? { opacity: 1, y: 0 } : { opacity: 1 }}
                          transition={{ duration: 0.25 }}
                          role="alert"
                        >
                          <CircleAlert className="w-4 h-4 mt-0.5" style={{ color: '#f87171' }} />
                          <div className="text-sm font-semibold text-red-100">{errorMsg}</div>
                        </motion.div>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full rounded-2xl py-4 font-black tracking-wide text-white flex items-center justify-center gap-2"
                        style={{ background: primaryBg, boxShadow: `0 0 28px ${themeColors.primary}40` }}
                      >
                        {loading ? (
                          <span className="inline-flex items-center gap-2">
                            <motion.span
                              className="w-4 h-4 border-2 border-white/30 border-t-white/90 rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            />
                            Verifying...
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <ArrowRight className="w-4 h-4" />
                            Enter Admin Panel
                          </span>
                        )}
                      </motion.button>

                      <button
                        type="button"
                        onClick={() => {
                          setStep('phone');
                          setOtp('');
                          setErrorMsg('');
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70 hover:bg-white/10 transition"
                      >
                        Edit Phone
                      </button>
                    </motion.form>
                  )}

                  {step === 'success' && (
                    <motion.div
                      key="success-m"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-6 text-center space-y-4"
                    >
                      <motion.div
                        className="mx-auto w-16 h-16 rounded-3xl border border-emerald-400/25 bg-emerald-400/10 flex items-center justify-center"
                        animate={{ rotate: prefersReducedMotion ? 0 : 360 }}
                        transition={{ duration: 1, ease: 'easeInOut' }}
                      >
                        <Check className="w-7 h-7" style={{ color: '#34d399' }} />
                      </motion.div>
                      <div className="text-2xl font-black text-white">Access Granted</div>
                      <div className="text-sm text-white/65">{phoneNumber} verified • Redirecting...</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-7 pt-6 border-t border-white/10 text-center">
                  <div className="text-xs font-bold text-white/50">Dhruva Admin Portal • OTP Phone Auth</div>
                </div>
              </div>
            </div>
          </div>

          {/* Forgot modal */}
          <AnimatePresence>
            {showForgot && (
              <motion.div
                className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ scale: 0.92, y: 10, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.92, y: 10, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_80px_rgba(79,70,229,0.2)] overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.35em] text-white/50">Forgot Password</div>
                        <div className="mt-2 text-xl font-black text-white">Admin OTP Recovery</div>
                        <div className="mt-2 text-sm text-white/65 leading-relaxed">
                          Admin access is phone-whitelisted. Recovery requires super admin assistance.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowForgot(false)}
                        className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-2"
                        aria-label="Close"
                      >
                        <XIcon />
                      </button>
                    </div>

                    <div className="mt-5">
                      <label className="text-xs font-bold text-white/60">Contact email (optional)</label>
                      <input
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
                      />
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowForgot(false)}
                        className="flex-1 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 py-3 text-sm font-black text-white/70"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (forgotLoading) return;
                          setForgotLoading(true);
                          await new Promise((r) => setTimeout(r, 650));
                          setForgotLoading(false);
                          setShowForgot(false);
                          setErrorMsg('Recovery request noted. Contact super admin to resend OTP.');
                          setStep('phone');
                        }}
                        className="flex-1 rounded-2xl px-4 py-3 text-sm font-black text-white transition"
                        style={{ background: primaryBg, boxShadow: `0 0 28px ${themeColors.primary}40` }}
                      >
                        {forgotLoading ? 'Sending...' : 'Request Support'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 4L14 14" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 4L4 14" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

