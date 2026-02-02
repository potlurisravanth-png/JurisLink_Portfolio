import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Globe, Scale, ChevronDown } from 'lucide-react';

/**
 * LegalGPS - Smart jurisdiction and issue selector
 * The "GPS" for navigating legal context
 */

// Jurisdiction data with regions
const JURISDICTIONS = {
    USA: {
        label: 'United States',
        flag: '🇺🇸',
        regions: [
            'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
            'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
            'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
            'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
            'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
            'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
            'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
            'Wisconsin', 'Wyoming', 'District of Columbia'
        ]
    },
    India: {
        label: 'India',
        flag: '🇮🇳',
        regions: [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
            'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
            'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
            'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
            'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi NCR'
        ]
    },
    UK: {
        label: 'United Kingdom',
        flag: '🇬🇧',
        regions: ['England', 'Wales', 'Scotland', 'Northern Ireland']
    },
    Canada: {
        label: 'Canada',
        flag: '🇨🇦',
        regions: [
            'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
            'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
            'Northwest Territories', 'Nunavut', 'Yukon'
        ]
    }
};

const LEGAL_ISSUES = [
    { id: 'tenant', label: 'Tenant Rights', icon: '🏠' },
    { id: 'employment', label: 'Employment Law', icon: '💼' },
    { id: 'ip', label: 'Intellectual Property', icon: '💡' },
    { id: 'traffic', label: 'Traffic / Accident', icon: '🚗' },
    { id: 'family', label: 'Family Law', icon: '👨‍👩‍👧' },
    { id: 'consumer', label: 'Consumer Protection', icon: '🛡️' },
    { id: 'custom', label: 'Custom Issue...', icon: '✏️' }
];

const SelectField = ({ label, icon: Icon, value, onChange, options, placeholder }) => (
    <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Icon size={14} className="text-accent-primary" />
            {label}
        </label>
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-3 bg-bg-subtle/50 border border-glass-border rounded-xl
                   text-text-primary appearance-none cursor-pointer
                   focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary
                   transition-all duration-200"
            >
                <option value="">{placeholder}</option>
                {options.map((opt) => (
                    <option key={typeof opt === 'string' ? opt : opt.id} value={typeof opt === 'string' ? opt : opt.id}>
                        {typeof opt === 'string' ? opt : `${opt.icon} ${opt.label}`}
                    </option>
                ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
    </div>
);

const LegalGPS = ({ onContextChange, className = '' }) => {
    const [jurisdiction, setJurisdiction] = useState('');
    const [region, setRegion] = useState('');
    const [issue, setIssue] = useState('');
    const [customIssue, setCustomIssue] = useState('');

    // Get regions for selected jurisdiction
    const regions = jurisdiction ? JURISDICTIONS[jurisdiction]?.regions || [] : [];

    // Reset region when jurisdiction changes
    useEffect(() => {
        setRegion('');
    }, [jurisdiction]);

    // Notify parent of context changes
    useEffect(() => {
        if (onContextChange) {
            onContextChange({
                jurisdiction: jurisdiction ? JURISDICTIONS[jurisdiction]?.label : '',
                jurisdictionCode: jurisdiction,
                region,
                issue: issue === 'custom' ? customIssue : LEGAL_ISSUES.find(i => i.id === issue)?.label || '',
                issueCode: issue,
                isComplete: !!(jurisdiction && region && (issue && (issue !== 'custom' || customIssue)))
            });
        }
    }, [jurisdiction, region, issue, customIssue, onContextChange]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`glass rounded-2xl p-6 ${className}`}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-blue-600 flex items-center justify-center">
                    <MapPin size={20} className="text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-text-primary">Legal GPS</h3>
                    <p className="text-xs text-text-muted">Set your legal context</p>
                </div>
            </div>

            {/* Selectors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectField
                    label="Jurisdiction"
                    icon={Globe}
                    value={jurisdiction}
                    onChange={setJurisdiction}
                    options={Object.entries(JURISDICTIONS).map(([code, data]) => ({
                        id: code,
                        label: data.label,
                        icon: data.flag
                    }))}
                    placeholder="Select Country"
                />

                <SelectField
                    label="Region"
                    icon={MapPin}
                    value={region}
                    onChange={setRegion}
                    options={regions}
                    placeholder={jurisdiction ? "Select State/Province" : "Choose country first"}
                />

                <SelectField
                    label="Legal Issue"
                    icon={Scale}
                    value={issue}
                    onChange={setIssue}
                    options={LEGAL_ISSUES}
                    placeholder="What's this about?"
                />
            </div>

            {/* Custom Issue Input */}
            {issue === 'custom' && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                >
                    <input
                        type="text"
                        value={customIssue}
                        onChange={(e) => setCustomIssue(e.target.value)}
                        placeholder="Describe your legal issue..."
                        className="w-full px-4 py-3 bg-bg-subtle/50 border border-glass-border rounded-xl
                       text-text-primary placeholder:text-text-muted
                       focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary
                       transition-all duration-200"
                    />
                </motion.div>
            )}

            {/* Status Indicator */}
            <div className="mt-4 pt-4 border-t border-glass-border flex items-center justify-between">
                <span className="text-xs text-text-muted">
                    {jurisdiction && region ? (
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Context: {JURISDICTIONS[jurisdiction]?.flag} {region}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Complete all fields for best results
                        </span>
                    )}
                </span>
            </div>
        </motion.div>
    );
};

export default LegalGPS;
