import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Event, Rating, VolunteerApplication, User } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { Spinner } from './Spinner';
import { ProfileView } from '../views/ProfileView';
import { ReportModal } from './ReportModal';

interface ManageEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
}

const StarIcon: React.FC<{ filled: boolean, extraClasses?: string }> = ({ filled, extraClasses }) => (
    <svg className={`w-5 h-5 ${filled ? 'text-amber-400' : 'text-slate-300'} ${extraClasses}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


const StarRating: React.FC<{ count: number, value: number, onChange: (value: number) => void }> = ({ count, value, onChange }) => {
    const [hoverValue, setHoverValue] = useState(0);
    return (
        <div className="flex space-x-1">
            {Array.from({ length: count }, (_, i) => i + 1).map((starValue) => (
                <svg
                    key={starValue}
                    className={`w-6 h-6 cursor-pointer transition-colors ${
                        (hoverValue || value) >= starValue ? 'text-amber-400' : 'text-slate-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    onClick={() => onChange(starValue)}
                    onMouseEnter={() => setHoverValue(starValue)}
                    onMouseLeave={() => setHoverValue(0)}
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
};

const VolunteerRater: React.FC<{ volunteer: VolunteerApplication, event: Event }> = ({ volunteer, event }) => {
    const { submitRating, users, endorseSkill } = useAppContext();
    const [ratings, setRatings] = useState<{ [key: string]: number }>({ Punctuality: 0, Teamwork: 0, Enthusiasm: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const volunteerUser = useMemo(() => users.find(u => u.id === volunteer.userId), [users, volunteer.userId]);

    const hasBeenRated = useMemo(() => {
        return volunteerUser?.pointsHistory?.some(p => p.eventId === event.id) ?? false;
    }, [volunteerUser, event.id]);


    const handleRatingChange = (criteria: string, value: number) => {
        setRatings(prev => ({ ...prev, [criteria]: value }));
    };

    const handleSubmit = () => {
        if (Object.values(ratings).some(score => score === 0)) {
            alert('Please provide a rating for all criteria.');
            return;
        }

        const finalRatings: Rating[] = Object.entries(ratings).map(([criteria, score]) => ({
            eventId: event.id,
            criteria: criteria as any,
            score: score as any
        }));

        setIsSubmitting(true);
        setTimeout(() => { // Simulate API call
            submitRating(event.id, event.title, volunteer.userId, finalRatings);
            setIsSubmitting(false);
            setIsSubmitted(true);
        }, 1000);
    };

    const [endorsedSkills, setEndorsedSkills] = useState<string[]>([]);

    const handleEndorse = (skillName: string) => {
        if (!endorsedSkills.includes(skillName)) {
            endorseSkill(volunteerUser!.id, skillName);
            setEndorsedSkills(prev => [...prev, skillName]);
        }
    };

    if (hasBeenRated || isSubmitted) {
        return (
            <div className="bg-slate-100 p-4 rounded-lg mt-2">
                 <div className="text-sm text-emerald-600 font-semibold text-center mb-4">Rating Submitted!</div>
                 {volunteerUser?.skills && volunteerUser.skills.length > 0 && (
                     <div>
                         <h4 className="text-sm font-semibold text-slate-700 mb-2">Endorse Skills</h4>
                         <div className="flex flex-wrap gap-2">
                             {volunteerUser.skills.map(skill => {
                                 const isEndorsed = endorsedSkills.includes(skill.name);
                                 return (
                                     <button 
                                         key={skill.name}
                                         onClick={() => handleEndorse(skill.name)}
                                         disabled={isEndorsed}
                                         className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                                             isEndorsed 
                                                 ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed' 
                                                 : 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                                         }`}
                                    >
                                         {skill.name}
                                         <span className={`ml-1.5 flex items-center text-xs ${isEndorsed ? 'text-emerald-900' : 'text-sky-900'}`}>
                                             <StarIcon filled={true} extraClasses="w-4 h-4" />
                                             <span className="ml-0.5">{skill.endorsements + (isEndorsed ? 1 : 0)}</span>
                                         </span>
                                     </button>
                                 );
                             })}
                         </div>
                     </div>
                 )}
            </div>
        )
    }

    return (
        <div className="bg-slate-100 p-4 rounded-lg mt-2">
            <div className="space-y-3">
                {Object.keys(ratings).map(criteria => (
                    <div key={criteria} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">{criteria}</span>
                        <StarRating count={5} value={ratings[criteria]} onChange={(value) => handleRatingChange(criteria, value)} />
                    </div>
                ))}
            </div>
            <div className="mt-4 flex justify-end">
                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-sky-600 text-white text-sm font-semibold rounded-md hover:bg-sky-700 disabled:bg-slate-400 flex items-center"
                >
                    {isSubmitting && <Spinner />}
                    <span className={isSubmitting ? 'ml-2' : ''}>Submit Rating</span>
                </button>
            </div>
        </div>
    );
};

const AnnouncementsPanel: React.FC<{ event: Event }> = ({ event }) => {
    const { sendAnnouncement } = useAppContext();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        setTimeout(() => { // Simulate API call
            sendAnnouncement(event.id, message);
            setMessage('');
            setIsSending(false);
        }, 500);
    };

    return (
        <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Announcements</h3>
            <form onSubmit={handleSubmit} className="mb-4">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Send a message to all volunteers..."
                    rows={3}
                    className="w-full border border-slate-300 rounded-md shadow-sm p-2 text-sm"
                    required
                />
                <button type="submit" disabled={isSending} className="mt-2 px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-md hover:bg-sky-700 disabled:bg-slate-400">
                    {isSending ? 'Sending...' : 'Send Announcement'}
                </button>
            </form>
            <div className="space-y-2 max-h-40 overflow-y-auto">
                {event.announcements && [...event.announcements].reverse().map(ann => (
                    <div key={ann.id} className="bg-slate-50 p-2 rounded-md text-sm">
                        <p>{ann.message}</p>
                        <p className="text-xs text-slate-400 text-right">{new Date(ann.timestamp).toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SaveAsTemplatePanel: React.FC<{ event: Event }> = ({ event }) => {
    const { saveEventAsTemplate, eventTemplates } = useAppContext();
    const [templateName, setTemplateName] = useState(event.title);
    const [isSaved, setIsSaved] = useState(false);
    
    const isNameTaken = useMemo(() => eventTemplates.some(t => t.name.toLowerCase() === templateName.toLowerCase()), [templateName, eventTemplates]);

    const handleSave = () => {
        saveEventAsTemplate(event, templateName);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Save as Template</h3>
            <p className="text-sm text-slate-500 mb-4">Save this event's details as a template for quick creation in the future.</p>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name"
                    className="flex-grow p-2 text-sm border border-slate-300 rounded-md shadow-sm"
                />
                <button onClick={handleSave} disabled={isSaved || isNameTaken || !templateName.trim()} className="px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-md hover:bg-emerald-600 disabled:bg-slate-400 disabled:cursor-not-allowed">
                    {isSaved ? 'Saved!' : 'Save'}
                </button>
            </div>
            {isNameTaken && <p className="text-xs text-rose-500 mt-1">A template with this name already exists.</p>}
        </div>
    );
};

export const ManageEventModal: React.FC<ManageEventModalProps> = ({ isOpen, onClose, event }) => {
    const { confirmAttendance, updateEventStatus, acceptVolunteer, rejectVolunteer, users } = useAppContext();
    const [activeRater, setActiveRater] = useState<string | null>(null);
    const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
    const [reportingUser, setReportingUser] = useState<{ id: string, name: string } | null>(null);

    const pendingVolunteers = event.volunteers.filter(v => v.status === 'Pending');
    const confirmedVolunteers = event.volunteers.filter(v => v.status !== 'Pending');
    const volunteersToConfirm = event.volunteers.filter(v => v.status === 'Confirmed' || v.status === 'Attended');

    const handleMarkAsCompleted = () => {
        updateEventStatus(event.id, 'Completed');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage: ${event.title}`}>
            {viewingProfileId ? (
                <div>
                    <button 
                        onClick={() => setViewingProfileId(null)}
                        className="mb-4 text-sm text-sky-600 hover:text-sky-800 flex items-center"
                    >
                        &larr; Back to Manage Event
                    </button>
                    <ProfileView user={users.find(u => u.id === viewingProfileId)!} />
                </div>
            ) : event.status === 'Upcoming' ? (
                <div className="space-y-6">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">This Event is Upcoming</h3>
                        <p className="text-slate-500 mb-4 max-w-md mx-auto text-sm">Once the event has finished, you can mark it as completed to confirm attendance and rate volunteers.</p>
                        <button
                            onClick={handleMarkAsCompleted}
                            className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-md shadow-sm hover:bg-emerald-600 transition-colors"
                        >
                            Mark as Completed
                        </button>
                    </div>

                    {pendingVolunteers.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-3">Pending Volunteers</h3>
                            <div className="space-y-3">
                                {pendingVolunteers.map(v => (
                                    <div key={v.userId} className="flex items-center justify-between bg-amber-50 p-3 rounded-md border border-amber-100">
                                        <span className="text-slate-700 font-medium">{v.userName}</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setViewingProfileId(v.userId)}
                                                className="px-3 py-1 text-xs font-semibold bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                                            >
                                                View Profile
                                            </button>
                                            <button 
                                                onClick={() => acceptVolunteer(event.id, v.userId)}
                                                className="px-3 py-1 text-xs font-semibold bg-emerald-500 text-white rounded hover:bg-emerald-600"
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                onClick={() => rejectVolunteer(event.id, v.userId)}
                                                className="px-3 py-1 text-xs font-semibold bg-rose-500 text-white rounded hover:bg-rose-600"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {confirmedVolunteers.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-3">Confirmed Volunteers</h3>
                            <div className="space-y-3">
                                {confirmedVolunteers.map(v => (
                                    <div key={v.userId} className="flex items-center justify-between bg-emerald-50 p-3 rounded-md border border-emerald-100">
                                        <span className="text-slate-700 font-medium">{v.userName}</span>
                                        <button 
                                            onClick={() => setViewingProfileId(v.userId)}
                                            className="px-3 py-1 text-xs font-semibold bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                                        >
                                            View Profile
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <AnnouncementsPanel event={event} />
                    <SaveAsTemplatePanel event={event} />
                </div>
            ) : (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-3">Confirm Attendance</h3>
                        <p className="text-sm text-slate-500 mb-4">Select the volunteers who attended the event. This will allow you to rate their performance.</p>
                        {volunteersToConfirm.length > 0 ? (
                            <div className="space-y-3">
                                {volunteersToConfirm.map(v => (
                                    <div key={v.userId} className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                                        <label htmlFor={`check-${v.userId}`} className="flex items-center cursor-pointer">
                                            <input
                                                id={`check-${v.userId}`}
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                checked={v.status === 'Attended'}
                                                onChange={(e) => confirmAttendance(event.id, v.userId, e.target.checked)}
                                            />
                                            <span className="ml-3 text-slate-700">{v.userName}</span>
                                        </label>
                                        <button
                                            onClick={() => setReportingUser({ id: v.userId, name: v.userName })}
                                            className="text-rose-500 hover:text-rose-700 p-1"
                                            title="Report Volunteer"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">No volunteers had confirmed attendance.</p>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-3">Rate & Endorse Volunteers</h3>
                        {event.volunteers.filter(v => v.status === 'Attended').length > 0 ? (
                             <div className="space-y-3">
                                {event.volunteers.filter(v => v.status === 'Attended').map(v => (
                                    <div key={v.userId} className="bg-white p-3 rounded-md border">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-slate-800">{v.userName}</p>
                                            <button 
                                                onClick={() => setActiveRater(activeRater === v.userId ? null : v.userId)}
                                                className="px-3 py-1 text-sm bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300"
                                            >
                                                {activeRater === v.userId ? 'Close' : 'Manage'}
                                            </button>
                                        </div>
                                        {activeRater === v.userId && <VolunteerRater volunteer={v} event={event} />}
                                    </div>
                                ))}
                             </div>
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">Confirm attendance for volunteers above to enable rating.</p>
                        )}
                    </div>
                    <AnnouncementsPanel event={event} />
                    <SaveAsTemplatePanel event={event} />
                </div>
            )}

            {reportingUser && (
                <ReportModal
                    isOpen={!!reportingUser}
                    onClose={() => setReportingUser(null)}
                    reportedId={reportingUser.id}
                    reportedName={reportingUser.name}
                    reportedType="User"
                />
            )}
        </Modal>
    );
};