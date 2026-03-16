
import React from 'react';
import { Badge as BadgeType } from '../types';

interface BadgeProps {
    badge: BadgeType;
}

export const Badge: React.FC<BadgeProps> = ({ badge }) => {
    return (
        <div className="group relative flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 bg-slate-200 rounded-full text-3xl transform group-hover:scale-110 transition-transform duration-200">
                {badge.icon}
            </div>
            <p className="text-xs text-slate-600 mt-2 font-semibold">{badge.name}</p>
            <div className="absolute bottom-full mb-2 w-max px-3 py-1.5 text-sm font-medium text-white bg-slate-800 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {badge.description}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
            </div>
        </div>
    );
};
