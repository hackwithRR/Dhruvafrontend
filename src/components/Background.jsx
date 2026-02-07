import React, { useState, useEffect } from "react";

export default function Background() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    return (
        <div className="fixed inset-0 -z-50 overflow-hidden bg-[#020202]">
            {/* Interactive Radial Glow */}
            <div
                className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(800px at ${mousePos.x}px ${mousePos.y}px, rgba(79, 70, 229, 0.15), transparent 80%)`
                }}
            />

            {/* Animated Mesh Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/20 blur-[130px] rounded-full animate-blob" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/20 blur-[130px] rounded-full animate-blob animation-delay-2000" />

            {/* Cyber Grid */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]" />

            {/* Scanning Line */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent absolute top-0 animate-scan" />
            </div>

            {/* Film Grain Texture */}
            <div className="absolute inset-0 z-40 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
}