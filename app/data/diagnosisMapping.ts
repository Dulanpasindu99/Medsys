export interface ClinicalDrug {
    drug: string;
    dose: string;
    terms: string;
    amount: string;
    source: 'Clinical' | 'Outside';
}

export const DIAGNOSIS_MAPPING: Record<string, ClinicalDrug[]> = {
    // Infections
    'fever': [
        { drug: 'Paracetamol', dose: '500MG', terms: 'TDS', amount: '10', source: 'Clinical' }
    ],
    'dengue': [
        { drug: 'Paracetamol', dose: '500MG', terms: 'TDS', amount: '20', source: 'Clinical' },
        { drug: 'Domperidone', dose: '10MG', terms: 'TDS', amount: '10', source: 'Clinical' },
        { drug: 'ORS', dose: '1PKT', terms: 'Daily', amount: '5', source: 'Outside' }
    ],
    'typhoid': [
        { drug: 'Ciprofloxacin', dose: '500MG', terms: 'BD', amount: '14', source: 'Clinical' },
        { drug: 'Paracetamol', dose: '500MG', terms: 'TDS', amount: '15', source: 'Clinical' }
    ],
    'respiratory': [
        { drug: 'Amoxicillin', dose: '500MG', terms: 'TDS', amount: '15', source: 'Clinical' },
        { drug: 'Salbutamol', dose: '2MG', terms: 'TDS', amount: '15', source: 'Clinical' }
    ],
    'cough': [
        { drug: 'Dextromethorphan', dose: '10ML', terms: 'TDS', amount: '1', source: 'Clinical' },
        { drug: 'Amoxicillin', dose: '500MG', terms: 'TDS', amount: '15', source: 'Clinical' },
        { drug: 'Cetirizine', dose: '10MG', terms: 'Night', amount: '5', source: 'Clinical' }
    ],
    'pneumonia': [
        { drug: 'Azithromycin', dose: '500MG', terms: 'Daily', amount: '3', source: 'Outside' },
        { drug: 'Amoxicillin + Clavulanic Acid', dose: '625MG', terms: 'BD', amount: '10', source: 'Outside' }
    ],

    // Gastrointestinal
    'gastritis': [
        { drug: 'Omeprazole', dose: '20MG', terms: 'BD', amount: '14', source: 'Clinical' },
        { drug: 'Antacid Syrup', dose: '10ML', terms: 'TDS', amount: '1', source: 'Clinical' },
        { drug: 'Domperidone', dose: '10MG', terms: 'TDS', amount: '10', source: 'Clinical' }
    ],
    'gerd': [
        { drug: 'Esomeprazole', dose: '40MG', terms: 'Daily', amount: '14', source: 'Clinical' },
        { drug: 'Gaviscon', dose: '10ML', terms: 'TDS', amount: '1', source: 'Outside' }
    ],
    'diarrhea': [
        { drug: 'ORS', dose: '1PKT', terms: 'Ad Lib', amount: '5', source: 'Clinical' },
        { drug: 'Loperamide', dose: '2MG', terms: 'Stat', amount: '2', source: 'Clinical' },
        { drug: 'Zinc', dose: '20MG', terms: 'Daily', amount: '10', source: 'Clinical' }
    ],

    // Chronic
    'hypertension': [
        { drug: 'Amlodipine', dose: '5MG', terms: 'Daily', amount: '30', source: 'Clinical' },
        { drug: 'Losartan', dose: '50MG', terms: 'Daily', amount: '30', source: 'Clinical' }
    ],
    'diabetes': [
        { drug: 'Metformin', dose: '500MG', terms: 'BD', amount: '60', source: 'Clinical' },
        { drug: 'Sitagliptin', dose: '50MG', terms: 'Daily', amount: '30', source: 'Outside' }
    ],
    'asthma': [
        { drug: 'Salbutamol Inhaler', dose: '2 Puffs', terms: 'PRN', amount: '1', source: 'Outside' },
        { drug: 'Prednisolone', dose: '5MG', terms: 'Daily', amount: '5', source: 'Clinical' }
    ],
    'cholesterol': [
        { drug: 'Atorvastatin', dose: '20MG', terms: 'Night', amount: '30', source: 'Clinical' }
    ],

    // Pain
    'headache': [
        { drug: 'Paracetamol', dose: '500MG', terms: 'BD', amount: '6', source: 'Clinical' },
        { drug: 'Ibuprofen', dose: '400MG', terms: 'TDS', amount: '6', source: 'Clinical' }
    ],
    'migraine': [
        { drug: 'Propranolol', dose: '40MG', terms: 'BD', amount: '30', source: 'Clinical' },
        { drug: 'Sumatriptan', dose: '50MG', terms: 'Stat', amount: '2', source: 'Outside' }
    ],
    'arthritis': [
        { drug: 'Diclofenac Sodium', dose: '50MG', terms: 'BD', amount: '14', source: 'Clinical' },
        { drug: 'Omeprazole', dose: '20MG', terms: 'BD', amount: '14', source: 'Clinical' } // Gastro-protection
    ],
    'back pain': [
        { drug: 'Diclofenac', dose: '50MG', terms: 'BD', amount: '10', source: 'Clinical' },
        { drug: 'Diazepam', dose: '5MG', terms: 'Night', amount: '5', source: 'Clinical' }
    ]
};
