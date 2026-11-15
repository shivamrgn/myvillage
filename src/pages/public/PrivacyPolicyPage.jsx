import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  EyeOff,
  Clock,
  Phone,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Database,
  UserCheck,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useLanguage } from '../../hooks/useLanguage';

export const PrivacyPolicyPage = () => {
  const { t, isHindi } = useLanguage();
  const helpline = import.meta.env.VITE_APP_HELPLINE || '1800-180-1555';
  const panchayatName = import.meta.env.VITE_APP_PANCHAYAT_NAME || 'ग्राम पंचायत सुंदरपुर (Sundarpur)';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back button */}
      <div>
        <Link to="/report">
          <Button variant="ghost" size="sm" icon={ArrowLeft} className="font-bold">
            {isHindi ? 'शिकायत फॉर्म पर वापस जाएं' : 'Back to Complaint Form'}
          </Button>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary-light text-primary text-xs font-bold">
          <Shield className="w-4 h-4 text-primary" />
          <span>{isHindi ? 'नागरिक डेटा सुरक्षा एवं गोपनीयता' : 'Citizen Privacy & Data Protection'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-primary-dark tracking-tight">
          {isHindi ? 'ग्राम समाधान गोपनीयता एवं डेटा सुरक्षा नीति' : 'Gram Samadhan Privacy & Security Policy'}
        </h1>
        <p className="text-sm sm:text-base text-civic-muted max-w-2xl mx-auto">
          {isHindi
            ? `${panchayatName} द्वारा संचालित नागरिक सेवा पोर्टल पर आपकी व्यक्तिगत जानकारी, वॉइस रिकॉर्डिंग और शिकायतों की सुरक्षा हमारी सर्वोच्च प्राथमिकता है।`
            : `Protection of your personal information, voice recordings, and grievance details under ${panchayatName} is our highest priority.`}
        </p>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-civic-border space-y-2">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-primary flex items-center justify-center font-bold">
            <EyeOff className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-primary-dark">
            {isHindi ? 'सार्वजनिक गोपनीयता मास्किंग' : 'Public Data Masking'}
          </h2>
          <p className="text-xs text-civic-muted leading-relaxed">
            {isHindi
              ? 'मोबाइल नंबर (••••••3210) और नाम सार्वजनिक रूप से आंशिक रूप से छिपे रहते हैं।'
              : 'Mobile numbers (••••••3210) and names are masked on the public tracking portal.'}
          </p>
        </Card>

        <Card className="p-4 bg-white border-civic-border space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-status-success flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-primary-dark">
            {isHindi ? 'निजी वॉइस स्टोरेज' : 'Encrypted Private Audio'}
          </h2>
          <p className="text-xs text-civic-muted leading-relaxed">
            {isHindi
              ? 'ऑडियो रिकॉर्डिंग निजी बकेट में रखी जाती हैं और समाधान के 90 दिनों बाद स्वतः हटाई जाती हैं।'
              : 'Voice recordings are stored in private buckets and auto-purged 90 days post resolution.'}
          </p>
        </Card>

        <Card className="p-4 bg-white border-civic-border space-y-2">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-primary-dark">
            {isHindi ? 'अपरिवर्तनीय ऑडिट ट्रेल' : 'Immutable Audit Log'}
          </h2>
          <p className="text-xs text-civic-muted leading-relaxed">
            {isHindi
              ? 'शिकायत स्थिति में प्रत्येक बदलाव का आधिकारिक डिजिटल रिकॉर्ड अपरिवर्तनीय रहता है।'
              : 'Every status update is logged with immutable database triggers preventing tampering.'}
          </p>
        </Card>
      </div>

      {/* Main Content Sections */}
      <Card className="p-6 sm:p-8 bg-white border-civic-border space-y-8 divide-y divide-slate-100">
        {/* Section 1: Data We Collect */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-primary-dark flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
            {isHindi ? 'हम कौन सी जानकारी एकत्र करते हैं?' : 'Information We Collect'}
          </h2>
          <p className="text-sm text-civic-muted leading-relaxed">
            {isHindi
              ? 'ग्राम समाधान पोर्टल केवल वही जानकारी एकत्र करता है जो आपकी समस्या के त्वरित समाधान और आपको सूचनाएं भेजने हेतु अनिवार्य है:'
              : 'The Gram Samadhan portal collects only the minimum personal information required to process and resolve your grievance:'}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-civic-text">
            <li className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>{isHindi ? 'नागरिक का नाम:' : 'Full Name:'}</strong> {isHindi ? 'शिकायतकर्ता की आधिकारिक पहचान हेतु।' : 'To identify the citizen filing the grievance.'}</span>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>{isHindi ? 'मोबाइल नंबर:' : 'Mobile Number:'}</strong> {isHindi ? 'SMS अपडेट और पंचायत सत्यापन हेतु (10 अंक)।' : 'For SMS alerts and Panchayat follow-up (10 digits).'}</span>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>{isHindi ? 'गांव एवं वार्ड:' : 'Village / Ward:'}</strong> {isHindi ? 'समस्या के भौतिक स्थान की पहचान हेतु।' : 'To dispatch local field teams to the correct location.'}</span>
            </li>
            <li className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>{isHindi ? 'समस्या विवरण व ऑडियो:' : 'Grievance Text & Audio:'}</strong> {isHindi ? 'कार्यवाही हेतु समस्या का पूरा विवरण।' : 'Citizen statement or audio note explaining the problem.'}</span>
            </li>
          </ul>
        </div>

        {/* Section 2: How Data is Used */}
        <div className="pt-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-primary-dark flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
            {isHindi ? 'डेटा का उपयोग कैसे किया जाता है?' : 'How Your Information is Used'}
          </h2>
          <div className="space-y-3 text-sm text-civic-muted leading-relaxed">
            <p>
              {isHindi
                ? '• **शिकायत का निवारण:** आपके विवरण सीधे संबंधित ग्राम प्रधान, पंचायत सचिव, या वार्ड सहायक को जांच एवं समाधान के लिए भेजे जाते हैं।'
                : '• **Grievance Resolution:** Details are routed directly to the designated Panchayat Secretary, Sarpanch, or Field Assistant for inspection and work.'}
            </p>
            <p>
              {isHindi
                ? '• **आधिकारिक SMS सूचनाएं:** शिकायत दर्ज होने, कार्य शुरू होने और समस्या समाधान पर आपके फोन पर निःशुल्क SMS भेजा जाता है।'
                : '• **Official SMS Notifications:** Transactional SMS updates are dispatched upon registration, in-progress dispatch, and resolution.'}
            </p>
            <p>
              {isHindi
                ? '• **कोई विज्ञापन या तृतीय-पक्ष शेयरिंग नहीं:** आपके डेटा को किसी भी व्यावसायिक अथवा निजी एजेंसी के साथ कभी भी साझा या बेचा नहीं जाता।'
                : '• **Zero Third-Party Commercial Sharing:** Your data is strictly never sold, rented, or shared with commercial entities or advertisers.'}
            </p>
          </div>
        </div>

        {/* Section 3: Audio Security & Purge Lifecycle */}
        <div className="pt-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-primary-dark flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
            {isHindi ? 'ऑडियो रिकॉर्डिंग सुरक्षा एवं स्वतः विलोपन' : 'Audio Recording Security & Retention Policy'}
          </h2>
          <div className="p-4 rounded-xl bg-slate-50 border border-civic-border space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-civic-text leading-relaxed">
                <strong>{isHindi ? '90-दिवसीय प्रतिधारण नीति (90-Day Retention):' : '90-Day Post-Resolution Purge:'}</strong>{' '}
                {isHindi
                  ? 'समाधान के बाद, नागरिक सत्यापन या अपील हेतु ऑडियो 90 दिनों तक सुरक्षित रखा जाता है। इसके पश्चात डेटाबेस फंक्शन (purge_expired_audio_recordings) द्वारा ऑडियो को स्टोरेज से स्वतः हटा दिया जाता है।'
                  : 'Following successful resolution, voice recordings are retained for 90 days for quality assurance and citizen review, after which they are permanently purged from private storage via automated database routines.'}
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-civic-text leading-relaxed">
                <strong>{isHindi ? 'निजी स्टोरेज और अल्पकालिक यूआरएल:' : 'Strict Private Storage & Signed URLs:'}</strong>{' '}
                {isHindi
                  ? 'ऑडियो फाइलें सार्वजनिक वेब पर उपलब्ध नहीं होतीं। केवल अधिकृत पंचायत प्रशासक या 2-चरणीय सत्यापन उत्तीर्ण नागरिक ही 10 मिनट की अस्थायी हस्ताक्षरित लिंक से इसे सुन सकते हैं।'
                  : 'Audio files reside in private storage buckets and can only be accessed using 10-minute temporary signed URLs by authorized administrators or verified citizens.'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Public Tracking & Privacy Masking */}
        <div className="pt-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-primary-dark flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">4</span>
            {isHindi ? 'सार्वजनिक ट्रैकिंग सुरक्षा एवं गोपनीयता मास्किंग' : 'Public Tracking Privacy & Identity Shield'}
          </h2>
          <p className="text-sm text-civic-muted leading-relaxed">
            {isHindi
              ? 'ग्रामीणों को बिना लॉगिन किए शिकायत ट्रैक करने की सुविधा दी गई है, लेकिन किसी अन्य व्यक्ति द्वारा विवरण न देखा जा सके इसके लिए निम्नलिखित सुरक्षा उपाय लागू हैं:'
              : 'Villagers can track complaints without creating accounts. To protect privacy from unauthorized viewers, strict shielding is enforced:'}
          </p>
          <ul className="space-y-2 text-sm text-civic-text">
            <li className="flex items-start gap-2">
              <EyeOff className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>{isHindi ? 'फोन नंबर मास्किंग:' : 'Phone Masking:'}</strong> {isHindi ? 'केवल अंतिम 4 अंक दिखते हैं (उदा. ••••••3210)।' : 'Only the last 4 digits are revealed (e.g. ••••••3210).'}</span>
            </li>
            <li className="flex items-start gap-2">
              <EyeOff className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>{isHindi ? 'नाम मास्किंग:' : 'Name Masking:'}</strong> {isHindi ? 'नागरिक का नाम स्वतः तारांकित किया जाता है (उदा. र****द श***ा)।' : 'Citizen name is masked with asterisks (e.g. A**t P***l).'}</span>
            </li>
            <li className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>{isHindi ? 'आंतरिक नोट्स की गोपनीयता:' : 'Internal Notes Protected:'}</strong> {isHindi ? 'पंचायत अधिकारियों की आंतरिक टिप्पणियां (admin_notes) कभी भी नागरिक ट्रैकिंग में नहीं भेजी जातीं।' : 'Administrative internal notes are strictly stripped server-side before sending.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <UserCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>{isHindi ? '2-चरणीय सत्यापन:' : '2-Step Verification:'}</strong> {isHindi ? 'नागरिक अपना 4-अंकीय मोबाइल नंबर दर्ज करके अपना पूरा नाम और वॉइस संदेश अनलॉक कर सकते हैं।' : 'Citizens can verify with their phone’s last 4 digits to unlock their full details and audio note.'}</span>
            </li>
          </ul>
        </div>

        {/* Section 5: Rate Limiting & Abuse Protection */}
        <div className="pt-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-primary-dark flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">5</span>
            {isHindi ? 'दुरुपयोग रोकथाम एवं सुरक्षा दर सीमा' : 'Rate Limiting & Anti-Scraping Protection'}
          </h2>
          <p className="text-sm text-civic-muted leading-relaxed">
            {isHindi
              ? 'सिस्टम को बॉट्स और स्वचालित हमलों से सुरक्षित रखने के लिए कड़े सुरक्षा नियम लागू हैं:'
              : 'The portal enforces automated controls to prevent denial-of-service and brute-force ticket harvesting:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-civic-border">
              <p className="font-bold text-primary-dark">{isHindi ? 'शिकायत जमा सीमा:' : 'Submission Limit:'}</p>
              <p className="text-civic-muted mt-1">{isHindi ? 'अधिकतम 5 शिकायतें / 10 मिनट प्रति IP। तुरंत डुप्लीकेट शिकायतें रोकी जाती हैं।' : 'Max 5 submissions per 10 minutes per IP. Rapid duplicates are blocked.'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-civic-border">
              <p className="font-bold text-primary-dark">{isHindi ? 'ट्रैकिंग दर सीमा व लॉकआउट:' : 'Tracking Rate & Lockout:'}</p>
              <p className="text-civic-muted mt-1">{isHindi ? 'अधिकतम 20 अनुरोध / मिनट। 6 गलत टिकट जांचों पर 10 मिनट का अस्थायी लॉकआउट।' : 'Max 20 requests/minute. 6 consecutive failed attempts trigger a 10-minute IP lockout.'}</p>
            </div>
          </div>
        </div>

        {/* Section 6: Contact & Rights */}
        <div className="pt-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-primary-dark flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">6</span>
            {isHindi ? 'नागरिक अधिकार एवं संपर्क' : 'Citizen Rights & Contact Information'}
          </h2>
          <p className="text-sm text-civic-muted leading-relaxed">
            {isHindi
              ? 'यदि आप अपनी शिकायत में सुधार करना चाहते हैं, अपनी जानकारी हटाना चाहते हैं, या किसी डेटा समस्या की रिपोर्ट करना चाहते हैं, तो आप पंचायत कार्यालय से संपर्क कर सकते हैं:'
              : 'To request data correction, complete record removal, or report any security concern, contact the Gram Panchayat Helpdesk:'}
          </p>
          <div className="p-4 rounded-xl bg-primary-light border border-blue-200/60 flex items-center gap-4">
            <Phone className="w-6 h-6 text-primary shrink-0" />
            <div>
              <p className="text-xs text-civic-muted">{isHindi ? 'पंचायत हेल्पलाइन एवं सहायता कक्ष' : 'Gram Panchayat Helpline & Helpdesk'}</p>
              <a href={`tel:${helpline}`} className="text-lg font-extrabold text-primary-dark hover:underline">
                {helpline}
              </a>
              <p className="text-xs text-civic-muted mt-0.5">
                {isHindi ? 'सोमवार से शनिवार: 9:00 AM – 5:00 PM' : 'Monday to Saturday: 9:00 AM – 5:00 PM'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

