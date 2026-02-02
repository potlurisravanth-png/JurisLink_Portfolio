import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Download, Loader2, CheckCircle, MapPin, AlertTriangle } from 'lucide-react';

/**
 * Tenant Notice Generator - Handle Landlord Disputes
 * Creates formal notice letters for common tenant issues
 */

const NOTICE_TYPES = [
    { id: 'repair', label: 'Request for Repairs', description: 'Notify landlord of needed repairs' },
    { id: 'deposit', label: 'Security Deposit Demand', description: 'Request return of security deposit' },
    { id: 'harassment', label: 'Cease Harassment', description: 'Document landlord harassment' },
    { id: 'privacy', label: 'Privacy Violation', description: 'Improper entry complaints' },
    { id: 'habitability', label: 'Habitability Complaint', description: 'Uninhabitable conditions' }
];

const TenantNotice = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const legalContext = location.state?.legalContext || {};

    const [formData, setFormData] = useState({
        noticeType: '',
        tenantName: '',
        tenantAddress: '',
        landlordName: '',
        landlordAddress: '',
        issueDescription: '',
        demandedAction: '',
        deadline: '14'
    });
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [noticeContent, setNoticeContent] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const generateNotice = async () => {
        setGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 1200));

        const selectedType = NOTICE_TYPES.find(t => t.id === formData.noticeType);
        const state = legalContext.region || '[STATE]';
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const content = `
${formData.tenantName}
${formData.tenantAddress}

${today}

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

${formData.landlordName}
${formData.landlordAddress}

RE: FORMAL NOTICE - ${selectedType?.label.toUpperCase()}

Dear ${formData.landlordName}:

I am a tenant at the above address and am writing to formally notify you of the following matter:

DESCRIPTION OF ISSUE:
${formData.issueDescription}

DEMANDED ACTION:
${formData.demandedAction}

LEGAL NOTICE:
Pursuant to ${state} landlord-tenant law, you are hereby given ${formData.deadline} days from receipt of this letter to address this matter. Failure to respond may result in the following remedies available to me under law:

• Filing a complaint with the local housing authority
• Exercising repair and deduct rights where permitted
• Seeking legal action for damages
• Withholding rent in accordance with state law
• Terminating the lease for material breach

Please respond in writing within ${formData.deadline} days to confirm your planned course of action.

I am documenting all communications regarding this matter. This letter serves as formal written notice as required by ${state} law.

Sincerely,

_____________________________
${formData.tenantName}
Tenant

CC: [Local Housing Authority]
    [Personal Records]

---
PROOF OF SERVICE
I certify that this notice was sent on ${today} via:
☐ Certified Mail, Return Receipt Requested
☐ Personal Delivery
☐ Posted on Premises (if permitted by law)
`;

        setNoticeContent(content);
        setGenerated(true);
        setGenerating(false);
    };

    const downloadNotice = () => {
        const blob = new Blob([noticeContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Tenant_Notice_${formData.noticeType}_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen w-full bg-bg-app overflow-auto">
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-bg-app to-bg-app"></div>
            </div>

            <header className="sticky top-0 z-20 px-6 py-4 glass border-b border-glass-border">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
                            <ArrowLeft size={20} />
                            <span>Tools</span>
                        </button>
                        <div className="w-px h-6 bg-glass-border" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                <Home size={22} className="text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-text-primary">Tenant Notice</h1>
                        </div>
                    </div>

                    {legalContext.isComplete && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 glass rounded-full text-xs">
                            <MapPin size={12} className="text-amber-400" />
                            <span className="text-text-secondary">{legalContext.region}</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="px-6 py-12">
                <div className="max-w-2xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8">
                        {!generated ? (
                            <>
                                <div className="flex items-start gap-3 mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                    <AlertTriangle size={20} className="text-amber-400 mt-0.5" />
                                    <p className="text-sm text-text-secondary">This tool generates formal notice templates. For serious legal matters, consult with a licensed attorney.</p>
                                </div>

                                <h2 className="text-2xl font-bold text-text-primary mb-6">Create Tenant Notice</h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-3">Type of Notice</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {NOTICE_TYPES.map(type => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => setFormData({ ...formData, noticeType: type.id })}
                                                    className={`p-4 rounded-xl border text-left transition-all ${formData.noticeType === type.id
                                                            ? 'border-amber-500 bg-amber-500/10'
                                                            : 'border-glass-border hover:border-amber-500/50'
                                                        }`}
                                                >
                                                    <div className="font-medium text-text-primary">{type.label}</div>
                                                    <div className="text-sm text-text-muted">{type.description}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">Your Name</label>
                                            <input type="text" name="tenantName" value={formData.tenantName} onChange={handleChange} placeholder="Full Legal Name" className="w-full px-4 py-3 bg-bg-subtle/50 border border-glass-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">Landlord Name</label>
                                            <input type="text" name="landlordName" value={formData.landlordName} onChange={handleChange} placeholder="Landlord/Property Manager" className="w-full px-4 py-3 bg-bg-subtle/50 border border-glass-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Your Address</label>
                                        <input type="text" name="tenantAddress" value={formData.tenantAddress} onChange={handleChange} placeholder="Rental Property Address" className="w-full px-4 py-3 bg-bg-subtle/50 border border-glass-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Landlord Address</label>
                                        <input type="text" name="landlordAddress" value={formData.landlordAddress} onChange={handleChange} placeholder="Where to send notice" className="w-full px-4 py-3 bg-bg-subtle/50 border border-glass-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Issue Description</label>
                                        <textarea name="issueDescription" value={formData.issueDescription} onChange={handleChange} rows={3} placeholder="Describe the issue in detail..." className="w-full px-4 py-3 bg-bg-subtle/50 border border-glass-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Demanded Action</label>
                                        <textarea name="demandedAction" value={formData.demandedAction} onChange={handleChange} rows={2} placeholder="What do you want the landlord to do?" className="w-full px-4 py-3 bg-bg-subtle/50 border border-glass-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
                                    </div>

                                    <button
                                        onClick={generateNotice}
                                        disabled={!formData.noticeType || !formData.tenantName || !formData.issueDescription || generating}
                                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {generating ? <><Loader2 size={20} className="animate-spin" />Generating...</> : <><Home size={20} />Generate Notice</>}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-6">
                                    <CheckCircle size={32} className="text-green-400" />
                                    <div>
                                        <h2 className="text-2xl font-bold text-text-primary">Notice Ready!</h2>
                                        <p className="text-text-secondary">Review and download your formal notice.</p>
                                    </div>
                                </div>

                                <pre className="bg-bg-subtle/50 border border-glass-border rounded-xl p-4 text-sm text-text-secondary overflow-auto max-h-96 mb-6 whitespace-pre-wrap">{noticeContent}</pre>

                                <div className="flex gap-4">
                                    <button onClick={downloadNotice} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                                        <Download size={20} />Download Notice
                                    </button>
                                    <button onClick={() => { setGenerated(false); setNoticeContent(''); }} className="px-6 py-3 glass rounded-xl text-text-secondary hover:text-text-primary transition-colors">Create Another</button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default TenantNotice;
