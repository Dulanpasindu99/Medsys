export interface TimelineEntry {
    date: string;
    title: string;
    description: string;
    kind?: 'bp' | 'general' | 'checkup';
    tags?: string[];
    value?: string;
}

export interface FamilyProfile {
    assigned: boolean;
    name: string;
    members: string[];
}

export interface PatientProfile {
    id: string;
    name: string;
    nic: string;
    age: number;
    gender: 'Male' | 'Female';
    mobile: string;
    family: FamilyProfile;
    conditions: string[];
    allergies: string[];
    firstSeen: string;
    timeline: TimelineEntry[];
}

export const patientProfiles: Record<string, PatientProfile> = {
    'p1': {
        id: 'p1',
        name: 'Premadasa',
        nic: '61524862V',
        age: 66,
        gender: 'Male',
        mobile: '+94 71 111 2222',
        family: { assigned: true, name: 'Premadasa', members: ['Sunil', 'Mala'] },
        conditions: ['Hypertension', 'Diabetes'],
        allergies: ['Penicillin'],
        firstSeen: '2023-01-15',
        timeline: [
            { date: '2023-11-20', title: 'Routine Checkup', description: 'Regular monitoring of blood pressure.', kind: 'bp', value: '130/85' },
            { date: '2023-06-10', title: 'Viral Fever', description: 'Presented with high fever and body aches.', kind: 'general', tags: ['Fever'] }
        ]
    },
    'p2': {
        id: 'p2',
        name: 'JR Jayawardhana',
        nic: '64524862V',
        age: 62,
        gender: 'Male',
        mobile: '+94 77 333 4444',
        family: { assigned: true, name: 'Jayawardhana', members: ['Ravi'] },
        conditions: ['Gastritis'],
        allergies: [],
        firstSeen: '2022-08-10',
        timeline: [
            { date: '2023-10-05', title: 'Stomach Pain', description: 'Complained of severe abdominal pain.', kind: 'general', tags: ['Pain'] }
        ]
    },
    'p3': {
        id: 'p3',
        name: 'Mitreepala Siirisena',
        nic: '78522862V',
        age: 68,
        gender: 'Male',
        mobile: '+94 72 555 6666',
        family: { assigned: false, name: 'N/A', members: [] },
        conditions: ['Arthritis'],
        allergies: ['Dust'],
        firstSeen: '2023-03-22',
        timeline: []
    },
    'p4': {
        id: 'p4',
        name: 'Chandrika Bandranayake',
        nic: '71524862V',
        age: 63,
        gender: 'Female',
        mobile: '+94 75 777 8888',
        family: { assigned: true, name: 'Bandranayake', members: ['Vimukthi'] },
        conditions: ['Migraine'],
        allergies: [],
        firstSeen: '2021-12-05',
        timeline: [
            { date: '2023-11-22', title: 'Headache', description: 'Severe migraine attack.', kind: 'general' }
        ]
    },
    'p5': {
        id: 'p5',
        name: 'Ranil Vicramasinghe',
        nic: '77524862V',
        age: 76,
        gender: 'Male',
        mobile: '+94 71 999 0000',
        family: { assigned: true, name: 'Wickramasinghe', members: ['Maithree'] },
        conditions: ['High Cholesterol'],
        allergies: ['Sulfa'],
        firstSeen: '2020-05-15',
        timeline: [
            { date: '2023-09-12', title: 'Lipid Profile', description: 'Review of cholesterol levels.', kind: 'checkup', value: 'High' }
        ]
    },
    'p6': {
        id: 'p6',
        name: 'Mahinda Rajapakshe',
        nic: '74524862V',
        age: 66,
        gender: 'Male',
        mobile: '+94 77 121 2121',
        family: { assigned: true, name: 'Rajapaksha', members: ['Namal', 'Yoshitha'] },
        conditions: ['Back Pain'],
        allergies: [],
        firstSeen: '2019-11-11',
        timeline: []
    },
    'p7': {
        id: 'p7',
        name: 'Rani Fernando',
        nic: '856456456V',
        age: 34,
        gender: 'Female',
        mobile: '+94 70 343 4343',
        family: { assigned: false, name: 'N/A', members: [] },
        conditions: [],
        allergies: [],
        firstSeen: '2024-01-02',
        timeline: []
    },
    'p8': {
        id: 'p8',
        name: 'Sathya Dev',
        nic: '222343222V',
        age: 65,
        gender: 'Male',
        mobile: '+94 76 656 5656',
        family: { assigned: false, name: 'N/A', members: [] },
        conditions: [],
        allergies: [],
        firstSeen: '2023-12-20',
        timeline: []
    },
    'p9': {
        id: 'p9',
        name: 'Chathura Deshan',
        nic: '865637762V',
        age: 32,
        gender: 'Male',
        mobile: '+94 71 878 7878',
        family: { assigned: false, name: 'N/A', members: [] },
        conditions: [],
        allergies: [],
        firstSeen: '2024-02-14',
        timeline: []
    },
    'p10': {
        id: 'p10',
        name: 'Rathmalie De Silva',
        nic: '650002343V',
        age: 42,
        gender: 'Female',
        mobile: '+94 77 909 0909',
        family: { assigned: false, name: 'N/A', members: [] },
        conditions: [],
        allergies: [],
        firstSeen: '2023-07-07',
        timeline: []
    }
};

export function getPatientProfile(id: string): PatientProfile | undefined {
    return patientProfiles[id];
}

export function getProfileIdByNicOrName(nic: string, name: string): string | undefined {
    const profile = Object.values(patientProfiles).find(
        (p) => p.nic === nic || p.name.toLowerCase() === name.toLowerCase()
    );
    return profile?.id;
}
