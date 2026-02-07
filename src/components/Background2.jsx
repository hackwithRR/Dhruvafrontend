import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Background2() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    return (
        <div className="fixed inset-0 -z-50 overflow-hidden bg-[#05000a]">

            {/* 1. TOXIC MOUSE GLOW (Pink/Violet) */}
            <div
                className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(650px at ${mousePos.x}px ${mousePos.y}px, rgba(219, 39, 119, 0.15), transparent 80%)`
                }}
            />

            {/* 2. THE INITIALIZATION BLOBS (Faster & Hotter) */}
            {/* Top Left - Fuchsia */}
            <div className="absolute top-[-15%] left-[-10%] w-[75%] h-[75%] bg-fuchsia-600/20 blur-[120px] rounded-full animate-blob transition-all duration-700" />

            {/* Bottom Right - Deep Purple */}
            <div className="absolute bottom-[-15%] right-[-10%] w-[75%] h-[75%] bg-purple-900/30 blur-[120px] rounded-full animate-blob animation-delay-2000 transition-all duration-700" />

            {/* THE CORE (Center Pulse) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-rose-500/10 blur-[100px] rounded-full animate-pulse" />

            {/* 3. THE "CIRCUIT" GRID */}
            {/* Using a different pattern for Register: Crosses instead of squares */}
            <div className="absolute inset-0 z-0 opacity-40 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]"
                style={{ backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`, backgroundSize: '30px 30px' }}
            />

            {/* 4. OVERCLOCKED SCAN LINE (Double Speed) */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent absolute top-0 animate-[scan_3s_linear_infinite]" />
            </div>

            {/* 5. HEAVY NOISE TEXTURE */}
            <div className="absolute inset-0 z-40 opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* 6. VIGNETTE */}
            <div className="absolute inset-0 z-30 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        </div>
    );
}