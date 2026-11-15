/**
 * Generates citizen-friendly tracking codes like GS-2024-A8X9
 */
export const generateTrackingCode = () => {
  const currentYear = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excluded easily confused I, O, 0, 1
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GS-${currentYear}-${randomPart}`;
};

