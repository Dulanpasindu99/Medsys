// Patient-portal internationalisation. Keys ARE the English source strings, so components can
// wrap literals in t("…") and English needs no table (it falls back to the key). Only si/ta
// need entries. Interpolation uses {name} placeholders.

export type Lang = "en" | "si" | "ta";

export const LANGUAGES: { code: Lang; native: string; label: string }[] = [
  { code: "en", native: "English", label: "English" },
  { code: "si", native: "සිංහල", label: "Sinhala" },
  { code: "ta", native: "தமிழ்", label: "Tamil" }
];

type Dict = Record<string, string>;

const si: Dict = {
  // Landing
  "Welcome to MedLink": "MedLink වෙත සාදරයෙන් පිළිගනිමු",
  "Choose how you would like to continue.": "ඔබ ඉදිරියට යා යුතු ආකාරය තෝරන්න.",
  "Login as General Public": "සාමාන්‍ය මහජනතාව ලෙස පිවිසෙන්න",
  "Patients: view your records, prescriptions and share reports with your doctors.":
    "රෝගීන්: ඔබගේ වාර්තා, බෙහෙත් වට්ටෝරු බලන්න සහ වෛද්‍යවරුන් සමඟ වාර්තා බෙදාගන්න.",
  "Login as a Doctor": "වෛද්‍යවරයෙකු ලෙස පිවිසෙන්න",
  "Owners, doctors and assistants sign in to the clinic workspace.":
    "හිමිකරුවන්, වෛද්‍යවරුන් සහ සහායකයින් සායන වැඩබිමට පිවිසෙන්න.",
  Continue: "ඉදිරියට",
  "Built by": "නිර්මාණය",
  Language: "භාෂාව",
  // Auth
  "Patient sign in": "රෝගී පිවිසුම",
  "Create your account": "ඔබගේ ගිණුම සාදන්න",
  "Access your records, prescriptions and reports.": "ඔබගේ වාර්තා, බෙහෙත් වට්ටෝරු සහ වාර්තා වෙත පිවිසෙන්න.",
  "Sign up to manage your health records online.": "ඔබගේ සෞඛ්‍ය වාර්තා අන්තර්ජාලයෙන් කළමනාකරණය කිරීමට ලියාපදිංචි වන්න.",
  "Sign in": "පිවිසෙන්න",
  "Sign up": "ලියාපදිංචි වන්න",
  Email: "විද්‍යුත් තැපෑල",
  "Phone (optional)": "දුරකථනය (විකල්ප)",
  "NIC (optional)": "ජා.හැ.අංකය (විකල්ප)",
  "Connects your existing records": "ඔබගේ පවතින වාර්තා සම්බන්ධ කරයි",
  Password: "මුරපදය",
  "Confirm password": "මුරපදය තහවුරු කරන්න",
  "Create account": "ගිණුම සාදන්න",
  "Please wait…": "කරුණාකර රැඳී සිටින්න…",
  Back: "ආපසු",
  "Passwords do not match.": "මුරපද නොගැලපේ.",
  "Password must be at least 8 characters.": "මුරපදය අවම වශයෙන් අක්ෂර 8ක් විය යුතුය.",
  // Nav
  Home: "මුල් පිටුව",
  "My History": "මගේ ඉතිහාසය",
  "My Reports": "මගේ වාර්තා",
  "My Profile": "මගේ පැතිකඩ",
  // Home
  "Welcome back": "නැවත සාදරයෙන් පිළිගනිමු",
  "Hi, {name}": "ආයුබෝවන්, {name}",
  "My Family": "මගේ පවුල",
  You: "ඔබ",
  "My Doctors": "මගේ වෛද්‍යවරු",
  "Add doctor": "වෛද්‍යවරයෙකු එක් කරන්න",
  "No doctors linked yet.": "තවම වෛද්‍යවරුන් සම්බන්ධ කර නැත.",
  Remove: "ඉවත් කරන්න",
  "Diagnosis Summary (whole family)": "රෝග විනිශ්චය සාරාංශය (මුළු පවුල)",
  Diagnoses: "රෝග විනිශ්චය",
  "Documents sent": "යවන ලද ලේඛන",
  "Documents received": "ලැබුණු ලේඛන",
  "Add a doctor for {name}": "{name} සඳහා වෛද්‍යවරයෙකු එක් කරන්න",
  "Tag (optional) — e.g. Family doctor, Dental": "ටැගය (විකල්ප) — උදා. පවුලේ වෛද්‍යවරයා, දන්ත",
  "Search doctor or clinic…": "වෛද්‍යවරයෙකු හෝ සායනයක් සොයන්න…",
  Add: "එක් කරන්න",
  Added: "එක් කළා",
  "No doctors found.": "වෛද්‍යවරුන් හමු නොවීය.",
  "View timeline →": "කාලරේඛාව බලන්න →",
  doctor: "වෛද්‍යවරයා",
  doctors: "වෛද්‍යවරු",
  // History
  "Pick a family member to see their prescription timeline.": "බෙහෙත් වට්ටෝරු කාලරේඛාව බැලීමට පවුලේ සාමාජිකයෙකු තෝරන්න.",
  "All family": "සියලු පවුල",
  "Prescription timeline": "බෙහෙත් වට්ටෝරු කාලරේඛාව",
  medicine: "ඖෂධය",
  medicines: "ඖෂධ",
  "No prescriptions recorded for {name} yet.": "{name} සඳහා තවම බෙහෙත් වට්ටෝරු වාර්තා වී නැත.",
  "Consultation details": "උපදේශන විස්තර",
  Close: "වසන්න",
  Prescription: "බෙහෙත් වට්ටෝරුව",
  "Tests ordered": "නියම කළ පරීක්ෂණ",
  "Doctor's notes": "වෛද්‍යවරයාගේ සටහන්",
  "Next visit:": "ඊළඟ පැමිණීම:",
  "Loading…": "පූරණය වෙමින්…",
  // Reports / documents
  "Send a document or image to one of your doctors.": "ඔබගේ වෛද්‍යවරයෙකුට ලේඛනයක් හෝ රූපයක් යවන්න.",
  "Send to doctor": "වෛද්‍යවරයාට යවන්න",
  "Sending…": "යවමින්…",
  "Sent to your doctor ✓": "ඔබගේ වෛද්‍යවරයාට යවන ලදී ✓",
  "Upload failed": "උඩුගත කිරීම අසාර්ථකයි",
  "Sent documents": "යවන ලද ලේඛන",
  "Received from your clinic": "ඔබගේ සායනයෙන් ලැබුණි",
  "Nothing sent yet.": "තවම කිසිවක් යවා නැත.",
  Open: "විවෘත කරන්න",
  "Doctor reviewed": "වෛද්‍යවරයා සමාලෝචනය කළා",
  // Profile
  "Sign out": "පිටවීම",
  Save: "සුරකින්න",
  Saved: "සුරකින ලදී",
  Allergies: "අසාත්මිකතා",
  "Blood group": "රුධිර කාණ්ඩය"
};

