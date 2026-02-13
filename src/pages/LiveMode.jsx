import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaMicrophone, FaVolumeUp, FaBrain } from "react-icons/fa";
import axios from "axios";

const API_BASE = "https://dhruva-backend-production.up.railway.app";

export default function LiveMode() {
    const navigate = useNavigate();
    const location = useLocation();
    const { subject, chapter, userData } = location.state || { subject: "General", chapter: "Concepts", userData: {} };

    const [isListening, setIsListening] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [status, setStatus] = useState("Initializing Link...");

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);

    // --- 🔊 Voice Engine ---
    const getMaleVoice = useCallback(() => {
        const voices = synthesisRef.current.getVoices();
        return voices.find(v => v.name.toLowerCase().includes("google uk english male") || v.lang === 'en-GB') || voices[0];
    }, []);

    const speak = useCallback(async (text) => {
        synthesisRef.current.cancel();
        const cleanText = text.replace(/[*_`~]/g, '').replace(/\\\[.*?\\\]/g, '').trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.voice = getMaleVoice();
        utterance.rate = 1.0;

        utterance.onstart = () => {
            setIsAiSpeaking(true);
            setStatus("Dhruva is speaking...");
        };
        utterance.onend = () => {
            setIsAiSpeaking(false);
            startListening();
        };
        synthesisRef.current.speak(utterance);
    }, [getMaleVoice]);

    // --- 🎤 Speech Recognition ---
    const startListening = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        if (recognitionRef.current) recognitionRef.current.stop();
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
            setIsListening(true);
            setStatus("Listening...");
        };

        recognitionRef.current.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            setIsListening(false);
            setStatus("Processing...");

            try {
                const res = await axios.post(`${API_BASE}/chat`, {
                    message: transcript,
                    subject,
                    chapter,
                    mode: "Explain"
                });
                speak(res.data.reply);
            } catch (err) {
                setStatus("Connection Error");
                setTimeout(startListening, 2000);
            }
        };

        recognitionRef.current.start();
    }, [subject, chapter, speak]);

    useEffect(() => {
        const intro = `Neural Link established. I am ready for ${subject}. How can I help you?`;
        speak(intro);
        return () => {
            synthesisRef.current.cancel();
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-[#050505] text-white flex flex-col items-center justify-between py-20 px-6 z-[1000]">
            <div className="text-center">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <h1 className="text-4xl font-black tracking-tighter uppercase">{subject}</h1>
                    <p className="text-[10px] font-black tracking-[0.4em] text-indigo-500 mt-2">Neural Link Active</p>
                </motion.div>
            </div>

            {/* Visualizer Orb */}
            <div className="relative flex items-center justify-center">
                <motion.div
                    animate={{
                        scale: isAiSpeaking ? [1, 1.2, 1] : isListening ? [1, 1.1, 1] : 1,
                        rotate: 360
                    }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className={`w-64 h-64 rounded-full border-2 border-dashed ${isAiSpeaking ? 'border-indigo-500' : 'border-white/10'}`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex gap-1 items-end h-12">
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ height: (isAiSpeaking || isListening) ? [10, 40, 10] : 4 }}
                                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                                className={`w-1.5 rounded-full ${isAiSpeaking ? 'bg-indigo-500' : 'bg-white/40'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-8">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">{status}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-full hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                >
                    <FaTimes className="group-hover:rotate-90 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Terminate Link</span>
                </button>
            </div>
        </div>
    );
}
