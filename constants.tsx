
import { Badge, Event, User, UserRole, AccountStatus, VolunteerStatus, EventCategory, Skill } from './types';
import React from 'react';

export const HelpCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-help-circle"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);

export const BADGES: Badge[] = [
    { id: 'b1', name: 'First Step', icon: '🌟', description: 'Completed your first event.', pointsRequired: 10 },
    { id: 'b2', name: 'Helping Hand', icon: '🤝', description: 'Completed 5 events.', pointsRequired: 50 },
    { id: 'b3', name: 'Community Pillar', icon: '🏛️', description: 'Completed 15 events.', pointsRequired: 150 },
    { id: 'b4', name: 'Dawah Champion', icon: '📣', description: 'Participated in a Dawah event.', pointsRequired: 100 },
    { id: 'b5', name: 'Green Thumb', icon: '🌳', description: 'Participated in a clean-up event.', pointsRequired: 100 },
    { id: 'b6', name: 'Super Volunteer', icon: '🦸', description: 'Completed 25 events.', pointsRequired: 300 },
    { id: 'b7', name: 'Faith Leader', icon: '🕌', description: 'Participated in 5 Faith-Based events.', pointsRequired: 250 },
    { id: 'b8', name: 'Community Hero', icon: '🦸‍♂️', description: 'Completed 50 events.', pointsRequired: 600 },
    { id: 'b9', name: 'Eco Warrior', icon: '🌍', description: 'Participated in 5 Environmental events.', pointsRequired: 250 }
];

export const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Admin Ali', email: 'admin@khidma.connect', role: UserRole.ADMIN, accountStatus: AccountStatus.ACTIVE, postcode: 'N1 1AA', points: 0, badges: [] },
    { id: 'u2', name: 'Farah Khan', email: 'farah@provider.com', role: UserRole.EVENT_CREATOR, accountStatus: AccountStatus.PENDING, postcode: 'E1 6AN', points: 150, badges: [], createdEvents: ['e1', 'e2'] },
    { id: 'u3', name: 'Hassan Yusuf', email: 'hassan@provider.com', role: UserRole.EVENT_CREATOR, accountStatus: AccountStatus.ACTIVE, postcode: 'SW1A 0AA', points: 450, badges: [], createdEvents: ['e3', 'e4', 'e5'] },
    { 
        id: 'u4', 
        name: 'Aisha Ahmed', 
        email: 'aisha@volunteer.com', 
        role: UserRole.VOLUNTEER, 
        accountStatus: AccountStatus.ACTIVE, 
        postcode: 'W2 2UH', 
        points: 75, 
        badges: [BADGES[0], BADGES[1]], 
        volunteerStatus: VolunteerStatus.VERIFIED, 
        completedEvents: 6, 
        ratings: [
             { eventId: 'e-hist-1', criteria: 'Punctuality', score: 5 },
             { eventId: 'e-hist-1', criteria: 'Teamwork', score: 4 },
             { eventId: 'e-hist-1', criteria: 'Enthusiasm', score: 5 },
        ],
        pointsHistory: [
            { eventId: 'e1', eventName: 'Street Dawah at Trafalgar Square', points: 15, date: '2024-08-15', reason: 'Great enthusiasm' },
            { eventId: 'e-hist-1', eventName: 'Soup Kitchen Volunteering', points: 10, date: '2024-07-20', reason: 'Event completion' },
            { eventId: 'e-hist-2', eventName: 'Charity Fun Run Marshaling', points: 20, date: '2024-07-05', reason: 'Extra responsibility taken' },
            { eventId: 'e-hist-3', eventName: 'Elderly Companion Visit', points: 10, date: '2024-06-12', reason: 'Event completion' },
            { eventId: 'e-hist-4', eventName: 'Park Greening Project', points: 10, date: '2024-05-28', reason: 'Event completion' },
            { eventId: 'e-hist-5', eventName: 'Community Iftar Preparation', points: 10, date: '2024-04-15', reason: 'Event completion' },
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        skills: [
            { name: 'Public Speaking', endorsements: 1 },
            { name: 'Team Leadership', endorsements: 0 },
        ],
    },
    { 
        id: 'u5', 
        name: 'Bilal Chowdhury', 
        email: 'bilal@volunteer.com', 
        role: UserRole.VOLUNTEER, 
        accountStatus: AccountStatus.ACTIVE, 
        postcode: 'SE1 7PB', 
        points: 10, 
        badges: [BADGES[0]], 
        volunteerStatus: VolunteerStatus.UNVERIFIED, 
        completedEvents: 1, 
        ratings: [],
        pointsHistory: [
            { eventId: 'e2', eventName: 'Community Park Clean-Up', points: 10, date: '2024-08-20', reason: 'Event completion' }
        ],
        skills: [
            { name: 'Gardening', endorsements: 0 },
        ]
    },
    { 
        id: 'u6', 
        name: 'Zainab Patel', 
        email: 'zainab@volunteer.com', 
        role: UserRole.VOLUNTEER, 
        accountStatus: AccountStatus.ACTIVE, 
        postcode: 'IG1 1NL', 
        points: 25, 
        badges: [], 
        volunteerStatus: VolunteerStatus.UNVERIFIED, 
        completedEvents: 0, 
        ratings: [],
        pointsHistory: [],
        skills: [
            { name: 'First Aid', endorsements: 0 },
        ],
    },
];

