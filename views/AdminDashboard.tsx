
import React, { useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { UserCard } from '../components/UserCard';
import { UserRole, AccountStatus, EventCategory, ReportStatus, Rating, Report } from '../types';
import { AnalyticsCard } from '../components/AnalyticsCard';

const ReportCard: React.FC<{ report: Report, onUpdateStatus: (reportId: string, status: ReportStatus) => void }> = ({ report, onUpdateStatus }) => {
    return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-slate-800">
                        <span className="font-bold text-sky-600">{report.reportedName}</span> ({report.reportedType})
                    </p>
                    <p className="text-sm text-slate-500">Reported by: {report.reporterName}</p>
                     <p className="text-xs text-slate-400 mt-1">
                        {new Date(report.timestamp).toLocaleString()}
                     </p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => onUpdateStatus(report.id, ReportStatus.REVIEWED)} className="px-3 py-1 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 transition-colors">
                        Mark Reviewed
                    </button>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-sm text-slate-600"><span className="font-semibold">Reason:</span> {report.reason}</p>
            </div>
        </div>
    );
};


export const AdminDashboard: React.FC = () => {
    const { users, events, reports, updateUserStatus, updateReportStatus, approveEventCreator, reinstateUser } = useAppContext();

    const pendingCreators = users.filter(user => 
        (user.role === UserRole.EVENT_CREATOR && user.accountStatus === AccountStatus.PENDING) ||
        user.requestedEventCreator === true
    );

    const pendingReports = reports.filter(report => report.status === ReportStatus.PENDING);
    const suspendedUsers = users.filter(user => user.accountStatus === AccountStatus.SUSPENDED);

    const analytics = useMemo(() => {
        const volunteers = users.filter(u => u.role === UserRole.VOLUNTEER || u.role === UserRole.EVENT_CREATOR);
        const creators = users.filter(u => u.role === UserRole.EVENT_CREATOR);
        const upcomingEvents = events.filter(e => e.status === 'Upcoming');
        const completedEvents = events.filter(e => e.status === 'Completed');

        const categoryCounts = events.reduce((acc, event) => {
            const cat = event.category as string;
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostPopularCategory = Object.entries(categoryCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A';
        
        const allRatings = volunteers.flatMap(v => v.ratings || []);
        const averageRating = allRatings.length > 0
            ? allRatings.reduce((acc, r) => acc + r.score, 0) / allRatings.length
            : 0;

        return {
            totalVolunteers: volunteers.length,
            totalCreators: creators.length,
            upcomingEvents: upcomingEvents.length,
            completedEvents: completedEvents.length,
            mostPopularCategory,
            averageRating: averageRating.toFixed(1),
        };
    }, [users, events]);

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
                <p className="text-slate-500 mt-1">Oversee and manage the platform.</p>
            </div>
            
            {/* Analytics Section */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <AnalyticsCard title="Total Volunteers" value={analytics.totalVolunteers.toString()} />
                <AnalyticsCard title="Total Creators" value={analytics.totalCreators.toString()} />
                <AnalyticsCard title="Upcoming Events" value={analytics.upcomingEvents.toString()} />
                <AnalyticsCard title="Completed Events" value={analytics.completedEvents.toString()} />
                <AnalyticsCard title="Top Category" value={analytics.mostPopularCategory} isText />
                <AnalyticsCard title="Avg. Rating" value={analytics.averageRating} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-slate-700 mb-4">Pending Event Creator Accounts</h2>
                    {pendingCreators.length > 0 ? (
                        <div className="space-y-4">
                            {pendingCreators.map(user => (
                                <UserCard 
                                    key={user.id} 
                                    user={user} 
                                    onApprove={(userId) => {
                                        console.log("Admin clicked approve for:", userId);
                                        if (user.requestedEventCreator) {
                                            approveEventCreator(userId).then(() => {
                                                console.log("Approval successful");
                                            }).catch(err => {
                                                console.error("Approval failed:", err);
                                            });
                                        } else {
                                            updateUserStatus(userId, AccountStatus.ACTIVE);
                                        }
                                    }} 
                                    onReject={(userId) => updateUserStatus(userId, AccountStatus.REJECTED, "Thank you for your interest. Unfortunately, we cannot approve your Event Creator request at this time. Please feel free to continue volunteering for our upcoming events!")} 
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-lg">
                            <p className="text-slate-500">No pending accounts to review.</p>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-slate-700 mb-4">Pending Reports</h2>
                    {pendingReports.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {pendingReports.map(report => (
                                <ReportCard
                                    key={report.id}
                                    report={report}
                                    onUpdateStatus={updateReportStatus}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-lg">
                            <p className="text-slate-500">No pending reports.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Suspended Users Section */}
            {suspendedUsers.length > 0 && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow-md border-l-4 border-rose-500">
                    <h2 className="text-xl font-semibold text-slate-700 mb-4">Suspended Users & Appeals</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {suspendedUsers.map(user => (
                            <div key={user.id} className="p-4 border border-rose-200 rounded-lg bg-rose-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-slate-800">{user.name}</p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                                        Suspended ({user.flags || 0} flags)
                                    </span>
                                </div>
                                {user.appealMessage ? (
                                    <div className="mt-3 p-3 bg-white rounded border border-rose-100 text-sm">
                                        <p className="font-semibold text-slate-700 mb-1">Appeal Message:</p>
                                        <p className="text-slate-600 italic">"{user.appealMessage}"</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 mt-2 italic">No appeal submitted yet.</p>
                                )}
                                <div className="mt-4 flex justify-end">
                                    <button 
                                        onClick={() => reinstateUser(user.id)}
                                        className="px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-md hover:bg-emerald-600 transition"
                                    >
                                        Reinstate User
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* User Directory */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-slate-700 mb-4">User Directory</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.sort((a, b) => a.name.localeCompare(b.name)).map(user => (
                        <div key={user.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50 hover:bg-white hover:shadow-sm transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800">{user.name}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                    user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' :
                                    user.role === UserRole.EVENT_CREATOR ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-sky-100 text-sky-700'
                                }`}>
                                    {user.role}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                                <p className="text-[10px] text-slate-400">Points: <span className="font-semibold text-slate-600">{user.points}</span></p>
                                {user.volunteerStatus && (
                                    <span className="text-[10px] text-slate-400 italic">{user.volunteerStatus}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};