export enum UserRole {
  ADMIN = 'Admin',
  EVENT_CREATOR = 'Event Creator',
  VOLUNTEER = 'Volunteer'
}

export enum AccountStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  REJECTED = 'Rejected',
  SUSPENDED = 'Suspended'
}

export enum VolunteerStatus {
  UNVERIFIED = 'Unverified',
  VERIFIED = 'Verified'
}

export enum EventCategory {
  DAWAH = 'Dawah',
  ENVIRONMENTAL = 'Environmental',
  COMMUNITY_SUPPORT = 'Community Support',
  FAITH_BASED = 'Faith-Based',
}

export enum ReportStatus {
  PENDING = 'Pending',
  REVIEWED = 'Reviewed',
}

export interface Report {
  id: string;
  reportedId: string; 
  reportedName: string; 
  reportedType: 'User' | 'Event';
  reporterId: string;
  reporterName: string;
  reason: string;
  status: ReportStatus;
  timestamp: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  pointsRequired: number;
}

export interface Rating {
  eventId: string;
  criteria: 'Punctuality' | 'Teamwork' | 'Enthusiasm';
  score: 1 | 2 | 3 | 4 | 5;
}

export interface PointsEarning {
  eventId: string;
  eventName: string;
  points: number;
  date: string;
  reason: string;
}

export interface Skill {
  name: string;
  endorsements: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  postcode: string;
  points: number;
  badges: Badge[];
  readAnnouncements?: string[];
  flags?: number;
  appealMessage?: string;
  // Volunteer specific
  volunteerStatus?: VolunteerStatus;
  completedEvents?: number;
  ratings?: Rating[];
  pointsHistory?: PointsEarning[];
  skills?: Skill[];
  // Event creator specific
  createdEvents?: string[];
  phoneNumber?: string;
  requestedEventCreator?: boolean;
  statusMessage?: string;
}

export interface VolunteerApplication {
    userId: string;
    userName: string;
    status: 'Pending' | 'Confirmed' | 'Attended';
}

export interface Announcement {
  id: string;
  message: string;
  timestamp: string;
}

export interface EventTemplate {
  id: string;
  name: string;
  creatorId: string;
  templateData: Omit<Event, 'id' | 'date' | 'time' | 'deadline' | 'volunteers' | 'status' | 'creatorId' | 'creatorName' | 'announcements'>;
}

export interface HelpRequest {
  id: string;
  fullName: string;
  address: string;
  postcode: string;
  phoneNumber: string;
  helpNeeded: string;
  dateTime?: string;
  status: 'Pending' | 'Accepted';
  acceptedBy?: string;
  declinedBy?: string[];
  createdAt: number;
  coordinates?: { lat: number; lng: number };
}

export interface BannedRequester {
  id: string;
  phoneNumber: string;
  postcode: string;
  address: string;
}

export interface Event {
  id: string;
  title: string;
  description:string;
  location: string;
  exactLocation?: string;
  postcode: string;
  date: string;
  time: string;
  deadline: string;
  volunteersNeeded: number;
  volunteers: VolunteerApplication[];
  creatorId: string;
  creatorName: string;
  status: 'Upcoming' | 'Completed';
  category: EventCategory;
  announcements?: Announcement[];
}