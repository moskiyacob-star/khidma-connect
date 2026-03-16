
import React from 'react';
import { Event, User, UserRole } from '../types';
import { useAppContext } from '../hooks/useAppContext';

interface EventCardProps {
  event: Event;
  onViewDetails: (event: Event) => void;
}

const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>;

export const EventCard: React.FC<EventCardProps> = ({ event, onViewDetails }) => {
    const { currentUser, applyForEvent } = useAppContext();
    const spotsLeft = event.volunteersNeeded - event.volunteers.length;
    const isApplied = currentUser && event.volunteers.some(v => v.userId === currentUser.id);

    const handleApply = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentUser) {
            applyForEvent(event.id, currentUser.id, currentUser.name);
        }
    };
    
    return (
        <div onClick={() => onViewDetails(event)} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                         <div className="flex items-center gap-3 mb-2">
                             <h3 className="text-xl font-bold text-slate-800 leading-tight">{event.title}</h3>
                             <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full whitespace-nowrap ${event.status === 'Upcoming' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-600'}`}>
                                 {event.status}
                             </span>
                         </div>
                         <p className="text-slate-500 text-sm">By {event.creatorName}</p>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${spotsLeft > 5 ? 'bg-emerald-100 text-emerald-800' : spotsLeft > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                        {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                    </div>
                </div>

                <div className="space-y-3 text-sm text-slate-600 mt-4">
                    <div className="flex items-center">
                        <LocationIcon />
                        <span>{event.location} ({event.postcode})</span>
                    </div>
                    {event.exactLocation && (
                        <div className="flex items-center mt-1 ml-6">
                            <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.exactLocation)}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sky-600 hover:text-sky-800 hover:underline text-xs flex items-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                </svg>
                                Open in Google Maps
                            </a>
                        </div>
                    )}
                    <div className="flex items-center">
                        <CalendarIcon />
                        <span>{new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} @ {event.time}</span>
                    </div>
                    <div className="flex items-center">
                        <UsersIcon />
                        <span>{event.volunteers.length} / {event.volunteersNeeded} Volunteers</span>
                    </div>
                </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-500">Apply by: {new Date(event.deadline).toLocaleDateString('en-GB')}</p>
                {currentUser?.role === UserRole.VOLUNTEER && (
                    <button
                        onClick={handleApply}
                        disabled={isApplied || spotsLeft <= 0 || event.status === 'Completed'}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                            isApplied 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : spotsLeft <= 0 || event.status === 'Completed'
                                ? 'bg-rose-200 text-rose-600 cursor-not-allowed'
                                : 'bg-sky-600 text-white hover:bg-sky-700'
                        }`}
                    >
                        {isApplied ? 'Applied' : 'Volunteer'}
                    </button>
                )}
                 {currentUser?.role === UserRole.EVENT_CREATOR && event.creatorId === currentUser.id && (
                     <button className="px-4 py-2 text-sm font-semibold rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300">
                        {event.status === 'Completed' ? 'Manage Post-Event' : 'Manage Event'}
                     </button>
                 )}
            </div>
        </div>
    );
};