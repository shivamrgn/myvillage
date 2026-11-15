export const STATUS_TYPES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

export const STATUS_CONFIG = {
  [STATUS_TYPES.PENDING]: {
    labelEn: 'Submitted / Under Review',
    labelHi: 'दर्ज / समीक्षा में',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    dotColor: 'bg-amber-500',
    badgeVariant: 'warning',
    stepNumber: 1,
  },
  [STATUS_TYPES.IN_PROGRESS]: {
    labelEn: 'Under Action',
    labelHi: 'कार्रवाई जारी',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    dotColor: 'bg-blue-500',
    badgeVariant: 'info',
    stepNumber: 2,
  },
  [STATUS_TYPES.RESOLVED]: {
    labelEn: 'Resolved',
    labelHi: 'समाधान संपन्न',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotColor: 'bg-emerald-500',
    badgeVariant: 'success',
    stepNumber: 3,
  },
  [STATUS_TYPES.REJECTED]: {
    labelEn: 'Rejected / Closed',
    labelHi: 'अस्वीकृत / बंद',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    dotColor: 'bg-rose-500',
    badgeVariant: 'danger',
    stepNumber: 3,
  },
};

