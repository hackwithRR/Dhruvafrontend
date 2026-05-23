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
            bg: "bg-[#010204]",
            glow: "rgba(30, 58, 138, 0.4)", // Deep Blue
            blobs: ["bg-[#1e3a8a]/30", "bg-[#312e81]/30"], // Royal Navy & Indigo
            grid: "rgba(255, 255, 255, 0.02)",
            scan: "via-blue-900/20",
            accent: "text-blue-400"
        },
        Light: {
            // Glassmorphism: Pure White with "Studio" lighting
            bg: "bg-[#ffffff]",
            glow: "rgba(99, 102, 241, 0.15)",
            // These colors work best for the mouse-follow animation
            blobs: ["bg-[#e0e7ff]", "bg-[#fef3c7]"], // Soft Lavender & Pale Gold
            grid: "rgba(0, 0, 0, 0.03)",
            scan: "via-indigo-500/5",
            accent: "text-indigo-600"
        },
        Sakura: {
            // Light Cherry Blossom Theme
            bg: "bg-[#fff0f5]", // Lavender Blush
            glow: "rgba(255, 182, 193, 0.4)", // Light Pink glow
            blobs: ["bg-[#ffb7c5]/40", "bg-[#ffc0cb]/30"], // Cherry Blossom & Light Pink
            grid: "rgba(219, 112, 147, 0.08)",
            scan: "via-pink-400/20",
            accent: "text-pink-500"
        },

        Cyberpunk: {
            bg: "bg-[#020005]", // "Void" Black
            glow: "rgba(6, 182, 212, 0.35)", // Intense Cyan
            blobs: ["bg-[#0891b2]/20", "bg-[#c026d3]/20"], // Cyan & Fuchsia
            grid: "rgba(6, 182, 212, 0.12)", // Sharp, visible grid
            scan: "via-cyan-400/40", // Very fast/sharp scan line
            accent: "text-cyan-300"
        },
        PaperLight: {
            bg: "bg-[#fcfcf9]", // Off-white "Paper" feel
            glow: "rgba(79, 70, 229, 0.1)",
            blobs: ["bg-indigo-200/50", "bg-amber-100/50"], // Warm interactive spots
            grid: "rgba(0, 0, 0, 0.04)",
            scan: "via-indigo-500/10",
            accent: "text-indigo-600",
            // Logic: Use these blobs for your mouse-follow animation
            cursorBlob: "mix-blend-multiply filter blur-3xl opacity-60"
        },
        Coffee: {
            bg: "bg-[#0c0a09]", // Dark Roast
            glow: "rgba(214, 197, 187, 0.1)", // Creamy glow
            blobs: ["bg-[#44403c]", "bg-[#292524]"], // Stone & Mocha
            grid: "rgba(214, 197, 187, 0.03)",
            scan: "via-[#d6c5bb]/10",
            accent: "text-stone-300"
        },
        RoyalParchment: {
            bg: "bg-[#fdf6e3]", // Warm cream
            glow: "rgba(180, 83, 9, 0.15)", // Amber glow
            blobs: ["bg-[#fcd34d]/30", "bg-[#fbbf24]/20"], // Gold & Amber
            grid: "rgba(180, 83, 9, 0.04)",
            scan: "via-amber-500/10",
            accent: "text-amber-700"
        },
        MidnightAurora: {
            bg: "bg-[#010806]", // Deep emerald black
            glow: "rgba(16, 185, 129, 0.25)", // Emerald glow
            blobs: ["bg-[#064e3b]/40", "bg-[#065f46]/30"], // Deep emerald & teal
            grid: "rgba(16, 185, 129, 0.08)",
            scan: "via-emerald-500/20",
            accent: "text-emerald-400"
        },
        SunsetDrift: {
            bg: "bg-[#0f0402]", // Warm dark
            glow: "rgba(249, 115, 22, 0.25)", // Orange glow
            blobs: ["bg-[#431407]/40", "bg-[#7c2d12]/30"], // Deep orange & rust
            grid: "rgba(249, 115, 22, 0.06)",
            scan: "via-orange-500/20",
            accent: "text-orange-400"
        },
        Phantom: {
            bg: "bg-[#050505]", // Pure black
            glow: "rgba(255, 255, 255, 0.1)", // White glow
            blobs: ["bg-[#171717]/50", "bg-[#262626]/40"], // Neutral grays
            grid: "rgba(255, 255, 255, 0.03)",
            scan: "via-white/10",
            accent: "text-gray-400"
        },
        Solaris: {
            bg: "bg-[#050401]", // Dark gold-black
            glow: "rgba(250, 204, 21, 0.2)", // Gold glow
            blobs: ["bg-[#422006]/40", "bg-[#713f12]/30"], // Deep gold & amber
            grid: "rgba(250, 204, 21, 0.05)",
            scan: "via-yellow-500/15",
            accent: "text-yellow-400"
        },
        Aero: {
            bg: "bg-[#0f172a]", // Slate dark
            glow: "rgba(148, 163, 184, 0.2)", // Silver glow
            blobs: ["bg-[#1e293b]/50", "bg-[#334155]/40"], // Slate shades
            grid: "rgba(148, 163, 184, 0.06)",
            scan: "via-slate-400/15",
            accent: "text-slate-300"
        },
        Toxic: {
            bg: "bg-[#020500]", // Dark lime-black
            glow: "rgba(163, 230, 53, 0.25)", // Lime glow
            blobs: ["bg-[#14532d]/40", "bg-[#166534]/30"], // Deep green shades
            grid: "rgba(163, 230, 53, 0.08)",
            scan: "via-lime-500/20",
            accent: "text-lime-400"
        },
        Synthwave: {
            bg: "bg-[#120422]", // Purple dark
            glow: "rgba(34, 211, 238, 0.3)", // Cyan glow
            blobs: ["bg-[#2e1065]/50", "bg-[#4c1d95]/40"], // Deep purple shades
            grid: "rgba(168, 85, 247, 0.08)",
            scan: "via-fuchsia-500/20",
            accent: "text-fuchsia-400"
        },
        RetroTerminal: {
            bg: "bg-[#0a0f0a]", // Dark green-black
            glow: "rgba(34, 197, 94, 0.25)", // Green glow
            blobs: ["bg-[#052e16]/50", "bg-[#14532d]/40"], // Deep green shades
            grid: "rgba(34, 197, 94, 0.08)",
            scan: "via-green-500/20",
            accent: "text-green-400"
        },
        Amethyst: {
            bg: "bg-[#0d0214]", // Deep purple-black
            glow: "rgba(192, 132, 252, 0.25)", // Light purple glow
            blobs: ["bg-[#3b0764]/50", "bg-[#581c87]/40"], // Deep purple shades
            grid: "rgba(168, 85, 247, 0.06)",
            scan: "via-purple-500/20",
            accent: "text-purple-400"
        },
        Blueprint: {
            bg: "bg-[#1e40af]", // Blueprint blue
            glow: "rgba(255, 255, 255, 0.15)", // White glow
            blobs: ["bg-[#1e3a8a]/50", "bg-[#172554]/40"], // Blue shades
            grid: "rgba(255, 255, 255, 0.1)",
            scan: "via-white/20",
            accent: "text-blue-100"
        },
        Clay: {
            bg: "bg-[#e5e5e1]", // Light stone
            glow: "rgba(87, 83, 78, 0.1)", // Stone glow
            blobs: ["bg-[#d1d1cc]/50", "bg-[#a8a29e]/30"], // Stone shades
            grid: "rgba(87, 83, 78, 0.04)",
            scan: "via-stone-500/10",
            accent: "text-stone-600"
        },
        Radioactive: {
            bg: "bg-[#bef264]", // Lime background
            glow: "rgba(0, 0, 0, 0.15)", // Dark glow
            blobs: ["bg-[#a3e635]/50", "bg-[#84cc16]/40"], // Lime shades
            grid: "rgba(0, 0, 0, 0.06)",
            scan: "via-black/10",
            accent: "text-lime-900"
        },
        CrimsonOLED: {
            bg: "bg-[#000000]", // Pure black OLED
            glow: "rgba(220, 38, 38, 0.2)", // Red glow
            blobs: ["bg-[#450a0a]/50", "bg-[#7f1d1d]/40"], // Deep red shades
            grid: "rgba(220, 38, 38, 0.05)",
            scan: "via-red-500/15",
            accent: "text-red-500"
        },
        Industrial: {
            bg: "bg-[#1c1c1c]", // Industrial gray
            glow: "rgba(249, 115, 22, 0.2)", // Orange glow
            blobs: ["bg-[#262626]/50", "bg-[#404040]/40"], // Gray shades
            grid: "rgba(249, 115, 22, 0.06)",
            scan: "via-orange-500/15",
            accent: "text-orange-400"
        },
        MidnightSun: {
            bg: "bg-[#1a0b2e]", // Deep purple
            glow: "rgba(251, 191, 36, 0.25)", // Amber glow
            blobs: ["bg-[#4c1d95]/50", "bg-[#5b21b6]/40"], // Purple shades
            grid: "rgba(251, 191, 36, 0.06)",
            scan: "via-amber-500/15",
            accent: "text-amber-300"
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
            <div className="absolute inset-0 z-40 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcnVzU2VuaXN0aXZpdHkiIGJhc2VGcmVxdWVuY3k9IjEuNCIgc3RhbmRhcmREZXZpYXRpb249IjAuNjMiIHNlZWQ9IjEwIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjxmZUNvbG9yTWF0cml4IHR5cGU9Imx1bWluYW5jZVRvQWxwaGEiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIi8+PC9zdmc+')] bg-repeat" />
        </div>
    );
}
