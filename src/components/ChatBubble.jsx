// src/components/ChatBubble.jsx
import React from "react";

export default function ChatBubble({ message, theme }) {
    const { role, content } = message;

    // Determine bubble styles based on role and theme
    let bubbleClasses = "p-2 rounded max-w-xl shadow-md ";

    if (role === "user") {
        bubbleClasses +=
            theme === "dark"
                ? "self-end bg-blue-700 text-white"
                : theme === "colorful"
                    ? "self-end bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 text-black"
                    : "self-end bg-blue-500 text-white";
    } else {
        bubbleClasses +=
            theme === "dark"
                ? "self-start bg-gray-700 text-white"
                : theme === "colorful"
                    ? "self-start bg-gradient-to-r from-green-100 via-yellow-100 to-pink-100 text-black"
                    : "self-start bg-gray-200 text-black";
    }

    return <div className={bubbleClasses}>{content}</div>;
}