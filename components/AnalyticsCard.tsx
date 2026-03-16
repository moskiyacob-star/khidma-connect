import React from 'react';

interface AnalyticsCardProps {
    title: string;
    value: string;
    isText?: boolean;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, value, isText = false }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between h-full">
            <h3 className="text-sm font-semibold text-slate-500">{title}</h3>
            <p className={`font-bold text-sky-600 text-right ${isText ? 'text-lg' : 'text-3xl'}`}>
                {value}
            </p>
        </div>
    );
};
