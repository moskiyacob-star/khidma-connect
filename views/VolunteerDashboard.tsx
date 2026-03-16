import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { EventCard } from '../components/EventCard';
import { RADIUS_OPTIONS, EVENT_CATEGORIES } from '../constants';
import { Event, UserRole, Announcement } from '../types';
import { ProfileView } from './ProfileView';
import { Modal } from '../components/Modal';
import { Leaderboard } from '../components/Leaderboard';
import { ReportModal } from '../components/ReportModal';
import { getBulkLatLng, calculateDistance } from '../utils/distance';

const FlagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" /></svg>;

export const VolunteerDashboard: React.FC = () => {
    const { events, currentUser, requestEventCreatorRole, clearStatusMessage, helpRequests, acceptHelpRequest, declineHelpRequest, reportHelpRequest, markAnnouncementAsRead } = useAppContext();
    const [radius, setRadius] = useState(10);
    const [searchPostcode, setSearchPostcode] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [sortOption, setSortOption] = useState('date-desc');
    const [statusFilter, setStatusFilter] = useState('Upcoming');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [activeTab, setActiveTab] = useState('profile');
    const [reporting, setReporting] = useState<{ type: 'User' | 'Event' | 'HelpRequest', id: string, name: string } | null>(null);
    const [isApplyingCreator, setIsApplyingCreator] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [postcode, setPostcode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [postcodeCoords, setPostcodeCoords] = useState<Record<string, { lat: number; lng: number } | null>>({});
    const [isFetchingCoords, setIsFetchingCoords] = useState(false);

    React.useEffect(() => {
        if (selectedEvent) {
            const updatedEvent = events.find(e => e.id === selectedEvent.id);
            if (updatedEvent) {
                setSelectedEvent(updatedEvent);
            } else {
                setSelectedEvent(null);
            }
        }
    }, [events]);

    React.useEffect(() => {
        const fetchCoords = async () => {
            if (!currentUser?.postcode) return;
            setIsFetchingCoords(true);
            
            const postcodesToFetch = [currentUser.postcode, ...events.map(e => e.postcode)];
            const uniquePostcodes = Array.from(new Set(postcodesToFetch.filter(Boolean)));
            
            // Only fetch if we don't already have them
            const missingPostcodes = uniquePostcodes.filter(p => postcodeCoords[p] === undefined);
            
            if (missingPostcodes.length > 0) {
                const newCoords = await getBulkLatLng(missingPostcodes);
                setPostcodeCoords(prev => ({ ...prev, ...newCoords }));
            }
            setIsFetchingCoords(false);
        };
        fetchCoords();
    }, [events, currentUser?.postcode]);

    const recentAnnouncements = useMemo(() => {
        const recent: { event: Event, announcement: Announcement }[] = [];
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).getTime();
        
        events.forEach(event => {
            if (event.volunteers.some(v => v.userId === currentUser?.id)) {
                if (event.announcements) {
                    event.announcements.forEach(ann => {
                        if (new Date(ann.timestamp).getTime() > oneDayAgo && !currentUser?.readAnnouncements?.includes(ann.id)) {
                            recent.push({ event, announcement: ann });
                        }
                    });
                }
            }
        });
        
        return recent.sort((a, b) => new Date(b.announcement.timestamp).getTime() - new Date(a.announcement.timestamp).getTime());
    }, [events, currentUser?.id, currentUser?.readAnnouncements]);

    const nearbyHelpRequests = useMemo(() => {
        const userCoords = currentUser?.postcode ? postcodeCoords[currentUser.postcode] : null;

        return helpRequests.filter(req => {
            if (req.status !== 'Pending') return false;
            if (req.declinedBy?.includes(currentUser.id)) return false;
            
            // If user has no postcode or coords, show all pending requests
            if (!userCoords) return true;
            
            // If request has no coordinates, we can't calculate distance, so show it anyway?
            // Or only show requests with coordinates if user has coordinates.
            if (!req.coordinates) return true;
            
            const dist = calculateDistance(userCoords.lat, userCoords.lng, req.coordinates.lat, req.coordinates.lng);
            return dist <= 5; // 5 mile radius
        });
    }, [helpRequests, currentUser, postcodeCoords]);

    if(!currentUser) return null;

    const handleApplyCreator = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber.trim() || !postcode.trim()) return;
        setIsSubmitting(true);
        try {
            await requestEventCreatorRole(phoneNumber, postcode);
            setIsApplyingCreator(false);
            setPhoneNumber('');
            setPostcode('');
        } catch (error) {
            console.error("Failed to apply:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayedEvents = useMemo(() => {
        let processedEvents = [...events];

        // 1. Filter by Status
        if (statusFilter !== 'All') {
            processedEvents = processedEvents.filter(event => event.status === statusFilter);
        }

        // 2. Filter by Category
        if (categoryFilter !== 'All') {
            processedEvents = processedEvents.filter(event => event.category === categoryFilter);
        }

        // 3. Filter by Radius
        const searchLocation = searchPostcode || currentUser?.postcode;
        if (searchLocation && postcodeCoords[searchLocation]) {
            const userCoords = postcodeCoords[searchLocation];
            if (userCoords) {
                processedEvents = processedEvents.filter(event => {
                    if (!event.postcode || !postcodeCoords[event.postcode]) return false;
                    const eventCoords = postcodeCoords[event.postcode];
                    if (!eventCoords) return false;
                    
                    const dist = calculateDistance(userCoords.lat, userCoords.lng, eventCoords.lat, eventCoords.lng);
                    return dist <= radius;
                });
            }
        }
        
        // 4. Sort
        processedEvents.sort((a, b) => {
            if (sortOption === 'date-desc') {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            if (sortOption === 'date-asc') {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            }
            return 0;
        });

        return processedEvents;
    }, [events, sortOption, statusFilter, categoryFilter, radius, currentUser?.postcode, postcodeCoords]);
    
    const handleAddToCalendar = () => {
        if (!selectedEvent) return;

        const startTime = new Date(`${selectedEvent.date}T${selectedEvent.time}:00`);
        // Assume event is 2 hours long for the end time.
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

        const toGoogleISO = (date: Date) => date.toISOString().replace(/-|:|\.\d{3}/g, '');

        const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
          selectedEvent.title
        )}&dates=${toGoogleISO(startTime)}/${toGoogleISO(
          endTime
        )}&details=${encodeURIComponent(
          selectedEvent.description
        )}&location=${encodeURIComponent(selectedEvent.location)}`;

        window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Find Opportunities</h1>
                            <p className="text-slate-500 mt-1">Discover events near you and make a difference.</p>
                        </div>
                    </div>

                    {currentUser.statusMessage && (
                        <div className="bg-white border-l-4 border-sky-500 p-6 rounded-lg shadow-md mb-8 flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-sky-100 p-2 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Notification</h2>
                                    <p className="text-slate-600 mt-1">{currentUser.statusMessage}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => clearStatusMessage()}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {recentAnnouncements.length > 0 && (
                        <div className="bg-white border-l-4 border-emerald-500 p-6 rounded-lg shadow-md mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-emerald-100 p-2 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">Recent Announcements</h2>
                            </div>
                            <div className="space-y-3">
                                {recentAnnouncements.map((item, idx) => (
                                    <div 
                                        key={`${item.event.id}-${idx}`} 
                                        className="bg-slate-50 p-4 rounded-md border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                                        onClick={() => setSelectedEvent(item.event)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-slate-800">{item.event.title}</span>
                                            <span className="text-xs text-slate-500">
                                                {new Date(item.announcement.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-2">{item.announcement.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {nearbyHelpRequests.length > 0 && (
                        <div className="bg-white border-l-4 border-rose-500 p-6 rounded-lg shadow-md mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-rose-100 p-2 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">Community Help Requests</h2>
                            </div>
                            {!currentUser.postcode && (
                                <p className="text-xs text-rose-600 mb-4 bg-rose-50 p-2 rounded border border-rose-100">
                                    <strong>Tip:</strong> Set your postcode in your profile to only see requests within 5 miles.
                                </p>
                            )}
                            <div className="space-y-3">
                                {nearbyHelpRequests.map((req) => (
                                    <div 
                                        key={req.id} 
                                        className="bg-slate-50 p-4 rounded-md border border-slate-100"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-semibold text-slate-800">{req.fullName} needs help</span>
                                            <span className="text-xs text-slate-500">
                                                {new Date(req.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">{req.helpNeeded}</p>
                                        <div className="text-xs text-slate-500 mb-3">
                                            <p><strong>Location:</strong> {req.address}, {req.postcode}</p>
                                            {req.dateTime && <p><strong>When:</strong> {new Date(req.dateTime).toLocaleString('en-GB')}</p>}
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => setReporting({ type: 'HelpRequest', id: req.id, name: req.fullName })}
                                                className="px-3 py-1.5 text-xs text-rose-600 border border-rose-200 rounded hover:bg-rose-50"
                                            >
                                                Report
                                            </button>
                                            <button 
                                                onClick={() => declineHelpRequest(req.id)}
                                                className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded hover:bg-slate-100"
                                            >
                                                Decline
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    acceptHelpRequest(req.id);
                                                    alert(`You accepted the request! Please contact ${req.fullName} at ${req.phoneNumber}.`);
                                                }}
                                                className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                            >
                                                Accept & Help
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentUser.role === UserRole.VOLUNTEER && !currentUser.requestedEventCreator && (
                        <div className="bg-sky-600 text-white p-6 rounded-lg shadow-lg mb-8 relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-xl font-bold mb-2">Want to organize your own events?</h2>
                                <p className="text-sky-100 mb-4">Apply to become an Event Creator and start making a bigger impact.</p>
                                <button 
                                    onClick={() => setIsApplyingCreator(true)}
                                    className="bg-white text-sky-600 px-4 py-2 rounded-md font-bold hover:bg-sky-50 transition-colors"
                                >
                                    Apply Now
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
                                <svg width="200" height="200" viewBox="0 0 200 200" fill="currentColor"><path d="M100 0C44.8 0 0 44.8 0 100s44.8 100 100 100 100-44.8 100-100S155.2 0 100 0zm0 180c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"/><path d="M100 40c-33.1 0-60 26.9-60 60s26.9 60 60 60 60-26.9 60-60-26.9-60-60-60zm0 100c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z"/></svg>
                            </div>
                        </div>
                    )}

                    {currentUser.requestedEventCreator && (
                        <div className="bg-white border-l-4 border-amber-400 p-6 rounded-lg shadow-md mb-8 flex items-start gap-4">
                            <div className="bg-amber-100 p-2 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Application Received!</h2>
                                <p className="text-slate-600">
                                    Thank you for your interest in becoming an Event Creator. Your application is currently <span className="font-semibold text-amber-600">waiting for verification</span>. 
                                </p>
                                <p className="text-sm text-slate-500 mt-2">
                                    Our admin team will review your details and get back to you shortly. We appreciate your patience!
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div>
                                <label htmlFor="sort-select" className="block text-sm font-medium text-slate-600 mb-1">Sort by</label>
                                <select id="sort-select" value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm">
                                    <option value="date-desc">Date: Newest First</option>
                                    <option value="date-asc">Date: Oldest First</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="status-filter" className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                                <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm">
                                    <option value="Upcoming">Upcoming</option>
                                    <option value="Completed">Completed</option>
                                    <option value="All">All</option>
                                </select>
                            </div>
                             <div>
                                <label htmlFor="category-filter" className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                                <select id="category-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm">
                                    <option value="All">All Categories</option>
                                    {EVENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="postcode-search" className="block text-sm font-medium text-slate-600 mb-1">Postcode</label>
                                <input id="postcode-search" type="text" value={searchPostcode} onChange={(e) => setSearchPostcode(e.target.value)} placeholder="Enter postcode" className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="radius-select" className="block text-sm font-medium text-slate-600 mb-1">Radius</label>
                                <select id="radius-select" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm">
                                    {RADIUS_OPTIONS.map(r => <option key={r} value={r}>{r} miles</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {isFetchingCoords && Object.keys(postcodeCoords).length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-lg shadow-md">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
                                <p className="text-slate-500">Finding events near you...</p>
                            </div>
                        ) : displayedEvents.length > 0 ? (
                            displayedEvents.map(event => (
                                <EventCard key={event.id} event={event} onViewDetails={setSelectedEvent}/>
                            ))
                        ) : (
                            <div className="text-center py-16 bg-white rounded-lg shadow-md">
                                <p className="text-slate-500">No events found matching your criteria.</p>
                                <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or increasing the radius.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="flex border-b">
                                <button 
                                    onClick={() => setActiveTab('profile')}
                                    className={`flex-1 p-4 text-sm font-semibold transition-colors duration-200 ${activeTab === 'profile' ? 'bg-sky-50 text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    My Profile
                                </button>
                                <button 
                                    onClick={() => setActiveTab('leaderboard')}
                                    className={`flex-1 p-4 text-sm font-semibold transition-colors duration-200 ${activeTab === 'leaderboard' ? 'bg-sky-50 text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    Leaderboard
                                </button>
                            </div>
                            <div className="p-0">
                                {activeTab === 'profile' ? <ProfileView user={currentUser} /> : <Leaderboard />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={selectedEvent?.title || ''}>
                {selectedEvent && (
                    <>
                        <div className="space-y-4 text-slate-700">
                            <p><strong className="font-semibold">Description:</strong> {selectedEvent.description}</p>
                            <p><strong className="font-semibold">Location:</strong> {selectedEvent.location}</p>
                            <p><strong className="font-semibold">Date & Time:</strong> {new Date(selectedEvent.date).toLocaleDateString()} at {selectedEvent.time}</p>
                            <p><strong className="font-semibold">Organizer:</strong> {selectedEvent.creatorName}</p>
                            
                            {selectedEvent.announcements && selectedEvent.announcements.length > 0 && (
                                <div className="pt-4 mt-4 border-t">
                                    <h4 className="font-semibold mb-2 text-slate-800 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                        </svg>
                                        Announcements
                                    </h4>
                                    <div className="space-y-3 max-h-32 overflow-y-auto bg-slate-50 p-3 rounded-md border">
                                        {[...selectedEvent.announcements].reverse().filter(ann => !currentUser?.readAnnouncements?.includes(ann.id)).map(ann => (
                                            <div key={ann.id} className="pb-2 border-b border-slate-200 last:border-b-0">
                                                <p className="text-sm text-slate-700">{ann.message}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <button 
                                                        onClick={() => markAnnouncementAsRead(ann.id)}
                                                        className="text-xs text-sky-600 hover:text-sky-800 underline"
                                                    >
                                                        Mark as read
                                                    </button>
                                                    <p className="text-xs text-slate-400 text-right">
                                                        {new Date(ann.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                <h4 className="font-semibold mb-2">Volunteers ({selectedEvent.volunteers.length}/{selectedEvent.volunteersNeeded})</h4>
                                <ul className="list-disc list-inside bg-slate-50 p-3 rounded-md max-h-40 overflow-y-auto">
                                   {selectedEvent.volunteers.map(v => (
                                      <li key={v.userId} className="flex justify-between items-center">
                                          <span>{v.userName}</span>
                                          {currentUser.id !== v.userId && (
                                              <button onClick={() => setReporting({ type: 'User', id: v.userId, name: v.userName })} className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center">
                                                  <FlagIcon /> Report
                                              </button>
                                          )}
                                      </li>
                                   ))}
                                   {selectedEvent.volunteers.length === 0 && <li className="list-none text-slate-500">No volunteers yet.</li>}
                                </ul>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t flex justify-between items-center">
                             <button onClick={() => setReporting({ type: 'Event', id: selectedEvent.id, name: selectedEvent.title })} className="text-sm text-slate-500 hover:text-rose-600 font-semibold flex items-center transition-colors">
                                <FlagIcon /> Report Event
                             </button>
                            <button 
                                onClick={handleAddToCalendar}
                                className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-sm hover:bg-sky-700 transition-colors flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                Add to Calendar
                            </button>
                        </div>
                    </>
                )}
            </Modal>

            {reporting && (
                <ReportModal
                    isOpen={!!reporting}
                    onClose={() => setReporting(null)}
                    reportedId={reporting.id}
                    reportedName={reporting.name}
                    reportedType={reporting.type}
                />
            )}

            <Modal isOpen={isApplyingCreator} onClose={() => setIsApplyingCreator(false)} title="Become an Event Creator">
                <form onSubmit={handleApplyCreator} className="space-y-4">
                    <p className="text-slate-600">
                        To become an Event Creator, we need a contact number so our admin team can verify your identity and discuss your plans.
                    </p>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input 
                            id="phone"
                            type="tel" 
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="e.g. +44 7700 900000"
                            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 mb-4"
                        />
                        <label htmlFor="postcode" className="block text-sm font-medium text-slate-700 mb-1">Postcode</label>
                        <input 
                            id="postcode"
                            type="text" 
                            required
                            value={postcode}
                            onChange={(e) => setPostcode(e.target.value)}
                            placeholder="e.g. NW1 6XE"
                            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsApplyingCreator(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-sky-600 text-white font-bold rounded-md hover:bg-sky-700 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
