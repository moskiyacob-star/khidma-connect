import React, { useState } from 'react';
import { Modal } from './Modal';
import { useAppContext } from '../hooks/useAppContext';
import { Spinner } from './Spinner';
import { getLatLng } from '../utils/distance';

interface RequestHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RequestHelpModal: React.FC<RequestHelpModalProps> = ({ isOpen, onClose }) => {
    const { createHelpRequest, bannedRequesters } = useAppContext();
    const [fullName, setFullName] = useState('');
    const [address, setAddress] = useState('');
    const [postcode, setPostcode] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [helpNeeded, setHelpNeeded] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Check if banned
        const isBanned = bannedRequesters?.some(b => 
            b.phoneNumber === phoneNumber || 
            (b.postcode.toLowerCase() === postcode.toLowerCase() && b.address.toLowerCase() === address.toLowerCase())
        );

        if (isBanned) {
            setError("You are not allowed to submit help requests.");
            setIsSubmitting(false);
            return;
        }

        try {
            const coordinates = await getLatLng(postcode);
            if (!coordinates) {
                setError("Could not find coordinates for the provided postcode. Please check it and try again.");
                setIsSubmitting(false);
                return;
            }

            await createHelpRequest({
                fullName,
                address,
                postcode,
                phoneNumber,
                helpNeeded,
                dateTime: dateTime || null,
                coordinates
            });
            setIsSubmitted(true);
        } catch (error) {
            console.error("Failed to submit help request", error);
            setError("Failed to submit request. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setFullName('');
            setAddress('');
            setPostcode('');
            setPhoneNumber('');
            setHelpNeeded('');
            setDateTime('');
            setIsSubmitted(false);
            setError(null);
        }, 300);
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Request Help">
            {isSubmitted ? (
                <div className="text-center p-8">
                    <h3 className="text-xl font-semibold text-emerald-600 mb-2">Request Submitted</h3>
                    <p className="text-slate-600">Your request has been broadcasted to nearby volunteers. They will contact you shortly.</p>
                    <button onClick={handleClose} className="mt-6 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">Close</button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">First Line Address</label>
                        <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Postcode</label>
                        <input type="text" required value={postcode} onChange={e => setPostcode(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input type="tel" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">What do you need help with?</label>
                        <textarea required value={helpNeeded} onChange={e => setHelpNeeded(e.target.value)} rows={3} className="w-full p-2 border border-slate-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date and Time (Optional)</label>
                        <input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <button type="button" onClick={handleClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-slate-400 flex items-center">
                            {isSubmitting ? <Spinner /> : null}
                            <span className={isSubmitting ? 'ml-2' : ''}>Submit Request</span>
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};
