// src/components/NavLoginBar.jsx
import React from "react";

export default function NavLoginBar({ page, setPage, theme }) {
    const themeClasses =
        theme === "dark"
            ? "bg-gray-900 text-white"
            : theme === "colorful"
                ? "bg-gradient-to-r from-purple-400 via-pink-500 to-red-400 text-white"
                : "bg-white text-black";

    return (
        <nav className={`flex justify-center gap-4 p-4 shadow-md ${themeClasses}`}>
            <button
                className={`px-4 py-2 rounded ${page === "login" ? "bg-blue-500 text-white" : "bg-gray-300"
                    }`}
                onClick={() => setPage("login")}
            >
                Login
            </button>
            <button
                className={`px-4 py-2 rounded ${page === "register" ? "bg-blue-500 text-white" : "bg-gray-300"
                    }`}
                onClick={() => setPage("register")}
            >
                Register
            </button>
        </nav>
    );
}