import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { User, Event, UserRole, AccountStatus, Rating, VolunteerStatus, Skill, EventTemplate, Report, ReportStatus, HelpRequest, BannedRequester } from '../types';
import { GoogleGenAI } from '@google/genai';
import { db, auth } from '../firebase';
import { 
    collection, 
    onSnapshot, 
    doc, 
    setDoc, 
    updateDoc, 
    addDoc, 
    deleteDoc, 
    deleteField,
    query, 
    where,
    Timestamp
} from 'firebase/firestore';
import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signOut,
    User as FirebaseUser
} from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AppContextType {
    currentUser: User | null;
    users: User[];
    events: Event[];
    eventTemplates: EventTemplate[];
    reports: Report[];
    isAuthReady: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    updateUserStatus: (userId: string, status: AccountStatus, message?: string) => Promise<void>;
    clearStatusMessage: () => Promise<void>;
    createEvent: (event: Omit<Event, 'id' | 'creatorName' | 'volunteers' | 'status'>) => Promise<void>;
    applyForEvent: (eventId: string, userId: string, userName: string) => Promise<void>;
    confirmAttendance: (eventId: string, volunteerId: string, attended: boolean) => Promise<void>;
    submitRating: (eventId: string, eventName: string, volunteerId: string, ratings: Rating[]) => Promise<void>;
    updateEventStatus: (eventId: string, status: 'Completed') => Promise<void>;
    addSkill: (skillName: string) => Promise<void>;
    endorseSkill: (volunteerId: string, skillName: string) => Promise<void>;
    saveEventAsTemplate: (event: Event, templateName: string) => Promise<void>;
    sendAnnouncement: (eventId: string, message: string) => Promise<void>;
    submitReport: (reportedId: string, reportedName: string, reportedType: 'User' | 'Event', reason: string) => Promise<void>;
    updateReportStatus: (reportId: string, status: ReportStatus) => Promise<void>;
    requestEventCreatorRole: (phoneNumber: string, postcode: string) => Promise<void>;
    approveEventCreator: (userId: string) => Promise<void>;
    appealSuspension: (message: string) => Promise<void>;
    reinstateUser: (userId: string) => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    acceptVolunteer: (eventId: string, volunteerId: string) => Promise<void>;
    rejectVolunteer: (eventId: string, volunteerId: string) => Promise<void>;
    helpRequests: HelpRequest[];
    bannedRequesters: BannedRequester[];
    createHelpRequest: (request: Omit<HelpRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
    acceptHelpRequest: (requestId: string) => Promise<void>;
    declineHelpRequest: (requestId: string) => Promise<void>;
    reportHelpRequest: (requestId: string) => Promise<void>;
    markAnnouncementAsRead: (announcementId: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [eventTemplates, setEventTemplates] = useState<EventTemplate[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
    const [bannedRequesters, setBannedRequesters] = useState<BannedRequester[]>([]);
    const [isAuthReady, setIsAuthReady] = useState(false);

    const ADMIN_EMAIL = 'moskiyacob@gmail.com';

    // Derive currentUser from users list and firebaseUser UID
    const currentUser = React.useMemo(() => {
        if (!firebaseUser) return null;
        return users.find(u => u.id === firebaseUser.uid) || null;
    }, [users, firebaseUser]);

    // Sync Users
    useEffect(() => {
        if (!isAuthReady || !firebaseUser) {
            setUsers([]);
            return;
        }
        console.log("Setting up Users sync...");
        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersData = snapshot.docs.map(doc => doc.data() as User);
            console.log("Users sync received data:", usersData.length, "users");
            setUsers(usersData);
        }, (error) => {
            console.error("Users sync error:", error);
        });
        return () => unsubscribe();
    }, [isAuthReady, firebaseUser]);

    // Sync Events
    useEffect(() => {
        if (!isAuthReady || !firebaseUser) {
            setEvents([]);
            return;
        }
        console.log("Setting up Events sync...");
        const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
            const eventsData = snapshot.docs.map(doc => doc.data() as Event);
            console.log("Events sync received data:", eventsData.length, "events");
            setEvents(eventsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }, (error) => {
            console.error("Events sync error:", error);
        });
        return () => unsubscribe();
    }, [isAuthReady, firebaseUser]);

    // Sync Templates
    useEffect(() => {
        if (!isAuthReady || !firebaseUser) {
            console.log("Templates sync skipped: Auth not ready or no user");
            setEventTemplates([]);
            return;
        }
        console.log("Setting up Templates sync for user:", firebaseUser.uid);
        const unsubscribe = onSnapshot(collection(db, 'eventTemplates'), (snapshot) => {
            const templatesData = snapshot.docs.map(doc => doc.data() as EventTemplate);
            console.log("Templates sync received data:", templatesData.length, "templates");
            setEventTemplates(templatesData);
        }, (error) => {
            console.error("Templates sync error:", error.message);
            if (error.message.includes("permissions")) {
                console.log("Current Auth State:", auth.currentUser ? "Logged In" : "Logged Out");
            }
        });
        return () => unsubscribe();
    }, [isAuthReady, firebaseUser]);

    // Sync Reports
    useEffect(() => {
        if (currentUser?.role !== UserRole.ADMIN) {
            setReports([]);
            return;
        }
        console.log("Setting up Reports sync...");
        const unsubscribe = onSnapshot(collection(db, 'reports'), (snapshot) => {
            const reportsData = snapshot.docs.map(doc => doc.data() as Report);
            console.log("Reports sync received data:", reportsData.length, "reports");
            setReports(reportsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        }, (error) => {
            console.error("Reports sync error:", error);
        });
        return () => unsubscribe();
    }, [currentUser?.role]);

    // Sync Help Requests
    useEffect(() => {
        if (!isAuthReady || !firebaseUser) {
            setHelpRequests([]);
            return;
        }
        const unsubscribe = onSnapshot(collection(db, 'helpRequests'), (snapshot) => {
            const data = snapshot.docs.map(doc => doc.data() as HelpRequest);
            setHelpRequests(data.sort((a, b) => b.createdAt - a.createdAt));
        }, (error) => {
            console.error("Help Requests sync error:", error);
        });
        return () => unsubscribe();
    }, [isAuthReady, firebaseUser]);

    // Sync Banned Requesters
    useEffect(() => {
        if (!isAuthReady) {
            setBannedRequesters([]);
            return;
        }
        const unsubscribe = onSnapshot(collection(db, 'bannedRequesters'), (snapshot) => {
            const data = snapshot.docs.map(doc => doc.data() as BannedRequester);
            setBannedRequesters(data);
        }, (error) => {
            console.error("Banned Requesters sync error:", error);
        });
        return () => unsubscribe();
    }, [isAuthReady]);

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await (async () => {
                    try {
                        const { getDoc } = await import('firebase/firestore');
                        return await getDoc(userDocRef);
                    } catch (e) {
                        return null;
                    }
                })();

                if (userDoc && userDoc.exists()) {
                    const data = userDoc.data() as User;
                    if (user.email === ADMIN_EMAIL && data.role !== UserRole.ADMIN) {
                        await updateDoc(userDocRef, { role: UserRole.ADMIN });
                    }
                } else {
                    const newUser: User = {
                        id: user.uid,
                        name: user.displayName || 'New User',
                        email: user.email || '',
                        role: user.email === ADMIN_EMAIL ? UserRole.ADMIN : UserRole.VOLUNTEER,
                        accountStatus: AccountStatus.ACTIVE,
                        postcode: '',
                        points: 0,
                        badges: [],
                        volunteerStatus: VolunteerStatus.UNVERIFIED,
                        completedEvents: 0,
                        ratings: [],
                        pointsHistory: [],
                        skills: [],
                    };
                    await setDoc(userDocRef, newUser);
                }
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const clearStatusMessage = useCallback(async () => {
        if (!currentUser) return;
        const path = `users/${currentUser.id}`;
        try {
            await updateDoc(doc(db, 'users', currentUser.id), { statusMessage: deleteField() });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [currentUser]);

    const login = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login error:", error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const updateUserStatus = useCallback(async (userId: string, status: AccountStatus, message?: string) => {
        console.log("Updating user status:", userId, status, message);
        const path = `users/${userId}`;
        try {
            const updateData: any = { accountStatus: status };
            if (message) updateData.statusMessage = message;
            if (status === AccountStatus.REJECTED) {
                updateData.requestedEventCreator = false;
            }
            await updateDoc(doc(db, 'users', userId), updateData);
            console.log("User status updated successfully");
        } catch (error) {
            console.error("User status update failed:", error);
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, []);

    const requestEventCreatorRole = useCallback(async (phoneNumber: string, postcode: string) => {
        if (!currentUser) return;
        const path = `users/${currentUser.id}`;
        try {
            await updateDoc(doc(db, 'users', currentUser.id), { 
                phoneNumber, 
                postcode,
                requestedEventCreator: true 
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [currentUser]);

    const approveEventCreator = useCallback(async (userId: string) => {
        console.log("Approving event creator:", userId);
        const user = users.find(u => u.id === userId);
        if (!user) {
            console.error("User not found for approval:", userId);
            return;
        }

        const path = `users/${userId}`;
        const newBadge = {
            id: `b${Date.now()}`,
            name: 'Verified Event Creator',
            icon: '🛡️',
            date: new Date().toISOString().split('T')[0]
        };

        try {
            await updateDoc(doc(db, 'users', userId), { 
                role: UserRole.EVENT_CREATOR,
                requestedEventCreator: false,
                accountStatus: AccountStatus.ACTIVE,
                statusMessage: 'Congratulations! Your Event Creator application has been approved.',
                badges: [...(user.badges || []), newBadge]
            });
            console.log("Event creator approved successfully");
        } catch (error) {
            console.error("Event creator approval failed:", error);
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [users]);

    const appealSuspension = useCallback(async (message: string) => {
        if (!currentUser) return;
        const path = `users/${currentUser.id}`;
        try {
            await updateDoc(doc(db, 'users', currentUser.id), {
                appealMessage: message
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [currentUser]);

    const reinstateUser = useCallback(async (userId: string) => {
        const path = `users/${userId}`;
        try {
            await updateDoc(doc(db, 'users', userId), {
                accountStatus: AccountStatus.ACTIVE,
                flags: 0,
                appealMessage: deleteField()
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, []);

    const updateProfile = useCallback(async (data: Partial<User>) => {
        if (!currentUser) return;
        const path = `users/${currentUser.id}`;
        try {
            await updateDoc(doc(db, 'users', currentUser.id), data);
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [currentUser]);

    const createEvent = useCallback(async (eventData: Omit<Event, 'id' | 'creatorName' | 'volunteers' | 'status'>) => {
        if (!currentUser) return;
        const id = `e${Date.now()}`;
        const path = `events/${id}`;
        const newEvent: Event = {
            ...eventData,
            id,
            creatorId: (eventData as any).creatorId || currentUser.id,
            creatorName: currentUser.name,
            volunteers: [],
            status: 'Upcoming',
            announcements: [],
        };
        try {
            await setDoc(doc(db, 'events', id), newEvent);
            console.log("Event created successfully:", id);
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
        }
    }, [currentUser]);

    const applyForEvent = useCallback(async (eventId: string, userId: string, userName: string) => {
        const event = events.find(e => e.id === eventId);
        if (!event) return;
        if (event.volunteers.some(v => v.userId === userId)) return;
        if (event.volunteers.length >= event.volunteersNeeded) return;

        const path = `events/${eventId}`;
        const newVolunteer = { userId, userName, status: 'Pending' as const };
        try {
            await updateDoc(doc(db, 'events', eventId), {
                volunteers: [...event.volunteers, newVolunteer]
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [events]);
    
    const confirmAttendance = useCallback(async (eventId: string, volunteerId: string, attended: boolean) => {
        const event = events.find(e => e.id === eventId);
        if (!event) return;

        const path = `events/${eventId}`;
        const updatedVolunteers = event.volunteers.map(v => 
            v.userId === volunteerId ? { ...v, status: attended ? 'Attended' : 'Confirmed' } : v
        );
        try {
            await updateDoc(doc(db, 'events', eventId), { volunteers: updatedVolunteers });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [events]);

    const acceptVolunteer = useCallback(async (eventId: string, volunteerId: string) => {
        const event = events.find(e => e.id === eventId);
        if (!event) return;

        const path = `events/${eventId}`;
        const updatedVolunteers = event.volunteers.map(v => 
            v.userId === volunteerId ? { ...v, status: 'Confirmed' as const } : v
        );
        try {
            await updateDoc(doc(db, 'events', eventId), { volunteers: updatedVolunteers });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [events]);

    const rejectVolunteer = useCallback(async (eventId: string, volunteerId: string) => {
        const event = events.find(e => e.id === eventId);
        if (!event) return;

        const path = `events/${eventId}`;
        const updatedVolunteers = event.volunteers.filter(v => v.userId !== volunteerId);
        try {
            await updateDoc(doc(db, 'events', eventId), { volunteers: updatedVolunteers });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [events]);
    
    const submitRating = useCallback(async (eventId: string, eventName: string, volunteerId: string, ratings: Rating[]) => {
        const user = users.find(u => u.id === volunteerId);
        if (!user) return;

        // Check if rating already exists for this event
        if (user.ratings?.some(r => r.eventId === eventId)) {
            console.error("Rating already submitted for this event");
            return;
        }

        const totalScore = ratings.reduce((acc, r) => acc + r.score, 0);
        const pointsEarned = Math.round(totalScore / ratings.length) * 5;

        const newPointsHistoryEntry = {
            eventId,
            eventName,
            points: pointsEarned,
            date: new Date().toISOString().split('T')[0],
            reason: 'Performance rating'
        };

        const newCompletedEvents = (user.completedEvents || 0) + 1;
        const newPoints = user.points + pointsEarned;
        
        let newBadges = [...(user.badges || [])];
        if (newCompletedEvents === 1 && !newBadges.some(b => b.name === 'First Event')) {
            newBadges.push({ id: 'badge-1', name: 'First Event', icon: '🌟', description: 'Completed your first event!' });
        }
        if (newCompletedEvents === 5 && !newBadges.some(b => b.name === 'High Five')) {
            newBadges.push({ id: 'badge-5', name: 'High Five', icon: '🖐️', description: 'Completed 5 events!' });
        }
        if (newPoints >= 100 && !newBadges.some(b => b.name === 'Century Club')) {
            newBadges.push({ id: 'badge-100', name: 'Century Club', icon: '💯', description: 'Earned 100 points!' });
        }

        const path = `users/${volunteerId}`;
        try {
            await updateDoc(doc(db, 'users', volunteerId), {
                ratings: [...(user.ratings || []), ...ratings],
                volunteerStatus: VolunteerStatus.VERIFIED,
                points: newPoints,
                pointsHistory: [newPointsHistoryEntry, ...(user.pointsHistory || [])],
                completedEvents: newCompletedEvents,
                badges: newBadges
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [users]);

    const updateEventStatus = useCallback(async (eventId: string, status: 'Completed') => {
        const path = `events/${eventId}`;
        try {
            const updateData: any = { status };
            if (status === 'Completed') {
                updateData.announcements = [];
            }
            await updateDoc(doc(db, 'events', eventId), updateData);
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, []);

    const addSkill = useCallback(async (skillName: string) => {
        if (!currentUser || skillName.trim() === '') return;
        
        const existingSkills = currentUser.skills || [];
        if (existingSkills.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
            return;
        }
        const newSkill: Skill = { name: skillName, endorsements: 0 };
        const path = `users/${currentUser.id}`;
        try {
            await updateDoc(doc(db, 'users', currentUser.id), {
                skills: [...existingSkills, newSkill]
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [currentUser]);
    
    const endorseSkill = useCallback(async (volunteerId: string, skillName: string) => {
        const user = users.find(u => u.id === volunteerId);
        if (!user) return;

        const updatedSkills = (user.skills || []).map(skill => 
            skill.name === skillName 
                ? { ...skill, endorsements: skill.endorsements + 1 } 
                : skill
        );
        const path = `users/${volunteerId}`;
        try {
            await updateDoc(doc(db, 'users', volunteerId), { skills: updatedSkills });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [users]);

    const saveEventAsTemplate = useCallback(async (event: Event, templateName: string) => {
        if (!currentUser || !templateName.trim()) return;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, date, time, deadline, volunteers, status, creatorId, creatorName, announcements, ...templateData } = event;
        const templateId = `t${Date.now()}`;
        const newTemplate: EventTemplate = {
            id: templateId,
            name: templateName,
            creatorId: currentUser.id,
            templateData,
        };
        const path = `eventTemplates/${templateId}`;
        try {
            await setDoc(doc(db, 'eventTemplates', templateId), newTemplate);
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
        }
    }, [currentUser]);

    const sendAnnouncement = useCallback(async (eventId: string, message: string) => {
        if (!message.trim()) return;
        const event = events.find(e => e.id === eventId);
        if (!event) return;

        const newAnnouncement = {
            id: `ann${Date.now()}`,
            message,
            timestamp: new Date().toISOString(),
        };
        const path = `events/${eventId}`;
        try {
            await updateDoc(doc(db, 'events', eventId), {
                announcements: [...(event.announcements || []), newAnnouncement]
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [events]);

    const submitReport = useCallback(async (reportedId: string, reportedName: string, reportedType: 'User' | 'Event', reason: string) => {
        if (!currentUser || !reason.trim()) return;
        const reportId = `rep${Date.now()}`;
        const newReport: Report = {
            id: reportId,
            reportedId,
            reportedName,
            reportedType,
            reporterId: currentUser.id,
            reporterName: currentUser.name,
            reason,
            status: ReportStatus.PENDING,
            timestamp: new Date().toISOString(),
        };
        const path = `reports/${reportId}`;
        try {
            await setDoc(doc(db, 'reports', reportId), newReport);
            
            if (reportedType === 'User') {
                const reportedUser = users.find(u => u.id === reportedId);
                if (reportedUser) {
                    const newFlags = (reportedUser.flags || 0) + 1;
                    const updates: any = { flags: newFlags };
                    if (newFlags >= 3) {
                        updates.accountStatus = AccountStatus.SUSPENDED;
                    }
                    await updateDoc(doc(db, 'users', reportedId), updates);
                }
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
        }
    }, [currentUser, users]);

    const updateReportStatus = useCallback(async (reportId: string, status: ReportStatus) => {
        const path = `reports/${reportId}`;
        try {
            await updateDoc(doc(db, 'reports', reportId), { status });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, []);


    const createHelpRequest = useCallback(async (request: Omit<HelpRequest, 'id' | 'status' | 'createdAt'>) => {
        const path = 'helpRequests';
        try {
            const newRequest: HelpRequest = {
                ...request,
                id: Date.now().toString(),
                status: 'Pending',
                createdAt: Date.now(),
            };
            await setDoc(doc(db, 'helpRequests', newRequest.id), newRequest);
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
        }
    }, []);

    const acceptHelpRequest = useCallback(async (requestId: string) => {
        if (!currentUser) return;
        const path = `helpRequests/${requestId}`;
        try {
            await updateDoc(doc(db, 'helpRequests', requestId), {
                status: 'Accepted',
                acceptedBy: currentUser.id
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [currentUser]);

    const declineHelpRequest = useCallback(async (requestId: string) => {
        if (!currentUser) return;
        const request = helpRequests.find(r => r.id === requestId);
        if (!request) return;
        const path = `helpRequests/${requestId}`;
        try {
            await updateDoc(doc(db, 'helpRequests', requestId), {
                declinedBy: [...(request.declinedBy || []), currentUser.id]
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [currentUser, helpRequests]);

    const reportHelpRequest = useCallback(async (requestId: string) => {
        const request = helpRequests.find(r => r.id === requestId);
        if (!request) return;
        const path = `bannedRequesters/${request.id}`;
        try {
            const banned: BannedRequester = {
                id: request.id,
                phoneNumber: request.phoneNumber,
                postcode: request.postcode,
                address: request.address
            };
            // Delete the request
            await deleteDoc(doc(db, 'helpRequests', requestId));
            // Add to banned requesters
            await setDoc(doc(db, 'bannedRequesters', request.id), banned);
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
        }
    }, [helpRequests]);

    const markAnnouncementAsRead = useCallback(async (announcementId: string) => {
        if (!currentUser) return;
        const path = `users/${currentUser.id}`;
        try {
            await updateDoc(doc(db, 'users', currentUser.id), {
                readAnnouncements: [...(currentUser.readAnnouncements || []), announcementId]
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        }
    }, [currentUser]);

    const value = { currentUser, users, events, isAuthReady, login, logout, updateUserStatus, createEvent, applyForEvent, confirmAttendance, submitRating, updateEventStatus, addSkill, endorseSkill, eventTemplates, saveEventAsTemplate, sendAnnouncement, reports, submitReport, updateReportStatus, requestEventCreatorRole, approveEventCreator, appealSuspension, reinstateUser, updateProfile, clearStatusMessage, acceptVolunteer, rejectVolunteer, helpRequests, bannedRequesters, createHelpRequest, acceptHelpRequest, declineHelpRequest, reportHelpRequest, markAnnouncementAsRead };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
