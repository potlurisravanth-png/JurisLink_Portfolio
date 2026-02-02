import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Download, Loader2, CheckCircle, MapPin } from 'lucide-react';

/**
 * NDA Generator - Create Non-Disclosure Agreements
 * Uses GPS context for jurisdiction-specific language
 */

const NDAGenerator = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const legalContext = location.state?.legalContext || {};

    const [formData, setFormData] = useState({
        disclosingParty: '',
        receivingParty: '',
        purpose: '',
        duration: '2',
        effectiveDate: new Date().toISOString().split('T')[0],
        confidentialInfo: 'trade secrets, business plans, customer lists, financial information, and technical data'
    });
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [ndaContent, setNdaContent] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const generateNDA = async () => {
        setGenerating(true);

        // Simulate generation (in production, this would call the backend)
        await new Promise(resolve => setTimeout(resolve, 1500));

        const jurisdiction = legalContext.jurisdiction || 'the applicable jurisdiction';
        const state = legalContext.region || 'the relevant state';

        const content = `
NON-DISCLOSURE AGREEMENT

Effective Date: ${formData.effectiveDate}

This Non-Disclosure Agreement ("Agreement") is entered into by and between:

DISCLOSING PARTY: ${formData.disclosingParty}
RECEIVING PARTY: ${formData.receivingParty}

1. PURPOSE
The parties wish to explore a potential business relationship concerning: ${formData.purpose}

2. CONFIDENTIAL INFORMATION
"Confidential Information" means any non-public information disclosed by the Disclosing Party, including but not limited to: ${formData.confidentialInfo}.

3. OBLIGATIONS
The Receiving Party agrees to:
(a) Hold all Confidential Information in strict confidence;
(b) Not disclose any Confidential Information to third parties;
(c) Use Confidential Information only for the Purpose stated above;
(d) Protect Confidential Information with the same degree of care used to protect its own confidential information.

4. TERM
This Agreement shall remain in effect for ${formData.duration} year(s) from the Effective Date.

5. GOVERNING LAW
This Agreement shall be governed by the laws of ${state}, ${jurisdiction}.

6. REMEDIES
The parties acknowledge that breach of this Agreement may cause irreparable harm, and the Disclosing Party shall be entitled to seek equitable relief, including injunction.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.


_____________________________          _____________________________
${formData.disclosingParty}                    ${formData.receivingParty}
(Disclosing Party)                     (Receiving Party)

Date: _______________                  Date: _______________
`;

        setNdaContent(content);
        setGenerated(true);
        setGenerating(false);
    };

    const downloadNDA = () => {
        const blob = new Blob([ndaContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NDA_${formData.disclosingParty.replace(/\s+/g, '_')}_${formData.receivingParty.replace(/\s+/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen w-full bg-bg-app overflow-auto">
            {/* Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-bg-app to-bg-app"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-20 px-6 py-4 glass border-b border-glass-border">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Tools</span>
                        </button>
                        <div className="w-px h-6 bg-glass-border" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Shield size={22} className="text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-text-primary">NDA Generator</h1>
                        </div>
                    </div>

                    {legalContext.isComplete && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 glass rounded-full text-xs">
                            <MapPin size={12} className="text-purple-400" />
                            <span className="text-text-secondary">{legalContext.region}, {legalContext.jurisdiction}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Main */}
            <main className="px-6 py-12">
                <div className="max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl p-8"
                    >
                        {!generated ? (
                            <>
                                <h2 className="text-2xl font-bold text-text-primary mb-2">Create Your NDA</h2>
                                <p className="text-text-secondary mb-8">Fill in the details below to generate a legally-formatted Non-Disclosure Agreement.</p>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">Disclosing Party</label>
                                            <input
                                                type="text"
                                                name="disclosingParty"
                                                value={formData.disclosingParty}
                                                onChange={handleChange}
                                                placeholder="Company or Person Name"
                                                className="w-full px-4 py-3 bg-bg-subtle/50 border border-glass-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">Receiving Party</label>
                                            <input
                                                type="text"
                                                name="receivingParty"
                                                value={formData.receivingParty}
                                                onChange={handleChange}
                                                placeholder="Company or Person Name"
                                                className="w-full px-4 py-3 bg-bg-subtle/50 border border-glass-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Purpose of Disclosure</label>
                                        <input
                                            type="text"
                                            name="purpose"
                                            value={formData.purpose}
                                            onChange={handleChange}
                                            placeholder="e.g., Exploring potential partnership, Investment discussions"
                                            className="w-full px-4 py-3 bg-bg-subtle/50 border border-glass-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">Duration (Years)</label>
                                            <select
                                                name="duration"
                                                value={formData.duration}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-bg-subtle/50 border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            >
                                                <option value="1">1 Year</option>
                                                <option value="2">2 Years</option>
                                                <option value="3">3 Years</option>
                                                <option value="5">5 Years</option>
                                                <option value="perpetual">Perpetual</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">Effective Date</label>
                                            <input
                                                type="date"
                                                name="effectiveDate"
                                                value={formData.effectiveDate}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-bg-subtle/50 border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={generateNDA}
                                        disabled={!formData.disclosingParty || !formData.receivingParty || !formData.purpose || generating}
                                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Shield size={20} />
                                                Generate NDA
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-6">
                                    <CheckCircle size={32} className="text-green-400" />
                                    <div>
                                        <h2 className="text-2xl font-bold text-text-primary">NDA Generated!</h2>
                                        <p className="text-text-secondary">Your agreement is ready to download.</p>
                                    </div>
                                </div>

                                <pre className="bg-bg-subtle/50 border border-glass-border rounded-xl p-4 text-sm text-text-secondary overflow-auto max-h-96 mb-6 whitespace-pre-wrap">
                                    {ndaContent}
                                </pre>

                                <div className="flex gap-4">
                                    <button
                                        onClick={downloadNDA}
                                        className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        <Download size={20} />
                                        Download NDA
                                    </button>
                                    <button
                                        onClick={() => { setGenerated(false); setNdaContent(''); }}
                                        className="px-6 py-3 glass rounded-xl text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        Create Another
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default NDAGenerator;
