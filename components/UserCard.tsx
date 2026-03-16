
import React from 'react';
import { User, AccountStatus } from '../types';

interface UserCardProps {
  user: User;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onApprove, onReject }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-800">{user.name}</p>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold">
            {user.role}
          </span>
        </div>
        <p className="text-sm text-slate-500">{user.email}</p>
        {user.phoneNumber && (
          <p className="text-sm text-sky-600 font-medium mt-0.5">Phone: {user.phoneNumber}</p>
        )}
        <p className="text-xs text-slate-400 mt-1">Postcode: {user.postcode || 'N/A'}</p>
      </div>
      {(user.accountStatus === AccountStatus.PENDING || user.requestedEventCreator) && (
        <div className="flex space-x-2">
          <button
            onClick={() => onApprove(user.id)}
            className="px-3 py-1 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(user.id)}
            className="px-3 py-1 text-sm font-medium text-white bg-rose-500 rounded-md hover:bg-rose-600 transition-colors"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
};
