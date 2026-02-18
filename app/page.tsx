'use client';

import React from 'react';
import DoctorSection from './sections/DoctorSection';

export default function Home() {
  return (
    <div className="h-full w-full">
      <div className="page-width mx-auto">
        <DoctorSection />
      </div>
    </div>
  );
}

