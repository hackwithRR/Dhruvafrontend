/**
 * PadhoyaarAI - Mindmap Viewer
 * Displays AI-generated mindmaps with zoom, pan, and download features
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mermaid from 'mermaid';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearchPlus,
    FaSearchMinus,
    FaExpand,
    FaCompress,
    FaSyncAlt,
    FaExclamationTriangle,
    FaLightbulb,
    FaBook,
    FaTimes,
    FaFileImage,
    FaFilePdf,
    FaFileAlt,
    FaList
} from 'react-icons/fa';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose'
});

const MindmapViewer = ({ mindmapData, theme = {}, chapterName = 'Chapter', subject = 'Subject', board = 'Board', classLevel = 'Class', onRegenerate }) => {
    const containerRef = useRef(null);
    const wrapperRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showKeyPoints, setShowKeyPoints] = useState(true);

    // Get actual chapter name from mindmap data
    const actualChapterName = useMemo(() => {
        if (mindmapData?.nodes?.[0]?.label) {
            return mindmapData.nodes[0].label;
        }
        return chapterName && chapterName !== 'Chapter' ? chapterName : 'Mindmap';
    }, [mindmapData, chapterName]);

    // Extract key points from mindmap data
    const keyPoints = useMemo(() => {
        if (!mindmapData?.nodes) return [];
        return mindmapData.nodes/*  */
            .filter(n => n.level === 1 || n.level === 2)
            .slice(0, 10)
            .map(n => {
                const label = n.label || '';
                const parts = label.split(/[:|\-–]/);
                return {
                    topic: parts[0]?.trim() || label,
                    explanation: parts[1]?.trim() || '',
                    level: n.level,
                    icon: n.level === 0 ? '📚' : n.level === 1 ? '💡' : '⭐'
                };
            });
    }, [mindmapData]);

    // Theme colors
    const themeColors = useMemo(() => {
        const isDark = theme.isDark !== false;
        return {
            bg: isDark ? 'bg-[#0a0a0f]' : 'bg-[#f8fafc]',
            card: isDark ? 'bg-white/[0.03]' : 'bg-white',
            text: isDark ? 'text-white' : 'text-slate-900',
            border: isDark ? 'border-white/10' : 'border-slate-200',
            primary: theme.primaryHex || '#4f46e5',
            accent: isDark ? 'text-indigo-400' : 'text-indigo-600',
            subtext: isDark ? 'text-white/60' : 'text-slate-600'
        };
    }, [theme]);

    // Render mindmap when data changes
    useEffect(() => {
        if (!mindmapData || !containerRef.current) return;
        renderMindmap(mindmapData);
    }, [mindmapData]);

    const renderMindmap = async (data) => {
        setIsLoading(true);
        setError(null);

        try {
            const diagram = buildDiagram(data);
            console.log('Rendering diagram:', diagram);

            containerRef.current.innerHTML = '';
            const id = 'mindmap-' + Date.now();
            const result = await mermaid.render(id, diagram);

            containerRef.current.innerHTML = result.svg;

            const svg = containerRef.current.querySelector('svg');
            if (svg) {
                svg.style.width = '100%';
                svg.style.height = '100%';
            }
        } catch (err) {
            console.error('Render error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Build Mermaid diagram from data - using LR (left-right) for better layout
    const buildDiagram = (data) => {
        if (!data || !data.nodes) {
            return `flowchart LR
    A["📚 ${actualChapterName}"] --> B["🔹 Introduction"]
    A --> C["🔹 Main Topics"]
    A --> D["🔹 Summary"]`;
        }

        const isDark = theme.isDark !== false;
        let diagram = 'flowchart LR\n';

        // Build nodes
        data.nodes.forEach((node, index) => {
            const nodeId = `N${index}`;
            let label = node.label || node.text || 'Topic';
            const parentId = node.parent !== undefined ? `N${node.parent}` : null;

            // Add icons based on level
            let icon = '';
            if (node.level === 0) icon = '📚 ';
            else if (node.level === 1) icon = '🔹 ';
            else icon = '• ';

            const displayLabel = label.length > 120 ? label.substring(0, 117) + '...' : label;


            if (node.level === 0) {
                diagram += `    ${nodeId}["${icon}${displayLabel}"]:::root\n`;
            } else if (node.level === 1) {
                diagram += `    ${nodeId}["${icon}${displayLabel}"]:::topic\n`;
            } else {
                diagram += `    ${nodeId}["${icon}${displayLabel}"]:::sub\n`;
            }

            if (parentId !== null) {
                diagram += `    ${parentId} --> ${nodeId}\n`;
            }
        });

        // Add styles
        const rootFill = isDark ? '#4f46e5' : '#6366f1';
        const topicFill = isDark ? '#312e81' : '#818cf8';
        const subFill = isDark ? '#1e1b4b' : '#c7d2fe';
        const textColor = isDark ? '#fff' : '#1e293b';

        diagram += `
    classDef root fill:${rootFill},stroke:${themeColors.primary},stroke-width:4px,color:${textColor},font-weight:bold
    classDef topic fill:${topicFill},stroke:${themeColors.primary},stroke-width:2px,color:${textColor},font-size:12px
    classDef sub fill:${subFill},stroke:${themeColors.primary},stroke-width:1px,color:${textColor},font-size:10px`;


        return diagram;
    };

    // Generate filename
    const getFilename = (suffix) => {
        const safeChapter = (actualChapterName || 'Chapter').replace(/\s+/g, '_');
        const safeSubject = (subject || 'Subject').replace(/\s+/g, '_');
        const safeBoard = (board || 'Board').replace(/\s+/g, '_');
        const safeClass = (classLevel || 'Class').toString().replace(/\s+/g, '_');
        return `${safeBoard}_${safeClass}_${safeSubject}_${safeChapter}_${suffix}`;
    };

    // Add watermark to canvas - Enhanced for more prominent branding
    const addWatermark = (canvas) => {
        const ctx = canvas.getContext('2d');
        ctx.save();

        // Calculate positions based on canvas size
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Position in bottom-right corner with padding - LARGER SIZE
        const padding = 40;
        const watermarkWidth = Math.min(280, canvasWidth * 0.35);
        const watermarkHeight = watermarkWidth * 0.45;
        const x = canvasWidth - watermarkWidth - padding;
        const y = canvasHeight - watermarkHeight - padding;

        // Semi-transparent overlay for better visibility
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 10, y - 10, watermarkWidth + 20, watermarkHeight + 20);

        // Background panel with gradient - MORE VIBRANT
        const gradient = ctx.createLinearGradient(x, y, x + watermarkWidth, y + watermarkHeight);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 1)');
        gradient.addColorStop(0.5, 'rgba(79, 70, 229, 1)');
        gradient.addColorStop(1, 'rgba(67, 56, 202, 1)');

        // Rounded rectangle background
        const radius = 16;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + watermarkWidth - radius, y);
        ctx.quadraticCurveTo(x + watermarkWidth, y, x + watermarkWidth, y + radius);
        ctx.lineTo(x + watermarkWidth, y + watermarkHeight - radius);
        ctx.quadraticCurveTo(x + watermarkWidth, y + watermarkHeight, x + watermarkWidth - radius, y + watermarkHeight);
        ctx.lineTo(x + radius, y + watermarkHeight);
        ctx.quadraticCurveTo(x, y + watermarkHeight, x, y + watermarkHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Border - THICKER AND BRIGHTER
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // "Generated by" text - LARGER
        ctx.font = `bold ${watermarkWidth * 0.11}px Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.textAlign = 'center';
        ctx.fillText('Generated by', x + watermarkWidth / 2, y + watermarkHeight * 0.25);

        // "PadhoyaarAI" main text - LARGER AND BOLDER
        ctx.font = `bold ${watermarkWidth * 0.22}px Arial, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PadhoyaarAI', x + watermarkWidth / 2, y + watermarkHeight * 0.52);

        // Tagline - LARGER
        ctx.font = `italic bold ${watermarkWidth * 0.09}px Arial, sans-serif`;
        ctx.fillStyle = 'rgba(199, 210, 254, 1)';
        ctx.fillText('Your AI Learning Companion', x + watermarkWidth / 2, y + watermarkHeight * 0.78);

        // Corner accent - top left - THICKER
        ctx.beginPath();
        ctx.moveTo(x + 12, y + watermarkHeight * 0.2);
        ctx.lineTo(x + 12, y + 12);
        ctx.lineTo(x + watermarkWidth * 0.2, y + 12);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Corner accent - bottom right - THICKER
        ctx.beginPath();
        ctx.moveTo(x + watermarkWidth - 12, y + watermarkHeight - watermarkHeight * 0.2);
        ctx.lineTo(x + watermarkWidth - 12, y + watermarkHeight - 12);
        ctx.lineTo(x + watermarkWidth - watermarkWidth * 0.2, y + watermarkHeight - 12);
        ctx.stroke();

        ctx.restore();
        return canvas;
    };

    // Download as PNG - FIXED to capture wrapper (includes stamp watermark)
    const downloadPNG = async () => {
        if (!wrapperRef.current) return;

        // Save current view state
        const currentScale = scale;
        const currentPosition = { ...position };
        const wasFullscreen = isFullscreen;

        try {
            // Enter fullscreen to show stamp watermark in the capture area
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setIsFullscreen(true);

            // Wait for fullscreen render
            await new Promise(resolve => setTimeout(resolve, 500));

            // Capture wrapper (includes stamp watermark) instead of just container
            const canvas = await html2canvas(wrapperRef.current, {
                scale: 2,
                backgroundColor: '#0a0a0f',
                logging: false,
                useCORS: true,
                allowTaint: true,
                background: '#0a0a0f'
            });

            // Add watermark (bottom-right panel)
            const watermarkedCanvas = addWatermark(canvas);

            const link = document.createElement('a');
            link.download = `${getFilename('mindmap')}.png`;
            link.href = watermarkedCanvas.toDataURL('image/png');
            link.click();

        } catch (err) {
            console.error('PNG download error:', err);
            // Fallback: try the SVG-to-canvas approach
            try {
                const svg = containerRef.current.querySelector('svg');
                if (!svg) {
                    alert('No mindmap to download');
                    return;
                }

                const padding = 40;
                let bbox;
                try {
                    bbox = svg.getBBox();
                } catch (e) {
                    bbox = { x: 0, y: 0, width: 800, height: 600 };
                }

                const svgWidth = bbox.width + (padding * 2);
                const svgHeight = bbox.height + (padding * 2);
                const offsetX = bbox.x - padding;
                const offsetY = bbox.y - padding;

                const svgClone = svg.cloneNode(true);
                svgClone.setAttribute('width', svgWidth);
                svgClone.setAttribute('height', svgHeight);
                svgClone.setAttribute('viewBox', `${offsetX} ${offsetY} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);

                const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                bgRect.setAttribute('x', offsetX);
                bgRect.setAttribute('y', offsetY);
                bgRect.setAttribute('width', svgWidth);
                bgRect.setAttribute('height', svgHeight);
                bgRect.setAttribute('fill', '#0a0a0f');
                svgClone.insertBefore(bgRect, svgClone.firstChild);

                const svgData = new XMLSerializer().serializeToString(svgClone);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);

                const img = new Image();
                img.crossOrigin = 'anonymous';

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = svgUrl;
                });

                const canvas = document.createElement('canvas');
                canvas.width = svgWidth * 2;
                canvas.height = svgHeight * 2;
                const ctx = canvas.getContext('2d');
                ctx.scale(2, 2);
                ctx.fillStyle = '#0a0a0f';
                ctx.fillRect(0, 0, svgWidth, svgHeight);
                ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

                URL.revokeObjectURL(svgUrl);

                const watermarkedCanvas = addWatermark(canvas);

                const link = document.createElement('a');
                link.download = `${getFilename('mindmap')}.png`;
                link.href = watermarkedCanvas.toDataURL('image/png');
                link.click();
            } catch (fallbackErr) {
                console.error('Fallback also failed:', fallbackErr);
                alert('Failed to export image. Please try again.');
            }
        } finally {
            // Restore previous view state
            setScale(currentScale);
            setPosition(currentPosition);
        }
    };

    // Download as PDF - uses html2canvas for reliability
    const downloadPDF = async () => {
        if (!containerRef.current) return;

        // Save current view state
        const currentScale = scale;
        const currentPosition = { ...position };

        try {
            // Reset to full view for capture
            setScale(1);
            setPosition({ x: 0, y: 0 });

            // Wait for render to complete
            await new Promise(resolve => setTimeout(resolve, 500));

            // Use html2canvas directly on the container
            const canvas = await html2canvas(containerRef.current, {
                scale: 2,
                backgroundColor: '#0a0a0f',
                logging: false,
                useCORS: true,
                allowTaint: true,
                background: '#0a0a0f'
            });

            // Add watermark
            const watermarkedCanvas = addWatermark(canvas);
            const imgData = watermarkedCanvas.toDataURL('image/png');

            // Calculate PDF dimensions based on image aspect ratio
            const imgAspect = canvas.width / canvas.height;
            let pdfWidth, pdfHeight;

            if (imgAspect > 1) {
                pdfWidth = 280;
                pdfHeight = 280 / imgAspect;
            } else {
                pdfHeight = 180;
                pdfWidth = 180 * imgAspect;
            }

            // Create PDF
            const pdf = new jsPDF({
                orientation: imgAspect > 1 ? 'landscape' : 'portrait',
                unit: 'mm',
                format: [pdfWidth + 20, pdfHeight + 60]
            });

            const w = pdf.internal.pageSize.getWidth();
            const h = pdf.internal.pageSize.getHeight();

            // Header with branding
            pdf.setFillColor(79, 70, 229);
            pdf.rect(0, 0, w, 15, 'F');

            pdf.setFontSize(10);
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.text('PadhoyaarAI', 5, 10);

            pdf.setFontSize(8);
            pdf.setTextColor(200, 200, 255);
            pdf.setFont('helvetica', 'normal');
            pdf.text(actualChapterName.substring(0, 30), w - 5, 10, { align: 'right' });

            // Mindmap image - centered
            const imgX = (w - pdfWidth) / 2;
            const imgY = 20;
            pdf.addImage(imgData, 'PNG', imgX, imgY, pdfWidth, pdfHeight);

            // Footer with branding
            pdf.setFillColor(79, 70, 229);
            pdf.rect(0, h - 12, w, 12, 'F');

            pdf.setFontSize(7);
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Generated by PadhoyaarAI - Your AI Learning Companion', w / 2, h - 6, { align: 'center' });

            // Stamp watermark in corner
            const stampX = w - 25;
            const stampY = h - 25;
            pdf.setDrawColor(239, 68, 68);
            pdf.setLineWidth(0.5);
            pdf.circle(stampX, stampY, 10, 'S');
            pdf.setFontSize(6);
            pdf.setTextColor(239, 68, 68);
            pdf.text('MADE BY', stampX, stampY - 5, { align: 'center' });
            pdf.setFontSize(7);
            pdf.text('PadhoyaarAI', stampX, stampY, { align: 'center' });

            pdf.save(`${getFilename('mindmap')}.pdf`);
        } catch (err) {
            console.error('PDF download error:', err);
            alert('Failed to download PDF. Please try again.');
        } finally {
            // Restore previous view state
            setScale(currentScale);
            setPosition(currentPosition);
        }
    };


    // Download key points as PDF
    const downloadKeyPoints = () => {
        if (!keyPoints.length) {
            alert('No key points available');
            return;
        }

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const w = pdf.internal.pageSize.getWidth();
            const h = pdf.internal.pageSize.getHeight();

            // Header
            pdf.setFillColor(79, 70, 229);
            pdf.rect(0, 0, w, 30, 'F');

            pdf.setFontSize(20);
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Key Points', 15, 18);

            // Chapter info
            pdf.setFillColor(245, 245, 255);
            pdf.rect(10, 35, w - 20, 25, 'F');
            pdf.setDrawColor(79, 70, 229);
            pdf.setLineWidth(0.5);
            pdf.rect(10, 35, w - 20, 25, 'S');

            pdf.setFontSize(14);
            pdf.setTextColor(79, 70, 229);
            pdf.setFont('helvetica', 'bold');
            const displayChapter = actualChapterName.length > 40 ? actualChapterName.substring(0, 37) + '...' : actualChapterName;
            pdf.text(displayChapter, 15, 48);

            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`${subject} • ${board || 'N/A'} • Class ${classLevel || 'N/A'}`, 15, 56);

            // Key points
            let y = 70;
            pdf.setFontSize(11);
            pdf.setTextColor(79, 70, 229);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Important Concepts:', 15, y);
            y += 10;

            keyPoints.forEach((point, idx) => {
                if (y > 260) {
                    pdf.addPage();
                    y = 20;
                }

                // Number circle
                pdf.setFillColor(79, 70, 229);
                pdf.circle(20, y - 2, 4, 'F');
                pdf.setFontSize(8);
                pdf.setTextColor(255, 255, 255);
                pdf.text(`${idx + 1}`, 20, y - 1, { align: 'center' });

                // Topic
                pdf.setFontSize(11);
                pdf.setTextColor(0, 0, 0);
                pdf.setFont('helvetica', 'bold');
                const cleanTopic = point.topic.replace(/[^\x00-\x7F]/g, '').trim();
                pdf.text(cleanTopic || 'Topic', 28, y);

                // Explanation
                if (point.explanation) {
                    y += 6;
                    pdf.setFontSize(10);
                    pdf.setTextColor(80, 80, 80);
                    pdf.setFont('helvetica', 'normal');

                    const cleanExplanation = point.explanation.replace(/[^\x00-\x7F]/g, '').trim();
                    const splitText = pdf.splitTextToSize(cleanExplanation, w - 40);
                    pdf.text(splitText, 28, y);
                    y += (splitText.length * 4.5) + 6;
                } else {
                    y += 10;
                }

                // Divider
                if (idx < keyPoints.length - 1) {
                    pdf.setDrawColor(230, 230, 230);
                    pdf.setLineWidth(0.3);
                    pdf.line(15, y - 3, w - 15, y - 3);
                }
            });

            // Footer
            pdf.setFillColor(79, 70, 229);
            pdf.rect(0, h - 20, w, 20, 'F');

            pdf.setFontSize(10);
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Generated by PadhoyaarAI', w / 2, h - 12, { align: 'center' });

            pdf.setFontSize(8);
            pdf.setTextColor(200, 200, 255);
            pdf.text('Your AI Learning Companion', w / 2, h - 6, { align: 'center' });

            // Stamp
            pdf.setDrawColor(239, 68, 68);
            pdf.setLineWidth(0.5);
            pdf.circle(w - 25, h - 15, 10, 'S');
            pdf.setFontSize(6);
            pdf.setTextColor(239, 68, 68);
            pdf.text('MADE BY', w - 25, h - 20, { align: 'center' });
            pdf.setFontSize(7);
            pdf.text('PadhoyaarAI', w - 25, h - 13, { align: 'center' });

            pdf.save(`${getFilename('key_points')}.pdf`);
        } catch (err) {
            console.error('Key points download error:', err);
            alert('Failed to download key points. Please try again.');
        }
    };

    // Zoom functions
    const zoomIn = () => setScale(s => Math.min(s + 0.2, 3));
    const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.3));

    const reset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    // Mouse event handlers
    const onMouseDown = useCallback((e) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }, [position]);

    const onMouseMove = useCallback((e) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }, [isDragging, dragStart]);

    const onMouseUp = useCallback(() => setIsDragging(false), []);

    const onWheel = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const d = e.deltaY > 0 ? -0.1 : 0.1;
            setScale(s => Math.min(Math.max(s + d, 0.3), 3));
        }
    }, []);

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-red-500/10 border border-red-500/30">
                <FaExclamationTriangle className="text-red-400 text-4xl mb-4" />
                <p className="text-red-400 font-bold">{error}</p>
                <button
                    onClick={onRegenerate}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // No data state
    if (!mindmapData) {
        return (
            <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/10">
                <p className="text-white/60">No mindmap data available</p>
                <button
                    onClick={onRegenerate}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
                >
                    Generate Mindmap
                </button>
            </div>
        );
    }

    return (
        <div
            ref={wrapperRef}
            className={`relative overflow-hidden rounded-3xl backdrop-blur-2xl ${themeColors.bg} border ${themeColors.border} ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}`}
        >
            {/* Header */}
            <div className={`absolute top-0 left-0 right-0 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gradient-to-b ${theme.isDark !== false ? 'from-black/40' : 'from-white/40'} to-transparent gap-3`}>
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${themeColors.primary}30` }}
                    >
                        <FaBook style={{ color: themeColors.primary }} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold uppercase ${themeColors.text}`}>Neural Mindmap</h3>
                        <p className={`text-[10px] ${themeColors.subtext}`}>{actualChapterName}</p>
                    </div>
                </div>

                {/* Control Buttons - Responsive */}
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end w-full sm:w-auto">

                    <button
                        onClick={zoomOut}
                        className={`p-2.5 rounded-xl hover:bg-white/10 ${themeColors.text} transition-all active:scale-95 hover:scale-105`}
                        title="Zoom Out"
                    >
                        <FaSearchMinus size={12} />
                    </button>

                    <span className={`text-xs font-bold ${themeColors.text} min-w-[40px] text-center`}>
                        {Math.round(scale * 100)}%
                    </span>

                    <button
                        onClick={zoomIn}
                        className={`p-2.5 rounded-xl hover:bg-white/10 ${themeColors.text} transition-all active:scale-95 hover:scale-105`}
                        title="Zoom In"
                    >
                        <FaSearchPlus size={12} />
                    </button>

                    <button
                        onClick={reset}
                        className={`p-2.5 rounded-xl hover:bg-white/10 ${themeColors.text} transition-all active:scale-95 hover:scale-105`}
                        title="Reset View"
                    >
                        <FaSyncAlt size={12} />
                    </button>

                    <div className={`w-px h-6 mx-1 ${theme.isDark !== false ? 'bg-white/10' : 'bg-slate-200'}`} />

                    <button
                        onClick={downloadPNG}
                        className="p-2 rounded-xl hover:bg-white/10 text-cyan-400 transition-all active:scale-95 hover:scale-105 sm:p-2.5"
                        title="Download PNG"
                    >
                        <FaFileImage size={12} className="sm:text-[14px]" />
                    </button>

                    <button
                        onClick={downloadPDF}
                        className="p-2 rounded-xl hover:bg-white/10 text-red-400 transition-all active:scale-95 hover:scale-105 sm:p-2.5"
                        title="Download PDF"
                    >
                        <FaFilePdf size={12} className="sm:text-[14px]" />
                    </button>


                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className={`p-2 rounded-xl hover:bg-white/10 ${themeColors.text} transition-all active:scale-95 hover:scale-105 sm:p-2.5`}
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? <FaCompress size={12} /> : <FaExpand size={12} />}
                    </button>

                    <div className={`hidden sm:block w-px h-6 mx-1 ${theme.isDark !== false ? 'bg-white/10' : 'bg-slate-200'}`} />

                    {/* Key Points Toggle Button */}
                    <button
                        onClick={() => setShowKeyPoints(!showKeyPoints)}
                        disabled={keyPoints.length === 0}
                        className={`p-2 rounded-xl transition-all active:scale-95 hover:scale-105 sm:p-2.5 ${keyPoints.length > 0
                            ? 'bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50'
                            : 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
                            }`}
                        title={keyPoints.length > 0 ? (showKeyPoints ? "Hide Key Points" : "Show Key Points") : "No key points"}
                    >
                        <FaList size={12} />
                    </button>

                    {/* Save Points Button */}
                    <button
                        onClick={downloadKeyPoints}
                        disabled={keyPoints.length === 0}
                        className={`p-2 rounded-xl transition-all active:scale-95 hover:scale-105 sm:p-2.5 ${keyPoints.length > 0
                            ? 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
                            : 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
                            }`}
                        title={keyPoints.length > 0 ? "Download Key Points" : "No key points"}
                    >
                        <FaFileAlt size={12} />
                    </button>

                </div>
            </div>


            {/* Loading */}
            {isLoading && (
                <div className={`absolute inset-0 flex items-center justify-center z-30 ${theme.isDark !== false ? 'bg-black/50' : 'bg-white/50'}`}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full"
                    />
                </div>
            )}

            {/* Mindmap Container */}
            <div
                className="w-full h-full min-h-[500px] cursor-grab active:cursor-grabbing pt-20 pb-4 px-4"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onWheel={onWheel}
            >
                <motion.div
                    ref={containerRef}
                    animate={{ x: position.x, y: position.y, scale }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    style={{ width: '100%', height: '100%', minHeight: '400px' }}
                />
            </div>

            {/* Key Points Panel */}
            <AnimatePresence>
                {!isFullscreen && showKeyPoints && keyPoints.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`absolute bottom-20 lg:top-20 right-4 z-10 w-72 max-h-[450px] overflow-y-auto ${themeColors.card} backdrop-blur-xl border ${themeColors.border} rounded-2xl shadow-2xl`}
                    >
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FaLightbulb style={{ color: themeColors.primary }} size={14} />
                                    <h4 className={`text-xs font-black uppercase tracking-wider ${themeColors.accent}`}>Key Points</h4>
                                </div>
                                <button
                                    onClick={() => setShowKeyPoints(false)}
                                    className={`p-1.5 rounded-lg hover:bg-white/10 ${themeColors.subtext} hover:${themeColors.text} transition-all active:scale-95`}
                                    title="Hide Key Points"
                                >
                                    <FaTimes size={12} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {keyPoints.map((point, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`p-3 rounded-xl ${theme.isDark !== false ? 'bg-white/5' : 'bg-slate-100'} border ${themeColors.border} hover:border-indigo-500/30 transition-colors`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg flex-shrink-0">{point.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-bold ${themeColors.text} leading-tight`}>
                                                    {point.topic}
                                                </p>
                                                {point.explanation && (
                                                    <p className={`text-[10px] ${themeColors.subtext} mt-1 leading-relaxed`}>
                                                        {point.explanation}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Circular Stamp Watermark */}
            <div className="absolute bottom-20 right-6 z-10 pointer-events-none select-none">
                <div className="relative w-24 h-24">
                    {/* Outer circle - dashed */}
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-red-500/80 bg-red-500/10" />

                    {/* Inner circle - solid */}
                    <div className="absolute inset-2 rounded-full border border-red-500/50" />

                    {/* Stamp content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-red-500/70 text-[8px] font-bold tracking-widest uppercase">Made By</span>
                        <span className="text-red-500 font-bold text-xs tracking-tight leading-tight">Padhoyaar</span>
                        <span className="text-red-500 font-bold text-[10px] tracking-tight">AI</span>
                        <span className="text-red-400/60 text-[7px] mt-0.5">
                            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MindmapViewer;
