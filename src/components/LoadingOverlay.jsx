import React, { useState, useEffect, useRef } from 'react';

// Theme configurations matching the Background component
const themeConfigs = {
    DeepSpace: {
        bg: '#010204',
        glow: 'rgba(30, 58, 138, 0.6)',
        primary: '#3b82f6',
        secondary: '#60a5fa',
        accent: '#93c5fd',
        text: '#94a3b8'
    },
    Light: {
        bg: '#ffffff',
        glow: 'rgba(99, 102, 241, 0.3)',
        primary: '#4f46e5',
        secondary: '#818cf8',
        accent: '#a5b4fc',
        text: '#6b7280'
    },
    Sakura: {
        bg: '#fff0f5',
        glow: 'rgba(255, 182, 193, 0.5)',
        primary: '#ec4899',
        secondary: '#f472b6',
        accent: '#f9a8d4',
        text: '#9ca3af'
    },
    Cyberpunk: {
        bg: '#020005',
        glow: 'rgba(6, 182, 212, 0.5)',
        primary: '#06b6d4',
        secondary: '#22d3ee',
        accent: '#67e8f9',
        text: '#67e8f9'
    },
    PaperLight: {
        bg: '#fcfcf9',
        glow: 'rgba(79, 70, 229, 0.3)',
        primary: '#4f46e5',
        secondary: '#6366f1',
        accent: '#818cf8',
        text: '#6b7280'
    },
    Coffee: {
        bg: '#0c0a09',
        glow: 'rgba(214, 197, 187, 0.3)',
        primary: '#a8a29e',
        secondary: '#d6c5bb',
        accent: '#e7e5e4',
        text: '#78716c'
    },
    RoyalParchment: {
        bg: '#fdf6e3',
        glow: 'rgba(180, 83, 9, 0.3)',
        primary: '#f59e0b',
        secondary: '#fbbf24',
        accent: '#fcd34d',
        text: '#92400e'
    },
    MidnightAurora: {
        bg: '#010806',
        glow: 'rgba(16, 185, 129, 0.4)',
        primary: '#10b981',
        secondary: '#34d399',
        accent: '#6ee7b7',
        text: '#6ee7b7'
    },
    SunsetDrift: {
        bg: '#0f0402',
        glow: 'rgba(249, 115, 22, 0.4)',
        primary: '#f97316',
        secondary: '#fb923c',
        accent: '#fdba74',
        text: '#fdba74'
    },
    Phantom: {
        bg: '#050505',
        glow: 'rgba(255, 255, 255, 0.2)',
        primary: '#a3a3a3',
        secondary: '#d4d4d4',
        accent: '#e5e5e5',
        text: '#737373'
    },
    Solaris: {
        bg: '#050401',
        glow: 'rgba(250, 204, 21, 0.4)',
        primary: '#eab308',
        secondary: '#facc15',
        accent: '#fde047',
        text: '#fde047'
    },
    Aero: {
        bg: '#0f172a',
        glow: 'rgba(148, 163, 184, 0.3)',
        primary: '#94a3b8',
        secondary: '#cbd5e1',
        accent: '#e2e8f0',
        text: '#94a3b8'
    },
    Toxic: {
        bg: '#020500',
        glow: 'rgba(163, 230, 53, 0.4)',
        primary: '#84cc16',
        secondary: '#a3e635',
        accent: '#bef264',
        text: '#bef264'
    },
    Synthwave: {
        bg: '#120422',
        glow: 'rgba(34, 211, 238, 0.4)',
        primary: '#22d3ee',
        secondary: '#67e8f9',
        accent: '#a5f3fc',
        text: '#a5f3fc'
    },
    RetroTerminal: {
        bg: '#0a0f0a',
        glow: 'rgba(34, 197, 94, 0.4)',
        primary: '#22c55e',
        secondary: '#4ade80',
        accent: '#86efac',
        text: '#86efac'
    },
    Amethyst: {
        bg: '#0d0214',
        glow: 'rgba(192, 132, 252, 0.4)',
        primary: '#a855f7',
        secondary: '#c084fc',
        accent: '#d8b4fe',
        text: '#d8b4fe'
    },
    Blueprint: {
        bg: '#1e40af',
        glow: 'rgba(255, 255, 255, 0.3)',
        primary: '#60a5fa',
        secondary: '#93c5fd',
        accent: '#bfdbfe',
        text: '#dbeafe'
    },
    Clay: {
        bg: '#e5e5e1',
        glow: 'rgba(87, 83, 78, 0.2)',
        primary: '#78716c',
        secondary: '#a8a29e',
        accent: '#d6d3d1',
        text: '#57534e'
    },
    Radioactive: {
        bg: '#bef264',
        glow: 'rgba(0, 0, 0, 0.2)',
        primary: '#65a30d',
        secondary: '#84cc16',
        accent: '#a3e635',
        text: '#3f6212'
    },
    CrimsonOLED: {
        bg: '#000000',
        glow: 'rgba(220, 38, 38, 0.4)',
        primary: '#dc2626',
        secondary: '#ef4444',
        accent: '#f87171',
        text: '#f87171'
    },
    Industrial: {
        bg: '#1c1c1c',
        glow: 'rgba(249, 115, 22, 0.4)',
        primary: '#f97316',
        secondary: '#fb923c',
        accent: '#fdba74',
        text: '#fdba74'
    },
    MidnightSun: {
        bg: '#1a0b2e',
        glow: 'rgba(251, 191, 36, 0.4)',
        primary: '#d97706',
        secondary: '#f59e0b',
        accent: '#fbbf24',
        text: '#fbbf24'
    }
};

