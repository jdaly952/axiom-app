import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export const ShareButton = () => {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    return (
        <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-xs font-mono bg-accent/10 hover:bg-accent/20 text-accent p-2 rounded transition-colors"
        >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied ? 'Copied!' : 'Share'}
        </button>
    );
};
