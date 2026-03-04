import React, { useRef, useState } from 'react';
import GlassCard from '../ui/GlassCard';

/**
 * ESignaturePad - Stub scaffold for the E-Signature component.
 *
 * Phase 5 (Horizon): This component will eventually provide:
 * - Canvas-based signature capture
 * - Touch and stylus support for mobile/tablet
 * - Signature validation and timestamping
 * - Integration with demand letter PDF generation
 *
 * Currently renders a placeholder canvas to validate layout and routing.
 */

const ESignaturePad = ({ onSign, documentTitle = 'Document' }) => {
    const canvasRef = useRef(null);
    const [signed, setSigned] = useState(false);

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setSigned(false);
    };

    const handleSign = () => {
        setSigned(true);
        if (onSign) {
            onSign({
                timestamp: new Date().toISOString(),
                documentTitle,
                signatureData: '[STUB] Signature data placeholder',
            });
        }
    };

    return (
        <GlassCard className="p-6 max-w-lg mx-auto">
            <h2 className="text-lg font-semibold text-white/80 mb-2">
                E-Signature
            </h2>
            <p className="text-white/40 text-xs mb-4">
                Sign below to authorize: <span className="text-white/60">{documentTitle}</span>
            </p>

            {/* Signature Canvas */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-1 mb-4">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="w-full rounded-lg cursor-crosshair"
                    style={{ touchAction: 'none' }}
                />
            </div>

            {/* Status */}
            {signed && (
                <p className="text-emerald-400 text-xs mb-3">
                    Signature captured. This is a placeholder -- real capture coming soon.
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleClear}
                    className="px-4 py-2 text-xs rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
                >
                    Clear
                </button>
                <button
                    onClick={handleSign}
                    className="px-4 py-2 text-xs rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                >
                    Sign Document
                </button>
            </div>
        </GlassCard>
    );
};

export default ESignaturePad;
