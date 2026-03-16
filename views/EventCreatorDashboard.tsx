import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { EventCard } from '../components/EventCard';
import { Modal } from '../components/Modal';
import { ManageEventModal } from '../components/ManageEventModal';
import { Event, AccountStatus, UserRole, EventCategory } from '../types';
import { EVENT_CATEGORIES } from '../constants';
import { Spinner } from '../components/Spinner';

const EventForm: React.FC<{ onClose: () => void, onSubmit: (data: any) => void }> = ({ onClose, onSubmit }) => {
    const { currentUser, eventTemplates, generateEventDescription } = useAppContext();
    const [formData, setFormData] = useState({
        title: '', description: '', location: '', exactLocation: '', postcode: '', date: '', time: '', deadline: '', volunteersNeeded: 1, category: EventCategory.COMMUNITY_SUPPORT
    });
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    useEffect(() => {
        if (selectedTemplateId) {
            const template = eventTemplates.find(t => t.id === selectedTemplateId);
            if (template) {
                setFormData(prev => ({ ...prev, ...template.templateData }));
            }
        } else {
            setFormData({ title: '', description: '', location: '', exactLocation: '', postcode: '', date: '', time: '', deadline: '', volunteersNeeded: 1, category: EventCategory.COMMUNITY_SUPPORT });
        }
    }, [selectedTemplateId, eventTemplates]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'volunteersNeeded' ? parseInt(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    const myTemplates = currentUser ? eventTemplates.filter(t => t.creatorId === currentUser.id) : [];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {myTemplates.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-slate-700">Start with Template</label>
                    <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2">
                        <option value="">Start from scratch</option>
                        {myTemplates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-slate-700">Event Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows={4} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2">
                        {EVENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">General Location</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Exact Location (for Google Maps)</label>
                    <input type="text" name="exactLocation" value={formData.exactLocation} onChange={handleChange} placeholder="e.g. 123 Main St, City" className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Postcode</label>
                    <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Volunteers Needed</label>
                    <input type="number" name="volunteersNeeded" value={formData.volunteersNeeded} min="1" onChange={handleChange} required className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Time</label>
                    <input type="time" name="time" value={formData.time} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Application Deadline</label>
                    <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" />
                </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">Create Event</button>
            </div>
        </form>
    );
};

export const EventCreatorDashboard: React.FC = () => {
    const { currentUser, events, createEvent } = useAppContext();
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [managingEvent, setManagingEvent] = useState<Event | null>(null);

    useEffect(() => {
        if (managingEvent) {
            const updatedEvent = events.find(e => e.id === managingEvent.id);
            if (updatedEvent) {
                setManagingEvent(updatedEvent);
            } else {
                setManagingEvent(null);
            }
        }
    }, [events]);

    if (!currentUser) return null;
    
    if(currentUser.accountStatus === AccountStatus.PENDING) {
        return (
            <div className="container mx-auto p-8 text-center">
                 <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md" role="alert">
                    <p className="font-bold">Account Pending</p>
                    <p>Your account is currently under review by an administrator. You will be able to create events once your account is approved.</p>
                </div>
            </div>
        )
    }

    const myEvents = events.filter(event => event.creatorId === currentUser.id);

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">My Dashboard</h1>
                    <p className="text-slate-500 mt-1">Create and manage your community events.</p>
                </div>
                <button onClick={() => setCreateModalOpen(true)} className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-md hover:bg-sky-700 transition-colors duration-200 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Create New Event
                </button>
            </div>
             <h2 className="text-xl font-semibold text-slate-700 mb-4">My Events</h2>
            {myEvents.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {myEvents.map(event => (
                        <EventCard key={event.id} event={event} onViewDetails={setManagingEvent} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <p className="text-slate-500">You haven't created any events yet.</p>
                    <p className="text-slate-400 text-sm mt-2">Click "Create New Event" to get started!</p>
                </div>
            )}
            
            <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Create a New Event">
                <EventForm 
                    onClose={() => setCreateModalOpen(false)} 
                    onSubmit={(data) => createEvent({ ...data, creatorId: currentUser.id })} 
                />
            </Modal>
            
            {managingEvent && (
                <ManageEventModal
                    event={managingEvent}
                    isOpen={!!managingEvent}
                    onClose={() => setManagingEvent(null)}
                />
            )}
        </div>
    );
};