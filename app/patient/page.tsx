'use client';

import React from 'react';
import PatientSection from '../sections/PatientSection';

export default function PatientPage() {
    return (
        <div className="h-full w-full">
            <div className="page-width mx-auto">
                <PatientSection />
            </div>
        </div>
    );
}
