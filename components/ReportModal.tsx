import React, { useState } from 'react';
import { Modal } from './Modal';
import { useAppContext } from '../hooks/useAppContext';
import { Spinner } from './Spinner';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedId: string;
  reportedName: string;
  reportedType: 'User' | 'Event' | 'HelpRequest';
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, reportedId, reportedName, reportedType }) => {
  const { submitReport, reportHelpRequest } = useAppContext();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for your report.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => { // Simulate API call
      if (reportedType === 'HelpRequest') {
        reportHelpRequest(reportedId);
      } else {
        submitReport(reportedId, reportedName, reportedType, reason);
      }
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1000);
  };

  const handleClose = () => {
    onClose();
    // Reset state after modal closes
    setTimeout(() => {
        setReason('');
        setIsSubmitted(false);
        setIsSubmitting(false);
    }, 300);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Report ${reportedType}`}>
      {isSubmitted ? (
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold text-emerald-600 mb-2">Report Submitted</h3>
          <p className="text-slate-600">Thank you for helping us keep the community safe. An administrator will review your report shortly.</p>
          <button onClick={handleClose} className="mt-6 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">Close</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="text-slate-700 mb-4">
            You are reporting <strong className="font-semibold text-sky-700">{reportedName}</strong>. Please provide a reason below.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Why are you reporting this ${reportedType.toLowerCase()}?`}
            rows={5}
            className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
            required
          />
          <div className="flex justify-end space-x-2 pt-4 mt-4 border-t">
            <button type="button" onClick={handleClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:bg-slate-400 flex items-center">
              {isSubmitting ? <Spinner /> : null}
              <span className={isSubmitting ? 'ml-2' : ''}>Submit Report</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
