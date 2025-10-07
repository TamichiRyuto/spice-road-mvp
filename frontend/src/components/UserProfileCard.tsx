import React from 'react';
import { PublicUser } from '../types';
import SpiceChart from './SpiceChart';
import './css/UserProfileCard.css';

interface UserProfileCardProps {
  user: PublicUser;
  onClick?: () => void;
  isSelected?: boolean;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  onClick,
  isSelected = false
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      onClick={onClick}
      className={`user-profile-card ${onClick ? 'clickable' : ''} ${isSelected ? 'selected' : ''}`}
    >
      <div className="user-profile-content">
        <div className="user-profile-info">
          <div className="user-avatar">
            {user.displayName.charAt(0)}
          </div>

          <h3 className="user-display-name">
            {user.displayName}
          </h3>

          <div className="user-join-date">
            参加日: {formatDate(user.createdAt)}
          </div>

          {user.bio && (
            <p className="user-bio">
              {user.bio}
            </p>
          )}

          <div className="user-stats">
            <span>
              お気に入り: {user.preferences.favoriteShops.length}店
            </span>
            {user.preferences.dislikes.length > 0 && (
              <span>
                苦手: {user.preferences.dislikes.length}店
              </span>
            )}
          </div>
        </div>

        <div className="user-spice-chart">
          <div className="user-spice-chart-title">
            スパイス好み
          </div>
          <SpiceChart
            spiceParameters={user.preferences.spiceParameters}
            shopName={user.displayName}
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;