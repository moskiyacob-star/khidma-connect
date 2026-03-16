
import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { RequestHelpModal } from '../components/RequestHelpModal';

export const LoginView: React.FC = () => {
    const { login } = useAppContext();
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                 <div className="flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-sky-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    <h1 className="ml-3 text-3xl font-bold text-slate-800">Khidma Connect</h1>
                    <a href="https://justmuslim.org" target="_blank" rel="noopener noreferrer" className="ml-4 flex items-center text-sm text-sky-600 hover:text-sky-800 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        Support justmuslim
                    </a>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-semibold text-center text-slate-700 mb-2">Welcome Back!</h2>
                    <p className="text-center text-slate-500 mb-8">Sign in to connect with community service events.</p>
                    
                    <button
                        onClick={() => login()}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition duration-300 ease-in-out shadow-sm mb-4"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                        Sign in with Google
                    </button>

                    <div className="relative flex py-5 items-center">
                        <div className="flex-grow border-t border-slate-300"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">or</span>
                        <div className="flex-grow border-t border-slate-300"></div>
                    </div>

                    <button
                        onClick={() => setIsHelpModalOpen(true)}
                        className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-300 ease-in-out shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Request Help
                    </button>
                </div>
                <p className="text-center text-slate-400 text-xs mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
            <RequestHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
        </div>
    );
};

