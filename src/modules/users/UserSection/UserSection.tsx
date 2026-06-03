import { useState } from 'react';
import GlobalHealthMetrics from './GlobalHealthMetrics';
import UserDirectoryGrid from './UserDirectoryGrid';
import UserHistorySlideOut from './UserHistorySlideOut';

const UserSection = () => {
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [refreshSignal, setRefreshSignal] = useState(0);

    return (
        <div className="space-y-8 relative">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">User Management Dashboard</h1>
                <p className="text-gray-500 text-sm">Global health metrics and interactive user directory</p>
            </header>

            {/* Zone 1 */}
            <GlobalHealthMetrics />

            {/* Zone 2 */}
            <UserDirectoryGrid onOpenHistory={(user) => setSelectedUser(user)} refreshSignal={refreshSignal} />

            {/* Zone 3: Slide-out panel */}
            {selectedUser && (
                <UserHistorySlideOut
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onChanged={() => setRefreshSignal((n) => n + 1)}
                />
            )}
        </div>
    );
};

export default UserSection;
