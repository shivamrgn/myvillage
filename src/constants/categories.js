export const COMPLAINT_CATEGORIES = [
  {
    id: 'water',
    icon: 'Droplets',
    en: 'Water Supply & Handpumps',
    hi: 'पेयजल एवं हैंडपंप',
    descriptionEn: 'Issues related to borewells, handpumps, pipeline leakage, contaminated water.',
    descriptionHi: 'हैंडपंप, बोरवेल, पाइपलाइन लीकेज या दूषित पेयजल से संबंधित समस्याएं।'
  },
  {
    id: 'roads',
    icon: 'Construction',
    en: 'Roads & Streetlights',
    hi: 'सड़क एवं स्ट्रीट लाइट',
    descriptionEn: 'Potholes, broken village roads, non-functional solar lights or streetlights.',
    descriptionHi: 'सड़क पर गड्ढे, टूटी सड़कें, खराब स्ट्रीट लाइट या सोलर लाइट।'
  },
  {
    id: 'electricity',
    icon: 'Zap',
    en: 'Electricity & Power',
    hi: 'बिजली आपूर्ति',
    descriptionEn: 'Transformer failure, power cuts, dangling high-voltage wires.',
    descriptionHi: 'ट्रांसफॉर्मर खराब होना, बार-बार बिजली कटना, लटकते बिजली तार।'
  },
  {
    id: 'sanitation',
    icon: 'Trash2',
    en: 'Sanitation & Drainage',
    hi: 'सफाई एवं नाली',
    descriptionEn: 'Choked drains, garbage dumping, stagnant water, mosquito breeding.',
    descriptionHi: 'नाली जाम, कचरे का ढेर, जलजमाव, मच्छर और गंदगी।'
  },
  {
    id: 'health',
    icon: 'HeartPulse',
    en: 'Health & Dispensary',
    hi: 'स्वास्थ्य एवं औषधालय',
    descriptionEn: 'Sub-centre staff absenteeism, lack of essential medicines, ambulance delay.',
    descriptionHi: 'स्वास्थ्य केंद्र में दवाई न मिलना, डॉक्टर या एएनएम अनुपस्थिति।'
  },
  {
    id: 'education',
    icon: 'GraduationCap',
    en: 'Schools & Anganwadi',
    hi: 'प्राथमिक विद्यालय एवं आंगनवाड़ी',
    descriptionEn: 'Mid-day meal quality, school building repair, drinking water in school.',
    descriptionHi: 'मिड-डे मील की गुणवत्ता, स्कूल भवन मरम्मत, पेयजल व्यवस्था।'
  },
  {
    id: 'welfare',
    icon: 'Users',
    en: 'Pensions & Ration (PDS)',
    hi: 'पेंशन एवं राशन (PDS)',
    descriptionEn: 'Old age/widow pension disbursement, ration card issues, quota shortfall.',
    descriptionHi: 'वृद्धा/विधवा पेंशन, राशन कार्ड, राशन वितरण में अनियमितता।'
  },
  {
    id: 'other',
    icon: 'HelpCircle',
    en: 'Other Civic Issues',
    hi: 'अन्य नागरिक समस्याएं',
    descriptionEn: 'Any other grievance requiring intervention from Gram Panchayat or Block.',
    descriptionHi: 'अन्य कोई भी समस्या जिस पर ग्राम पंचायत का ध्यान जरूरी हो।'
  }
];

export const getCategoryById = (id) => {
  return COMPLAINT_CATEGORIES.find((cat) => cat.id === id) || COMPLAINT_CATEGORIES[COMPLAINT_CATEGORIES.length - 1];
};

