
import React, { useState } from 'react';
import { User, VolunteerStatus } from '../types';
import { Badge } from '../components/Badge';
import { BadgeProgress } from '../components/BadgeProgress';
import { useAppContext } from '../hooks/useAppContext';

interface ProfileViewProps {
  user: User;
}

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg className={`w-5 h-5 ${filled ? 'text-amber-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const AddSkillForm: React.FC = () => {
    const { addSkill } = useAppContext();
    const [skillName, setSkillName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addSkill(skillName);
        setSkillName('');
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
            <input 
                type="text" 
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g., First Aid"
                className="flex-grow p-2 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button type="submit" className="px-3 py-2 text-sm font-semibold bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors">Add</button>
        </form>
    );
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user }) => {
  const { currentUser, updateProfile } = useAppContext();
  const [isEditingPostcode, setIsEditingPostcode] = useState(false);
  const [tempPostcode, setTempPostcode] = useState(user.postcode || '');

  const handlePostcodeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ postcode: tempPostcode });
    setIsEditingPostcode(false);
  };

  const averageRating = user.ratings && user.ratings.length > 0
    ? user.ratings.reduce((acc, r) => acc + r.score, 0) / user.ratings.length
    : 0;

  return (
    <div className="bg-white p-6 rounded-b-lg">
      <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">{user.name}</h2>
      {user.volunteerStatus && (
        <div className={`text-center text-sm font-semibold mb-4 px-3 py-1 inline-block rounded-full mx-auto block w-max ${
          user.volunteerStatus === VolunteerStatus.VERIFIED ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {user.volunteerStatus}
        </div>
      )}
      
      <div className="flex justify-around text-center my-6 border-b border-t border-slate-200 py-4">
        <div>
          <p className="text-2xl font-bold text-sky-600">{user.points}</p>
          <p className="text-xs text-slate-500 uppercase font-semibold">Points</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-sky-600">{user.completedEvents ?? 0}</p>
          <p className="text-xs text-slate-500 uppercase font-semibold">Events Done</p>
        </div>
         {user.role === 'Volunteer' && (
          <div>
            <p className="text-2xl font-bold text-sky-600 flex items-center justify-center">
              {averageRating.toFixed(1)}
              <svg className="w-4 h-4 text-amber-400 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            </p>
            <p className="text-xs text-slate-500 uppercase font-semibold">Avg Rating</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Location</h3>
        {isEditingPostcode ? (
          <form onSubmit={handlePostcodeUpdate} className="flex gap-2">
            <input 
              type="text" 
              value={tempPostcode}
              onChange={(e) => setTempPostcode(e.target.value)}
              placeholder="Postcode"
              className="flex-grow p-2 text-sm border border-slate-300 rounded-md"
            />
            <button type="submit" className="px-3 py-1 bg-sky-600 text-white text-xs rounded-md">Save</button>
            <button type="button" onClick={() => setIsEditingPostcode(false)} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded-md">Cancel</button>
          </form>
        ) : (
          <div className="flex justify-between items-center">
            <p className="text-slate-700">{user.postcode || 'No postcode set'}</p>
            {currentUser?.id === user.id && (
              <button onClick={() => setIsEditingPostcode(true)} className="text-xs text-sky-600 hover:underline">Edit</button>
            )}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">My Skills</h3>
        {user.skills && user.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.skills.map(skill => (
              <div key={skill.name} className="flex items-center bg-sky-100 text-sky-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                {skill.name}
                {skill.endorsements > 0 && (
                  <span className="ml-1.5 flex items-center bg-sky-200 text-sky-900 rounded-full px-1.5 text-xs">
                    <StarIcon filled={true} />
                    <span className="ml-0.5">{skill.endorsements}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No skills added yet.</p>
        )}
        {currentUser && currentUser.id === user.id && <AddSkillForm />}
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">My Badges</h3>
        <BadgeProgress userPoints={user.points} userBadges={user.badges} />
        {user.badges.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4">
            {user.badges.map(badge => <Badge key={badge.id} badge={badge} />)}
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-50 rounded-md mt-4">
            <p className="text-sm text-slate-500">Complete events to earn badges!</p>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Points History</h3>
        {user.pointsHistory && user.pointsHistory.length > 0 ? (
          <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
            {user.pointsHistory.map((entry, index) => (
              <div key={index} className="bg-slate-50 p-3 rounded-lg hover:bg-slate-100 transition-colors duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{entry.eventName}</p>
                    <p className="text-xs text-slate-500 mt-1">{entry.reason}</p>
                  </div>
                  <p className="font-bold text-emerald-600 text-sm whitespace-nowrap ml-2">+{entry.points} pts</p>
                </div>
                <p className="text-xs text-slate-400 text-right mt-1">{new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-50 rounded-md">
            <p className="text-sm text-slate-500">No points history yet. Complete events to earn points!</p>
          </div>
        )}
      </div>

    </div>
  );
};