import React, { useState } from 'react';
import { BADGES } from '../constants';
import { Badge } from '../types';

interface BadgeProgressProps {
    userPoints: number;
    userBadges: Badge[];
}

export const BadgeProgress: React.FC<BadgeProgressProps> = ({ userPoints, userBadges }) => {
    const [showAll, setShowAll] = useState(false);
    const sortedBadges = [...BADGES].sort((a, b) => a.pointsRequired - b.pointsRequired);
    const nextBadge = sortedBadges.find(badge => !userBadges.find(ub => ub.id === badge.id) && badge.pointsRequired > userPoints);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-zinc-100">
            <h2 className="text-xl font-semibold mb-4">Badge Progress</h2>
            {nextBadge ? (
                <div>
                    <p className="text-zinc-600 mb-2">
                        You are <span className="font-bold text-indigo-600">{nextBadge.pointsRequired - userPoints}</span> points away from the <span className="font-bold">{nextBadge.name}</span> badge!
                    </p>
                    <div className="w-full bg-zinc-200 rounded-full h-4 mb-4">
                        <div 
                            className="bg-indigo-600 h-4 rounded-full" 
                            style={{ width: `${Math.min(100, (userPoints / nextBadge.pointsRequired) * 100)}%` }}
                        ></div>
                    </div>
                </div>
            ) : (
                <p className="text-green-600 font-semibold">You've unlocked all available badges!</p>
            )}
            
            <button 
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-indigo-600 font-semibold hover:text-indigo-800"
            >
                {showAll ? 'Hide All Badges' : 'View All Badges'}
            </button>

            {showAll && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                    {sortedBadges.map(badge => {
                        const isUnlocked = userBadges.find(ub => ub.id === badge.id);
                        return (
                            <div key={badge.id} className={`p-4 rounded-xl border ${isUnlocked ? 'bg-indigo-50 border-indigo-200' : 'bg-zinc-50 border-zinc-200'}`}>
                                <div className="text-3xl mb-2">{badge.icon}</div>
                                <h4 className="font-semibold">{badge.name}</h4>
                                <p className="text-sm text-zinc-600">{badge.description}</p>
                                <p className="text-xs font-mono mt-2 text-zinc-500">{badge.pointsRequired} points</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