const ta: Dict = {
  // Landing
  "Welcome to MedLink": "MedLink க்கு வரவேற்கிறோம்",
  "Choose how you would like to continue.": "நீங்கள் எவ்வாறு தொடர விரும்புகிறீர்கள் என்பதைத் தேர்ந்தெடுக்கவும்.",
  "Login as General Public": "பொது மக்களாக உள்நுழைக",
  "Patients: view your records, prescriptions and share reports with your doctors.":
    "நோயாளிகள்: உங்கள் பதிவுகள், மருந்துச்சீட்டுகளைப் பார்த்து, மருத்துவர்களுடன் அறிக்கைகளைப் பகிரவும்.",
  "Login as a Doctor": "மருத்துவராக உள்நுழைக",
  "Owners, doctors and assistants sign in to the clinic workspace.":
    "உரிமையாளர்கள், மருத்துவர்கள் மற்றும் உதவியாளர்கள் கிளினிக் பணியிடத்தில் உள்நுழையவும்.",
  Continue: "தொடரவும்",
  "Built by": "உருவாக்கியது",
  Language: "மொழி",
  // Auth
  "Patient sign in": "நோயாளி உள்நுழைவு",
  "Create your account": "உங்கள் கணக்கை உருவாக்கவும்",
  "Access your records, prescriptions and reports.": "உங்கள் பதிவுகள், மருந்துச்சீட்டுகள் மற்றும் அறிக்கைகளை அணுகவும்.",
  "Sign up to manage your health records online.": "உங்கள் சுகாதாரப் பதிவுகளை ஆன்லைனில் நிர்வகிக்க பதிவு செய்யவும்.",
  "Sign in": "உள்நுழைக",
  "Sign up": "பதிவு செய்க",
  Email: "மின்னஞ்சல்",
  "Phone (optional)": "தொலைபேசி (விருப்பம்)",
  "NIC (optional)": "அடையாள அட்டை எண் (விருப்பம்)",
  "Connects your existing records": "உங்கள் தற்போதைய பதிவுகளை இணைக்கிறது",
  Password: "கடவுச்சொல்",
  "Confirm password": "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
  "Create account": "கணக்கை உருவாக்கவும்",
  "Please wait…": "தயவுசெய்து காத்திருக்கவும்…",
  Back: "பின்செல்",
  "Passwords do not match.": "கடவுச்சொற்கள் பொருந்தவில்லை.",
  "Password must be at least 8 characters.": "கடவுச்சொல் குறைந்தது 8 எழுத்துகள் இருக்க வேண்டும்.",
  // Nav
  Home: "முகப்பு",
  "My History": "எனது வரலாறு",
  "My Reports": "எனது அறிக்கைகள்",
  "My Profile": "எனது சுயவிவரம்",
  // Home
  "Welcome back": "மீண்டும் வரவேற்கிறோம்",
  "Hi, {name}": "வணக்கம், {name}",
  "My Family": "எனது குடும்பம்",
  You: "நீங்கள்",
  "My Doctors": "எனது மருத்துவர்கள்",
  "Add doctor": "மருத்துவரைச் சேர்க்கவும்",
  "No doctors linked yet.": "இன்னும் மருத்துவர்கள் இணைக்கப்படவில்லை.",
  Remove: "அகற்று",
  "Diagnosis Summary (whole family)": "நோய் கண்டறிதல் சுருக்கம் (முழு குடும்பம்)",
  Diagnoses: "நோய் கண்டறிதல்",
  "Documents sent": "அனுப்பிய ஆவணங்கள்",
  "Documents received": "பெறப்பட்ட ஆவணங்கள்",
  "Add a doctor for {name}": "{name} க்கு ஒரு மருத்துவரைச் சேர்க்கவும்",
  "Tag (optional) — e.g. Family doctor, Dental": "குறிச்சொல் (விருப்பம்) — எ.கா. குடும்ப மருத்துவர், பல்",
  "Search doctor or clinic…": "மருத்துவர் அல்லது கிளினிக்கைத் தேடுங்கள்…",
  Add: "சேர்",
  Added: "சேர்க்கப்பட்டது",
  "No doctors found.": "மருத்துவர்கள் யாரும் இல்லை.",
  "View timeline →": "காலவரிசையைக் காண்க →",
  doctor: "மருத்துவர்",
  doctors: "மருத்துவர்கள்",
  // History
  "Pick a family member to see their prescription timeline.": "மருந்துச்சீட்டு காலவரிசையைக் காண குடும்ப உறுப்பினரைத் தேர்ந்தெடுக்கவும்.",
  "All family": "முழு குடும்பம்",
  "Prescription timeline": "மருந்துச்சீட்டு காலவரிசை",
  medicine: "மருந்து",
  medicines: "மருந்துகள்",
  "No prescriptions recorded for {name} yet.": "{name} க்கு இன்னும் மருந்துச்சீட்டுகள் பதிவு செய்யப்படவில்லை.",
  "Consultation details": "ஆலோசனை விவரங்கள்",
  Close: "மூடு",
  Prescription: "மருந்துச்சீட்டு",
  "Tests ordered": "கோரப்பட்ட பரிசோதனைகள்",
  "Doctor's notes": "மருத்துவரின் குறிப்புகள்",
  "Next visit:": "அடுத்த வருகை:",
  "Loading…": "ஏற்றுகிறது…",
  // Reports / documents
  "Send a document or image to one of your doctors.": "உங்கள் மருத்துவர்களில் ஒருவருக்கு ஆவணம் அல்லது படத்தை அனுப்பவும்.",
  "Send to doctor": "மருத்துவருக்கு அனுப்பு",
  "Sending…": "அனுப்புகிறது…",
  "Sent to your doctor ✓": "உங்கள் மருத்துவருக்கு அனுப்பப்பட்டது ✓",
  "Upload failed": "பதிவேற்றம் தோல்வியடைந்தது",
  "Sent documents": "அனுப்பிய ஆவணங்கள்",
  "Received from your clinic": "உங்கள் கிளினிக்கிலிருந்து பெறப்பட்டது",
  "Nothing sent yet.": "இன்னும் எதுவும் அனுப்பப்படவில்லை.",
  Open: "திற",
  "Doctor reviewed": "மருத்துவர் மதிப்பாய்வு செய்தார்",
  // Profile
  "Sign out": "வெளியேறு",
  Save: "சேமி",
  Saved: "சேமிக்கப்பட்டது",
  Allergies: "ஒவ்வாமைகள்",
  "Blood group": "இரத்த வகை"
};

const tables: Record<Lang, Dict> = { en: {}, si, ta };

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const value = tables[lang]?.[key] ?? key;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "si" || value === "ta";
}
