// src/components/ModeButtons.jsx
import React from "react";
import { FaRegLightbulb, FaQuestionCircle, FaClipboardList, FaBookOpen, FaLayerGroup } from "react-icons/fa";

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
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow-lg transform transition-transform duration-200 hover:scale-105 ${getModeGradient(mode === m)}`}
                        >
                            {icon} {m}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}