import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, Upload, Loader2, AlertTriangle, CheckCircle, XCircle, MapPin } from 'lucide-react';

/**
 * Document Review - AI-Powered Contract Analysis
 * Upload documents for risk analysis and key term extraction
 */

const DocumentReview = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const legalContext = location.state?.legalContext || {};
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [documentText, setDocumentText] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Read file content for analysis
            const reader = new FileReader();
            reader.onload = (e) => setDocumentText(e.target.result);
            reader.readAsText(selectedFile);
        }
    };

    const analyzeDocument = async () => {
        setAnalyzing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulated AI analysis (in production, this would call the backend LLM)
        const mockAnalysis = {
            summary: "This appears to be a standard business contract with several clauses that require attention.",
            riskLevel: documentText.toLowerCase().includes('indemnif') ? 'high' :
                documentText.toLowerCase().includes('terminat') ? 'medium' : 'low',
            keyTerms: [
                { term: 'Payment Terms', found: documentText.toLowerCase().includes('payment'), status: 'neutral' },
                { term: 'Termination Clause', found: documentText.toLowerCase().includes('terminat'), status: 'warning' },
                { term: 'Indemnification', found: documentText.toLowerCase().includes('indemnif'), status: 'danger' },
                { term: 'Confidentiality', found: documentText.toLowerCase().includes('confidential'), status: 'good' },
                { term: 'Liability Limits', found: documentText.toLowerCase().includes('liabil'), status: 'warning' },
                { term: 'Dispute Resolution', found: documentText.toLowerCase().includes('arbitrat') || documentText.toLowerCase().includes('dispute'), status: 'neutral' }
            ].filter(t => t.found),
            warnings: [],
            recommendations: []
        };

        // Generate warnings based on content
        if (documentText.toLowerCase().includes('indemnif')) {
            mockAnalysis.warnings.push('Contains indemnification clause - review liability exposure carefully');
        }
        if (documentText.toLowerCase().includes('perpetual') || documentText.toLowerCase().includes('unlimited')) {
            mockAnalysis.warnings.push('Contract contains perpetual or unlimited terms');
        }
        if (!documentText.toLowerCase().includes('terminat')) {
            mockAnalysis.warnings.push('No clear termination clause found');
        }
        if (documentText.toLowerCase().includes('automatic renewal')) {
            mockAnalysis.warnings.push('Contains automatic renewal provisions');
        }

        // Recommendations
        mockAnalysis.recommendations = [
            'Have a licensed attorney review before signing',
            'Negotiate liability caps if indemnification is broad',
            'Clarify payment terms and late fee policies',
            'Ensure termination rights are balanced'
        ];

        setAnalysis(mockAnalysis);
        setAnalyzing(false);
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            default: return 'text-green-400 bg-green-500/10 border-green-500/30';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'danger': return <XCircle size={16} className="text-red-400" />;
            case 'warning': return <AlertTriangle size={16} className="text-amber-400" />;
            case 'good': return <CheckCircle size={16} className="text-green-400" />;
            default: return <FileText size={16} className="text-text-muted" />;
        }
    };

    return (
        <div className="min-h-screen w-full bg-bg-app overflow-auto">
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-bg-app to-bg-app"></div>
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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                <FileText size={22} className="text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-text-primary">Document Review</h1>
                        </div>
                    </div>

                    {legalContext.isComplete && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 glass rounded-full text-xs">
                            <MapPin size={12} className="text-blue-400" />
                            <span className="text-text-secondary">{legalContext.region}</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="px-6 py-12">
                <div className="max-w-3xl mx-auto">
                    {!analysis ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-2">Analyze Your Document</h2>
                            <p className="text-text-secondary mb-8">Upload a contract or legal document for AI-powered risk analysis.</p>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-glass-border rounded-xl p-12 text-center hover:border-blue-500/50 transition-colors cursor-pointer"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".txt,.doc,.docx,.pdf"
                                    className="hidden"
                                />
                                <Upload size={48} className="mx-auto text-text-muted mb-4" />
                                {file ? (
                                    <div>
                                        <p className="text-text-primary font-medium">{file.name}</p>
                                        <p className="text-text-muted text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-text-primary font-medium">Click to upload or drag and drop</p>
                                        <p className="text-text-muted text-sm">Supports TXT, DOC, DOCX, PDF</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3">
                                <AlertTriangle size={20} className="text-blue-400 mt-0.5" />
                                <p className="text-sm text-text-secondary">Document analysis runs locally in your browser. Your files are not stored on our servers (Ghost Protocol).</p>
                            </div>

                            <button
                                onClick={analyzeDocument}
                                disabled={!file || analyzing}
                                className="w-full mt-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {analyzing ? <><Loader2 size={20} className="animate-spin" />Analyzing...</> : <><FileText size={20} />Analyze Document</>}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            {/* Risk Level */}
                            <div className={`glass rounded-2xl p-6 border ${getRiskColor(analysis.riskLevel)}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary">Risk Assessment</h3>
                                        <p className="text-text-secondary text-sm">{file.name}</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-full font-bold uppercase text-sm ${getRiskColor(analysis.riskLevel)}`}>
                                        {analysis.riskLevel} Risk
                                    </div>
                                </div>
                                <p className="mt-4 text-text-secondary">{analysis.summary}</p>
                            </div>

                            {/* Key Terms */}
                            <div className="glass rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-text-primary mb-4">Key Terms Detected</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {analysis.keyTerms.map((term, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-bg-subtle/50 rounded-xl">
                                            {getStatusIcon(term.status)}
                                            <span className="text-text-primary">{term.term}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Warnings */}
                            {analysis.warnings.length > 0 && (
                                <div className="glass rounded-2xl p-6 border border-amber-500/30">
                                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                                        <AlertTriangle size={20} className="text-amber-400" />
                                        Warnings
                                    </h3>
                                    <ul className="space-y-2">
                                        {analysis.warnings.map((warning, i) => (
                                            <li key={i} className="text-text-secondary flex items-start gap-2">
                                                <span className="text-amber-400 mt-1">•</span>
                                                {warning}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Recommendations */}
                            <div className="glass rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                                    <CheckCircle size={20} className="text-green-400" />
                                    Recommendations
                                </h3>
                                <ul className="space-y-2">
                                    {analysis.recommendations.map((rec, i) => (
                                        <li key={i} className="text-text-secondary flex items-start gap-2">
                                            <span className="text-green-400 mt-1">✓</span>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={() => { setAnalysis(null); setFile(null); setDocumentText(''); }}
                                className="w-full py-4 glass rounded-xl text-text-secondary hover:text-text-primary transition-colors"
                            >
                                Analyze Another Document
                            </button>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DocumentReview;