const LoadingOverlay = ({ duration = 2000, onComplete, theme = 'DeepSpace' }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isFading, setIsFading] = useState(false);
    const [progress, setProgress] = useState(0);
    const startTimeRef = useRef(Date.now());

    // Get theme colors
    const colors = themeConfigs[theme] || themeConfigs.DeepSpace;

    useEffect(() => {
        // Progress simulation
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min(Math.floor((elapsed / duration) * 100), 100);
            setProgress(newProgress);
        }, 50);

        const fadeTimer = setTimeout(() => {
            setIsFading(true);
            setProgress(100);
            const hideTimer = setTimeout(() => {
                setIsVisible(false);
                if (onComplete) {
                    onComplete();
                }
            }, 600);
            return () => clearTimeout(hideTimer);
        }, duration);

        return () => {
            clearInterval(progressInterval);
            clearTimeout(fadeTimer);
        };
    }, [duration, onComplete]);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.bg,
            transition: 'opacity 0.6s ease-out, background 0.3s',
            opacity: isFading ? 0 : 1,
        }}>
            <style>{`
                @keyframes spin-slow {
                    to { transform: rotate(360deg); }
                }
                @keyframes spin-reverse {
                    to { transform: rotate(-360deg); }
                }
                @keyframes glow-pulse {
                    0%, 100% { 
                        filter: drop-shadow(0 0 8px ${colors.glow});
                    }
                    50% { 
                        filter: drop-shadow(0 0 20px ${colors.glow}) drop-shadow(0 0 40px ${colors.glow});
                    }
                }
                @keyframes float-up {
                    0% { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes dot-bounce {
                    0%, 80%, 100% { 
                        transform: scale(0.6);
                        opacity: 0.5;
                    }
                    40% { 
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                @keyframes scan-line {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100vh); }
                }
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .loader-container {
                    animation: float-up 0.6s ease-out;
                }
                .loader-ring {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    animation: glow-pulse 2s ease-in-out infinite;
                }
                .ring-1 {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    border: 2px solid transparent;
                    border-top-color: ${colors.primary};
                    border-right-color: ${colors.primary}55;
                    animation: spin-slow 2s linear infinite;
                }
                .ring-2 {
                    position: absolute;
                    inset: 8px;
                    border-radius: 50%;
                    border: 2px solid transparent;
                    border-bottom-color: ${colors.secondary};
                    border-left-color: ${colors.secondary}55;
                    animation: spin-reverse 1.5s linear infinite;
                }
                .ring-3 {
                    position: absolute;
                    inset: 16px;
                    border-radius: 50%;
                    border: 2px solid transparent;
                    border-top-color: ${colors.accent}88;
                    animation: spin-slow 1s linear infinite;
                }
                .center-core {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: ${colors.primary};
                    box-shadow: 0 0 20px ${colors.primary}, 0 0 40px ${colors.secondary};
                }
                .progress-container {
                    margin-top: 32px;
                    width: 200px;
                    animation: fade-in-up 0.4s ease-out 0.2s both;
                }
                .progress-bar-bg {
                    width: 100%;
                    height: 4px;
                    background: ${colors.primary}22;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, ${colors.primary}, ${colors.secondary});
                    border-radius: 4px;
                    transition: width 0.1s ease-out;
                    box-shadow: 0 0 10px ${colors.primary};
                }
                .loading-text {
                    margin-top: 12px;
                    font-size: 12px;
                    font-weight: 500;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: ${colors.text};
                    opacity: 0.8;
                    animation: fade-in-up 0.4s ease-out 0.3s both;
                }
                .loading-dots {
                    display: inline-flex;
                    gap: 4px;
                    margin-left: 4px;
                }
                .loading-dot {
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: ${colors.primary};
                    animation: dot-bounce 1.4s ease-in-out infinite;
                }
                .loading-dot:nth-child(1) { animation-delay: -0.32s; }
                .loading-dot:nth-child(2) { animation-delay: -0.16s; }
                .loading-dot:nth-child(3) { animation-delay: 0s; }
                .brand-text {
                    margin-top: 40px;
                    font-size: 18px;
                    font-weight: 700;
                    letterSpacing: '0.1em';
                    color: ${colors.primary};
                    animation: fade-in-up 0.5s ease-out 0.4s both;
                }
                .scan-effect {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, transparent, ${colors.primary}88, transparent);
                    animation: scan-line 2s linear infinite;
                    opacity: 0.5;
                }
            `}</style>

            {/* Scan line effect */}
            <div className="scan-effect"></div>

            <div className="loader-container">
                <div className="loader-ring">
                    <div className="ring-1"></div>
                    <div className="ring-2"></div>
                    <div className="ring-3"></div>
                    <div className="center-core"></div>
                </div>

                <div className="progress-container">
                    <div className="progress-bar-bg">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="loading-text">
                        {progress < 100 ? (
                            <>Preparing<span className="loading-dots">
                                <span className="loading-dot"></span>
                                <span className="loading-dot"></span>
                                <span className="loading-dot"></span>
                            </span></>
                        ) : (
                            'Ready!'
                        )}
                    </div>
                </div>

                <div className="brand-text">PadhoYaar</div>
            </div>
        </div>
    );
};

export default LoadingOverlay;
