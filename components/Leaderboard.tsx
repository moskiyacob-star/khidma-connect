
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { UserRole } from '../types';

const TrophyIcon: React.FC<{ rank: number }> = ({ rank }) => {
    const colors: { [key: number]: string } = {
        1: 'text-amber-400',
        2: 'text-slate-400',
        3: 'text-amber-600'
    };
    if (!colors[rank]) return null;
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${colors[rank]}`} viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 100 2h2.586l-2.293 2.293a1 1 0 000 1.414L15.586 13H13a1 1 0 100 2h4a1 1 0 001-1V5a1 1 0 10-2 0v2.586l-2.293-2.293a1 1 0 00-1.414 0L11 7.586V3z" />
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5z" />
        </svg>
    );
};

export const Leaderboard: React.FC = () => {
    const { users, currentUser } = useAppContext();

    const volunteers = users
        .filter(u => u.role === UserRole.VOLUNTEER)
        .sort((a, b) => b.points - a.points);

    return (
        <div className="p-6 bg-white rounded-b-lg">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Top Volunteers</h3>
            <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2">
                {volunteers.map((user, index) => (
                    <div 
                        key={user.id} 
                        className={`p-3 rounded-lg flex items-center justify-between transition-colors ${
                            currentUser?.id === user.id ? 'bg-sky-100 border border-sky-200' : 'bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center">
                            <span className="text-sm font-bold text-slate-500 w-6">{index + 1}</span>
                            <div className="ml-2">
                                <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                                <p className="text-xs text-slate-400">{user.completedEvents ?? 0} events</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="font-bold text-emerald-600 text-sm">{user.points} pts</span>
                            {index < 3 && <div className="ml-2"><TrophyIcon rank={index + 1} /></div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
