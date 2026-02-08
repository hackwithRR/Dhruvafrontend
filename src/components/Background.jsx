import React, { useState, useEffect } from "react";

export default function Background({ theme }) {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    // --- 🎨 DYNAMIC BACKGROUND ENGINE ---
    const configs = {
        DeepSpace: {
            bg: "bg-[#020202]",
            glow: "rgba(79, 70, 229, 0.15)", // Indigo
            blobs: ["bg-blue-600/20", "bg-indigo-600/20"],
            grid: "rgba(255,255,255,0.03)",
            scan: "via-blue-500/20"
        },
        Light: {
            bg: "bg-[#f8fafc]",
            glow: "rgba(79, 70, 229, 0.08)",
            blobs: ["bg-blue-200/40", "bg-indigo-200/40"],
            grid: "rgba(0,0,0,0.03)",
            scan: "via-indigo-500/10"
        },
        Sakura: {
            bg: "bg-[#0f0508]",
            glow: "rgba(244, 63, 94, 0.15)", // Rose
            blobs: ["bg-rose-600/20", "bg-pink-600/20"],
            grid: "rgba(244, 63, 94, 0.05)",
            scan: "via-rose-500/20"
        },
        Cyberpunk: {
            bg: "bg-[#020617]",
            glow: "rgba(6, 182, 212, 0.15)", // Cyan
            blobs: ["bg-cyan-600/20", "bg-fuchsia-600/20"],
            grid: "rgba(6, 182, 212, 0.05)",
            scan: "via-cyan-500/30"
        }
    };

    const active = configs[theme] || configs.DeepSpace;

    return (
        <div className={`fixed inset-0 -z-50 overflow-hidden transition-colors duration-1000 ${active.bg}`}>
            
            {/* Interactive Radial Glow */}
            <div
                className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(800px at ${mousePos.x}px ${mousePos.y}px, ${active.glow}, transparent 80%)`
                }}
            />

            {/* Animated Mesh Gradients (Blobs) */}
            <div className={`absolute top-[-10%] left-[-10%] w-[70%] h-[70%] blur-[130px] rounded-full animate-blob transition-colors duration-1000 ${active.blobs[0]}`} />
            <div className={`absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] blur-[130px] rounded-full animate-blob animation-delay-2000 transition-colors duration-1000 ${active.blobs[1]}`} />

            {/* Dynamic Grid */}
            <div 
                className="absolute inset-0 z-0 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]" 
                style={{
                    backgroundImage: `
                        linear-gradient(to right, ${active.grid} 1px, transparent 1px),
                        linear-gradient(to bottom, ${active.grid} 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Scanning Line */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <div className={`w-full h-[1px] bg-gradient-to-r from-transparent ${active.scan} to-transparent absolute top-0 animate-scan`} />
            </div>

            {/* Film Grain Texture */}
            <div className="absolute inset-0 z-40 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
}
