// src/components/ModeButtons.jsx
import React from "react";
import { motion } from "framer-motion";
import { FaRegLightbulb, FaQuestionCircle, FaClipboardList, FaBookOpen, FaLayerGroup } from "react-icons/fa";
import RippleEffect from "./RippleEffect";
import ClickSpark from "./ClickSpark";

export default function ModeButtons({ mode, setMode }) {
    const modeOptions = ["Explain", "Doubt", "Quiz", "Homework"];

    const getModeGradient = (active) => {
        if (!active) return "bg-gray-200 hover:bg-gray-300";
        switch (mode) {
            case "Explain":
                return "bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-black hover:from-yellow-400 hover:via-yellow-500 hover:to-yellow-600";
            case "Doubt":
                return "bg-gradient-to-r from-red-300 via-pink-300 to-orange-300 text-black hover:from-red-400 hover:via-pink-400 hover:to-orange-400";
            case "Quiz":
                return "bg-gradient-to-r from-blue-300 via-purple-300 to-teal-300 text-black hover:from-blue-400 hover:via-purple-400 hover:to-teal-400";
            case "Homework":
                return "bg-gradient-to-r from-green-300 via-lime-300 to-yellow-200 text-black hover:from-green-400 hover:via-lime-400 hover:to-yellow-300";
            default:
                return "bg-gray-200 text-black";
        }
    };

    return (
        <div className="flex flex-col items-center w-full mb-4">
            <div className="flex items-center gap-2 mb-2 text-xl font-semibold">
                <FaLayerGroup /> <span>Mode</span>
            </div>
            <div className="flex justify-center gap-4 flex-wrap">
                {modeOptions.map((m) => {
                    let icon;
                    if (m === "Explain") icon = <FaRegLightbulb />;
                    else if (m === "Doubt") icon = <FaQuestionCircle />;
                    else if (m === "Quiz") icon = <FaClipboardList />;
                    else if (m === "Homework") icon = <FaBookOpen />;

                    return (
                        <RippleEffect color="#3b82f6">
                          <ClickSpark sparkColor="#3b82f6" sparkCount={5}>
                            <motion.button
                                key={m}
                                whileHover={{ scale: 1.08, y: -2 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setMode(m)}
                                className={`group flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-[0_0_20px_currentColor] transition-all duration-300 ${getModeGradient(mode === m)}`}
                            >
                                <motion.div 
                                    className="group-hover:text-black/80 transition-colors"
                                    animate={mode === m ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                                    transition={{ duration: 0.6, repeat: Infinity }}
                                >
                                    {icon}
                                </motion.div>
                                <span className="group-hover:tracking-[0.2em] transition-all">{m}</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 -skew-x-12 transform translate-x-[-100%] animate-shimmer rounded-lg" />
                            </motion.button>
                          </ClickSpark>
                        </RippleEffect>
                    );
                })}
            </div>
        </div>
    );
}