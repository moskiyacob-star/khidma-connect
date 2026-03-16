
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { User } from '../types';

export const Header: React.FC = () => {
    const { currentUser, logout } = useAppContext();

    if (!currentUser) return null;

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-600" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-xl font-bold text-slate-800">Khidma Connect</span>
                        <a href="https://justmuslim.org" target="_blank" rel="noopener noreferrer" className="ml-4 flex items-center text-sm text-sky-600 hover:text-sky-800 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            Support justmuslim
                        </a>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-700">{currentUser.name}</p>
                            <p className="text-xs text-slate-500">{currentUser.role}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition duration-150 ease-in-out"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
