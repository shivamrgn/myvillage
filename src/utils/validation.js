/**
 * Validates Indian 10-digit mobile number
 */
export const isValidIndianPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
};

/**
 * Validates file uploads for evidence images
 */
export const validateImageFile = (file) => {
  const MAX_SIZE_MB = 5;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

  if (!file) return { valid: false, error: 'No file provided' };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, WEBP images are supported.' };
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `File size must not exceed ${MAX_SIZE_MB}MB.` };
  }

  return { valid: true };
};

