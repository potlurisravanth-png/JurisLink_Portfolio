import React, { useState } from 'react';
import { Briefcase, Download, FileText, Activity } from 'lucide-react';
import Button from '../ui/Button';
import { downloadPDF } from '../../api';

const IntelligencePanel = ({ facts, strategy, caseId, lastUpdated, currentUser }) => {
    const [downloadStatus, setDownloadStatus] = useState('idle');

    const handleDownloadPDF = async () => {
        if (!caseId || caseId === 'new') {
            alert('Please start a conversation first to generate a case brief.');
            return;
        }

        try {
            setDownloadStatus('generating');
            const userId = currentUser?.uid || 'guest-user';
            const blob = await downloadPDF(userId, caseId, facts, strategy, null);

            // Create object URL and open
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `JurisLink_Case_${caseId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to download PDF. Please try again.");
        } finally {
            setDownloadStatus('idle');
        }
    };

    const getCaseStatus = () => {
        if (!facts || Object.keys(facts).length === 0) return { label: 'New Case', color: 'text-text-muted', bg: 'bg-white/5' };
        if (facts.status === 'COMPLETE') return { label: 'Analysis Complete', color: 'text-green-400', bg: 'bg-green-500/10' };
        const factCount = Object.keys(facts).filter(k => k !== 'status' && facts[k]).length;
        if (factCount < 3) return { label: 'Gathering Facts', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
        return { label: 'Facts Collected', color: 'text-blue-400', bg: 'bg-blue-500/10' };
    };

    const formatFactKey = (key) => key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

    const displayCaseId = caseId && caseId !== 'new' ? caseId.slice(0, 8).toUpperCase() : 'NEW';
    const status = getCaseStatus();

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="p-5 border-b border-glass-border bg-glass-highlight">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-text-secondary uppercase tracking-widest">Case Intelligence</h2>
                    <Activity size={16} className="text-accent-primary animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-text-primary tracking-tight">#{displayCaseId}</h1>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-xs font-mono font-medium ${status.bg} ${status.color}`}>
                        {status.label}
                    </div>
                </div>
            </div>

            {/* Content Scroller */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
                {/* Extracted Facts */}
                <section>
                    <div className="flex items-center gap-2 mb-3 px-1 text-text-muted">
                        <FileText size={14} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Key Facts</h3>
                    </div>

                    {Object.keys(facts).length > 0 ? (
                        <div className="space-y-2">
                            {Object.entries(facts).filter(([k]) => k !== 'status').map(([key, value]) => (
                                <div key={key} className="glass p-3 rounded-xl transition-all hover:bg-white/5">
                                    <span className="block text-[10px] font-bold text-text-muted uppercase mb-1">{formatFactKey(key)}</span>
                                    <p className="text-sm text-text-primary leading-relaxed">{String(value)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 border border-dashed border-glass-border rounded-xl">
                            <Briefcase size={24} className="mx-auto text-text-muted opacity-30 mb-2" />
                            <p className="text-xs text-text-muted">No facts gathered yet.</p>
                        </div>
                    )}
                </section>

                {/* Strategy (if available) */}
                {strategy && (
                    <section>
                        <div className="flex items-center gap-2 mb-3 px-1 text-text-muted">
                            <Activity size={14} />
                            <h3 className="text-xs font-bold uppercase tracking-wider">Strategic Brief</h3>
                        </div>
                        <div className="glass p-4 rounded-xl border-l-2 border-accent-primary bg-accent-primary/5">
                            <p className="text-sm text-text-secondary leading-relaxed line-clamp-6">{strategy}</p>
                        </div>
                    </section>
                )}
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-glass-border bg-black/20">
                <Button
                    variant="primary"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none"
                    onClick={handleDownloadPDF}
                    disabled={!caseId || caseId === 'new' || downloadStatus === 'generating'}
                    icon={Download}
                >
                    {downloadStatus === 'generating' ? 'Generating Brief...' : 'Download Official Brief'}
                </Button>
                {lastUpdated && (
                    <p className="text-[10px] text-center text-text-muted mt-2">
                        Updated {new Date(lastUpdated).toLocaleTimeString()}
                    </p>
                )}
            </div>
        </div>
    );
};

export default IntelligencePanel;
