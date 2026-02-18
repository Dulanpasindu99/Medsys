'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PatientProfileView } from './PatientProfileView';

export function PatientProfileModal({ profileId, onClose }: { profileId: string; onClose: () => void }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Prevent scrolling on body when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!profileId || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#F4F4F9] animate-in fade-in duration-200">
            {/* iOS Circular Close Button */}
            <button
                onClick={onClose}
                className="fixed top-6 right-6 z-[201] flex size-10 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition shadow-lg"
                aria-label="Close"
            >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Modal Content */}
            <div className="min-h-screen">
                <PatientProfileView profileId={profileId} onClose={onClose} />
            </div>
        </div>,
        document.body
    );
}
