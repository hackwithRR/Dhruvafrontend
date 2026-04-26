// src/components/ChatBubble.jsx
import React from "react";

/**
 * ChatBubble Component - Liquid Glass Design with Fluid Grouping
 * 
 * Features:
 * - Liquid Glass effect: backdrop-blur-xl, theme-aware colors
 * - Specular Rim: CSS ::before pseudo-element for light reflection
 * - Fluid Grouping: Consecutive AI messages merge visually
 * - Theme-aware: Adapts to all 20+ themes
 */
export default function ChatBubble({
    message,
    theme,
    children,
    isFirst = false,
    isLast = false,
    isGrouped = false
}) {
    const { role } = message;

    // Extract theme properties with fallbacks
    const activeTheme = theme || {};
    const isDark = activeTheme.isDark ?? true;
    const primaryHex = activeTheme.primaryHex || "#4f46e5";
    const accent = activeTheme.accent || "text-indigo-400";
    const text = activeTheme.text || "text-white";

    // --- FLUID GROUPING: Calculate border-radius based on position ---
    const getBorderRadius = () => {
        if (role === "user") {
            // User messages always have full radius on one side
            return "rounded-[2rem] rounded-tr-sm";
        }

        // AI messages with Fluid Grouping
        if (!isGrouped) {
            // Standalone AI message
            return "rounded-[2rem] rounded-tl-sm";
        }

        if (isFirst && isLast) {
            // Single message in group (treat as standalone)
            return "rounded-[2rem] rounded-tl-sm";
        }

        if (isFirst) {
            // First in group: round top, flat bottom
            return "rounded-t-[2rem] rounded-bl-sm rounded-br-none rounded-tl-sm";
        }

        if (isLast) {
            // Last in group: round bottom, flat top
            return "rounded-b-[2rem] rounded-tl-sm rounded-tr-none rounded-bl-sm";
        }

        // Middle of group: no vertical radius, only left edge hint
        return "rounded-none rounded-l-sm";
    };

    // --- BASE CLASSES ---
    const baseClasses = "relative max-w-[90%] md:max-w-[80%] shadow-2xl overflow-hidden";

    // --- THEME-AWARE LIQUID GLASS EFFECT ---
    const getLiquidGlassClasses = () => {
        if (role === "user") {
            // User messages use theme primary color
            return isDark
                ? "backdrop-blur-md border border-white/30"
                : "backdrop-blur-md border border-white/50";
        }
        // AI messages use theme-aware glass
        return isDark
            ? "backdrop-blur-xl bg-white/10 border border-white/20"
            : "backdrop-blur-xl bg-black/5 border border-black/10";
    };

    // --- PADDING ---
    const paddingClasses = "p-5 md:p-6";

    // --- SPECULAR RIM ::before PSEUDO-ELEMENT ---
    // Theme-aware highlight color
    const getSpecularRimStyle = () => {
        const highlightColor = isDark ? "255,255,255" : "0,0,0";
        const opacity = isDark ? "0.4,0.6,0.4" : "0.2,0.3,0.2";
        return {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent 0%, rgba(${highlightColor},${opacity.split(',')[0]}) 20%, rgba(${highlightColor},${opacity.split(',')[1]}) 50%, rgba(${highlightColor},${opacity.split(',')[2]}) 80%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 10,
        };
    };

    // --- EDGE HIGHLIGHT ::after PSEUDO-ELEMENT ---
    // Subtle side glow for glass depth
    const getEdgeGlowStyle = () => {
        const glowColor = isDark ? "255,255,255" : "0,0,0";
        return {
            content: '""',
            position: 'absolute',
            top: '10%',
            left: 0,
            width: '2px',
            height: '80%',
            background: `linear-gradient(180deg, transparent 0%, rgba(${glowColor},0.2) 30%, rgba(${glowColor},0.3) 50%, rgba(${glowColor},0.2) 70%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 9,
        };
    };

    // --- THEME-AWARE BOX SHADOW ---
    const getBoxShadow = () => {
        if (role === 'user') {
            // User messages glow with primary color
            return isDark
                ? `0 8px 32px ${primaryHex}40, inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px ${primaryHex}30`
                : `0 8px 32px ${primaryHex}30, inset 0 1px 0 rgba(255,255,255,0.3), 0 0 0 1px ${primaryHex}20`;
        }
        // AI messages have subtle depth
        return isDark
            ? `0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px rgba(255,255,255,0.05)`
            : `0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)`;
    };

    // --- USER MESSAGE BACKGROUND ---
    const getUserBackground = () => {
        return {
            backgroundColor: isDark ? `${primaryHex}dd` : primaryHex,
        };
    };

    const borderRadius = getBorderRadius();
    const liquidGlassClasses = getLiquidGlassClasses();
    const specularRimStyle = getSpecularRimStyle();
    const edgeGlowStyle = getEdgeGlowStyle();
    const boxShadow = getBoxShadow();
    const userBackground = role === 'user' ? getUserBackground() : {};

    return (
        <div
            className={`${baseClasses} ${liquidGlassClasses} ${paddingClasses} ${borderRadius} ${role === 'user' ? 'self-end' : 'self-start'} ${text}`}
            style={{
                boxShadow,
                ...userBackground,
            }}
        >
            {/* Specular Rim - Top highlight */}
            <div style={specularRimStyle} />

            {/* Edge Glow - Left side depth */}
            {role === 'ai' && <div style={edgeGlowStyle} />}

            {/* Content */}
            <div className="relative z-20">
                {children}
            </div>
        </div>
    );
}

