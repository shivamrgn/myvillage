/**
 * Date formatting supporting locale awareness (Hindi / English)
 */
export const formatDate = (dateString, lang = 'hi') => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

/**
 * Format Indian 10-digit mobile number with mask
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = ('' + phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

/**
 * Shorten long strings with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

