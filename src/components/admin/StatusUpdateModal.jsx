import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { STATUS_TYPES, STATUS_CONFIG } from '../../constants/statusTypes';
import { useLanguage } from '../../hooks/useLanguage';

export const StatusUpdateModal = ({
  isOpen,
  onClose,
  complaint,
  onStatusUpdated,
}) => {
  const { t, isHindi } = useLanguage();
  const [status, setStatus] = useState(STATUS_TYPES.PENDING);
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (complaint) {
      setStatus(complaint.status || STATUS_TYPES.PENDING);
      setAssignedTo(complaint.assigned_to || '');
      setNotes(complaint.panchayat_notes || '');
      setError(null);
    }
  }, [complaint]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaint) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await onStatusUpdated(complaint.id, {
        status,
        assigned_to: assignedTo,
        panchayat_notes: notes,
      });
      onClose();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update complaint status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!complaint) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('admin.updateStatusTitle')} - ${complaint.tracking_id}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status Selection */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            {t('admin.newStatus')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(STATUS_TYPES).map((st) => {
              const cfg = STATUS_CONFIG[st];
              const isSelected = status === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition-all ${
                    isSelected
                      ? 'border-[#1769C2] bg-[#EAF3FF] text-[#123B68] font-bold ring-2 ring-[#1769C2]/30'
                      : 'border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {isHindi ? cfg.labelHi : cfg.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Assigned Officer / Worker */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            {isHindi ? 'नियुक्त अधिकारी / कर्मचारी (Assigned Official)' : 'Assigned Official / Worker'}
          </label>
          <input
            type="text"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder={isHindi ? 'उदा. दिनेश कुमार (नल-जल सहायक)' : 'e.g. Ramesh Singh, Sanitation Supervisor'}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-slate-900"
          />
        </div>

        {/* Official Remarks / Action Taken */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            {t('admin.officialNotes')}
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('admin.officialNotesPlaceholder')}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-slate-900"
          />
        </div>

        {error && (
          <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t('admin.saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

