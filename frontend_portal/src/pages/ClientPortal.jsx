import React from 'react';
import GlassCard from '../ui/GlassCard';

/**
 * ClientPortal - Stub scaffold for the Client Portal tracking UI.
 *
 * Phase 5 (Horizon): This component will eventually display:
 * - Active case timeline with milestone tracking
 * - Document upload/download for client evidence
 * - Real-time status updates from the agent pipeline
 * - Attorney-client communication thread
 *
 * Currently renders a placeholder UI to validate routing and layout.
 */

const MOCK_MILESTONES = [
    { id: 1, label: 'Case Intake Complete', status: 'done', date: '2026-03-01' },
    { id: 2, label: 'Legal Research Filed', status: 'done', date: '2026-03-02' },
    { id: 3, label: 'Strategy Brief Drafted', status: 'active', date: null },
    { id: 4, label: 'Adversarial Review', status: 'pending', date: null },
    { id: 5, label: 'Demand Letter Sent', status: 'pending', date: null },
];

const statusColors = {
    done: 'text-emerald-400',
    active: 'text-cyan-400 animate-pulse',
    pending: 'text-white/30',
};

const ClientPortal = () => {
    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white/90">
                Client Portal
            </h1>
            <p className="text-white/50 text-sm">
                Track your case progress in real time. This feature is under development.
            </p>

            {/* Case Timeline */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-semibold text-white/80 mb-4">Case Timeline</h2>
                <div className="flex flex-col gap-3">
                    {MOCK_MILESTONES.map((m) => (
                        <div key={m.id} className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${m.status === 'done' ? 'bg-emerald-400' :
                                    m.status === 'active' ? 'bg-cyan-400 animate-pulse' :
                                        'bg-white/20'
                                }`} />
                            <span className={`text-sm ${statusColors[m.status]}`}>
                                {m.label}
                            </span>
                            {m.date && (
                                <span className="text-xs text-white/30 ml-auto">{m.date}</span>
                            )}
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Document Upload Placeholder */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-semibold text-white/80 mb-4">Evidence & Documents</h2>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
                    <p className="text-white/40 text-sm">
                        Document upload will be available in a future release.
                    </p>
                </div>
            </GlassCard>
        </div>
    );
};

export default ClientPortal;