export const MOCK_EVENTS: Event[] = [
    { id: 'e1', title: 'Street Dawah at Trafalgar Square', description: 'Join us to share the beautiful message of Islam with the public. Materials will be provided.', location: 'Trafalgar Square, London', postcode: 'WC2N 5DN', date: '2024-08-15', time: '14:00', deadline: '2024-08-13', volunteersNeeded: 10, volunteers: [{ userId: 'u4', userName: 'Aisha Ahmed', status: 'Attended' }, { userId: 'u5', userName: 'Bilal Chowdhury', status: 'Confirmed' }], creatorId: 'u2', creatorName: 'Farah Khan', status: 'Completed', category: EventCategory.DAWAH },
    { id: 'e2', title: 'Community Park Clean-Up', description: 'Let\'s make our local park a cleaner and safer place for everyone. Gloves and bags will be provided.', location: 'Victoria Park, London', postcode: 'E9 7DE', date: '2024-08-20', time: '10:00', deadline: '2024-08-18', volunteersNeeded: 20, volunteers: [{ userId: 'u5', userName: 'Bilal Chowdhury', status: 'Pending' }, { userId: 'u4', userName: 'Aisha Ahmed', status: 'Confirmed' }], creatorId: 'u2', creatorName: 'Farah Khan', status: 'Upcoming', category: EventCategory.ENVIRONMENTAL },
    { id: 'e3', title: 'Visit the Elderly', description: 'Spend some time with the respected elders in our community, offering companionship and support.', location: 'Green Meadows Care Home, London', postcode: 'SW1P 3JA', date: '2024-08-25', time: '15:00', deadline: '2024-08-23', volunteersNeeded: 5, volunteers: [], creatorId: 'u3', creatorName: 'Hassan Yusuf', status: 'Upcoming', category: EventCategory.COMMUNITY_SUPPORT },
    { id: 'e4', title: 'Feed the Homeless Drive', description: 'Help prepare and distribute warm meals to those in need. A very rewarding experience.', location: 'Charing Cross Station, London', postcode: 'WC2N 5DR', date: '2024-09-01', time: '18:00', deadline: '2024-08-30', volunteersNeeded: 15, volunteers: [], creatorId: 'u3', creatorName: 'Hassan Yusuf', status: 'Upcoming', category: EventCategory.COMMUNITY_SUPPORT },
    { id: 'e5', title: 'Mosque Open Day Support', description: 'Assist in welcoming visitors and guiding them during our annual open day event.', location: 'East London Mosque', postcode: 'E1 1JQ', date: '2024-09-10', time: '11:00', deadline: '2024-09-08', volunteersNeeded: 8, volunteers: [], creatorId: 'u3', creatorName: 'Hassan Yusuf', status: 'Upcoming', category: EventCategory.FAITH_BASED }
];

export const EVENT_CATEGORIES = Object.values(EventCategory);

export const RADIUS_OPTIONS = [5, 10, 15, 25, 50];