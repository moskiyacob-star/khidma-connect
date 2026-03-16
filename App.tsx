import * as React from 'react';
import { AppProvider } from './contexts/AppContext';
import { useAppContext } from './hooks/useAppContext';
import { LoginView } from './views/LoginView';
import { AdminDashboard } from './views/AdminDashboard';
import { EventCreatorDashboard } from './views/EventCreatorDashboard';
import { VolunteerDashboard } from './views/VolunteerDashboard';
import { UserRole, AccountStatus } from './types';
import { Header } from './components/Header';
import { Spinner } from './components/Spinner';

const SuspendedView: React.FC = () => {
    const { currentUser, appealSuspension, logout } = useAppContext();
    const [appealMsg, setAppealMsg] = React.useState('');
    const [submitted, setSubmitted] = React.useState(false);

    const handleAppeal = () => {
        if (appealMsg.trim()) {
            appealSuspension(appealMsg);
            setSubmitted(true);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                <h2 className="text-2xl font-bold text-rose-600 mb-4">Account Suspended</h2>
                <p className="text-slate-600 mb-6">
                    Your account has been suspended due to multiple reports. If you believe this is a mistake, you can submit an appeal to the administrators.
                </p>
                {currentUser?.appealMessage || submitted ? (
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-md mb-6">
                        Your appeal has been submitted and is pending review.
                    </div>
                ) : (
                    <div className="mb-6">
                        <textarea
                            value={appealMsg}
                            onChange={(e) => setAppealMsg(e.target.value)}
                            placeholder="Explain why your account should be reinstated..."
                            className="w-full border border-slate-300 rounded-md p-3 text-sm mb-3"
                            rows={4}
                        />
                        <button 
                            onClick={handleAppeal}
                            disabled={!appealMsg.trim()}
                            className="w-full bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-300"
                        >
                            Submit Appeal
                        </button>
                    </div>
                )}
                <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-700 underline">
                    Log out
                </button>
            </div>
        </div>
    );
};

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
    public state: any;
    public props: any;

    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if ((this.state as any).hasError) {
            let errorMessage = "Something went wrong.";
            try {
                const parsedError = JSON.parse((this.state as any).error?.message || "");
                if (parsedError.error) {
                    errorMessage = `Firestore Error: ${parsedError.error} at ${parsedError.path}`;
                }
            } catch (e) {
                // Not a JSON error
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Application Error</h2>
                        <p className="text-slate-600 mb-6">{errorMessage}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700 transition"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return (this.props as any).children;
    }
}




const AppContent: React.FC = () => {
    const { currentUser, isAuthReady } = useAppContext();

    if (!isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!currentUser) {
        return <LoginView />;
    }

    if (currentUser.accountStatus === AccountStatus.SUSPENDED) {
        return <SuspendedView />;
    }

    const renderDashboard = () => {
        switch (currentUser.role) {
            case UserRole.ADMIN:
                return <AdminDashboard />;
            case UserRole.EVENT_CREATOR:
                return <EventCreatorDashboard />;
            case UserRole.VOLUNTEER:
                return <VolunteerDashboard />;
            default:
                return <div>Unknown role</div>;
        }
    };
    
    return (
        <div className="min-h-screen bg-slate-100">
           <Header />
           <main>
             {renderDashboard()}
           </main>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AppProvider>
                <AppContent />
            </AppProvider>
        </ErrorBoundary>
    );
};

export default App;

