import React from 'react';
import { PublicUser } from '../types';
import SpiceChart from './SpiceChart';

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
      style={{
        border: isSelected ? '3px solid #d2691e' : '2px solid rgba(184, 128, 87, 0.4)',
        borderRadius: '20px',
        padding: '24px',
        margin: '16px 0',
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: isSelected ? 'rgba(210, 105, 30, 0.15)' : 'rgba(255, 248, 237, 0.9)',
        backdropFilter: 'blur(15px)',
        boxShadow: isSelected 
          ? '0 20px 30px -5px rgba(210, 105, 30, 0.3), 0 10px 10px -5px rgba(210, 105, 30, 0.2)' 
          : '0 10px 20px -3px rgba(45, 24, 16, 0.1), 0 4px 6px -2px rgba(45, 24, 16, 0.05)',
        transition: 'all 0.3s ease-in-out',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        fontFamily: 'inherit'
      }}
      onMouseEnter={(e) => {
        if (onClick && !isSelected) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 248, 237, 0.95)';
          e.currentTarget.style.transform = 'scale(1.01)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick && !isSelected) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 248, 237, 0.9)';
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      <div style={{ 
        display: 'flex', 
        gap: 'clamp(16px, 4vw, 24px)', 
        alignItems: 'flex-start',
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
      }}>
        {/* Profile Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* User Icon */}
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'linear-gradient(135deg, #d2691e, #cd853f)',
            background: 'linear-gradient(135deg, #d2691e, #cd853f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: '#ffffff',
            fontWeight: '900',
            marginBottom: '16px',
            boxShadow: '0 4px 8px rgba(210, 105, 30, 0.3)'
          }}>
            {user.displayName.charAt(0)}
          </div>

          {/* Display Name */}
          <h3 style={{
            margin: '0 0 8px 0',
            color: '#8b4513',
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: '900',
            lineHeight: '1.2',
            letterSpacing: '-0.5px',
            textShadow: '1px 1px 2px rgba(139, 69, 19, 0.2)',
            wordBreak: 'break-word'
          }}>
            {user.displayName}
          </h3>

          {/* Member Since */}
          <div style={{
            color: '#8b4513',
            fontSize: '12px',
            fontWeight: '600',
            opacity: 0.8,
            marginBottom: '12px'
          }}>
            参加日: {formatDate(user.createdAt)}
          </div>

          {/* Bio */}
          {user.bio && (
            <p style={{
              margin: '0 0 16px 0',
              color: '#5a3429',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              lineHeight: '1.5',
              fontWeight: '500',
              wordBreak: 'break-word'
            }}>
              {user.bio}
            </p>
          )}

          {/* Favorite Shops Count */}
          <div style={{
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
            color: '#8b4513',
            fontWeight: '700'
          }}>
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

        {/* Spice Chart */}
        <div style={{
          flexShrink: 0,
          width: window.innerWidth <= 768 ? '100%' : 'clamp(180px, 25vw, 200px)',
          maxWidth: window.innerWidth <= 768 ? '250px' : 'none',
          margin: window.innerWidth <= 768 ? '0 auto' : '0'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '800',
            color: '#8b4513',
            textAlign: 'center',
            marginBottom: '8px'
          }}>
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