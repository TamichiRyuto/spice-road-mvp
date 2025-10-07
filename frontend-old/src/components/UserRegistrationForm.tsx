import React, { useState } from 'react';
import { UserRegistration, SpiceParameters } from '../types';

interface UserRegistrationFormProps {
  onRegister: (userData: UserRegistration) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const UserRegistrationForm: React.FC<UserRegistrationFormProps> = ({
  onRegister,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
    bio: ''
  });
  
  const [spicePreferences, setSpicePreferences] = useState<SpiceParameters>({
    spiciness: 50,
    stimulation: 50,
    aroma: 50
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'ユーザー名は必須です';
    } else if (formData.username.length < 3) {
      newErrors.username = 'ユーザー名は3文字以上で入力してください';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = '表示名は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const userData: UserRegistration = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      displayName: formData.displayName.trim(),
      bio: formData.bio.trim(),
      preferences: {
        spiceParameters: spicePreferences,
        favoriteShops: [],
        dislikes: []
      }
    };

    onRegister(userData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSpiceChange = (param: keyof SpiceParameters, value: number) => {
    setSpicePreferences(prev => ({ ...prev, [param]: value }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 248, 237, 0.98)',
        borderRadius: window.innerWidth <= 768 ? '16px' : '20px',
        padding: window.innerWidth <= 768 ? 'clamp(20px, 5vw, 24px)' : '32px',
        width: window.innerWidth <= 768 ? '95%' : '90%',
        maxWidth: window.innerWidth <= 768 ? '400px' : '500px',
        maxHeight: window.innerWidth <= 768 ? '90vh' : '80vh',
        overflowY: 'auto',
        border: '2px solid rgba(184, 128, 87, 0.4)',
        boxShadow: '0 25px 50px -12px rgba(45, 24, 16, 0.3)',
        backdropFilter: 'blur(15px)'
      }}>
        <h2 style={{
          color: '#8b4513',
          fontSize: 'clamp(22px, 5vw, 28px)',
          fontWeight: '900',
          marginBottom: 'clamp(16px, 4vw, 24px)',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(45, 24, 16, 0.2)'
        }}>
          新規ユーザー登録
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#8b4513',
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: '700',
              marginBottom: '8px'
            }}>
              ユーザー名 *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              style={{
                width: '100%',
                padding: 'clamp(10px, 2vw, 12px) clamp(12px, 3vw, 16px)',
                border: errors.username ? '2px solid #dc2626' : '2px solid rgba(184, 128, 87, 0.4)',
                borderRadius: 'clamp(8px, 2vw, 12px)',
                fontSize: 'clamp(14px, 3vw, 16px)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                boxSizing: 'border-box'
              }}
              disabled={isLoading}
            />
            {errors.username && (
              <span style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.username}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#8b4513',
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: '700',
              marginBottom: '8px'
            }}>
              メールアドレス *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: 'clamp(10px, 2vw, 12px) clamp(12px, 3vw, 16px)',
                border: errors.email ? '2px solid #dc2626' : '2px solid rgba(184, 128, 87, 0.4)',
                borderRadius: 'clamp(8px, 2vw, 12px)',
                fontSize: 'clamp(14px, 3vw, 16px)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                boxSizing: 'border-box'
              }}
              disabled={isLoading}
            />
            {errors.email && (
              <span style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.email}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#8b4513',
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: '700',
              marginBottom: '8px'
            }}>
              表示名 *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              style={{
                width: '100%',
                padding: 'clamp(10px, 2vw, 12px) clamp(12px, 3vw, 16px)',
                border: errors.displayName ? '2px solid #dc2626' : '2px solid rgba(184, 128, 87, 0.4)',
                borderRadius: 'clamp(8px, 2vw, 12px)',
                fontSize: 'clamp(14px, 3vw, 16px)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                boxSizing: 'border-box'
              }}
              disabled={isLoading}
            />
            {errors.displayName && (
              <span style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                {errors.displayName}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#8b4513',
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: '700',
              marginBottom: '8px'
            }}>
              自己紹介
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: 'clamp(10px, 2vw, 12px) clamp(12px, 3vw, 16px)',
                border: '2px solid rgba(184, 128, 87, 0.4)',
                borderRadius: 'clamp(8px, 2vw, 12px)',
                fontSize: 'clamp(14px, 3vw, 16px)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
              disabled={isLoading}
              placeholder="あなたのカレーに対する想いを教えてください..."
            />
          </div>

          {/* Spice Preferences */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              color: '#8b4513',
              fontSize: '20px',
              fontWeight: '800',
              marginBottom: '16px',
              borderBottom: '2px solid rgba(210, 105, 30, 0.3)',
              paddingBottom: '8px'
            }}>
              スパイス好みアンケート
            </h3>
            <p style={{
              color: '#5a3429',
              fontSize: '14px',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              あなたの好みに合うお店をおすすめするため、スパイスの好みを教えてください。
            </p>

            {([
              { key: 'spiciness' as const, label: '辛さ', desc: 'どの程度の辛さが好みですか？' },
              { key: 'stimulation' as const, label: '刺激', desc: '香辛料の刺激をどの程度求めますか？' },
              { key: 'aroma' as const, label: '香り', desc: 'スパイスの香りをどの程度重視しますか？' }
            ]).map(({ key, label, desc }) => (
              <div key={key} style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <label style={{
                    color: '#8b4513',
                    fontSize: '16px',
                    fontWeight: '700'
                  }}>
                    {label}
                  </label>
                  <span style={{
                    color: '#d2691e',
                    fontSize: '18px',
                    fontWeight: '800',
                    minWidth: '40px',
                    textAlign: 'center',
                    backgroundColor: 'rgba(210, 105, 30, 0.1)',
                    padding: '4px 12px',
                    borderRadius: '8px'
                  }}>
                    {spicePreferences[key]}
                  </span>
                </div>
                <p style={{
                  color: '#5a3429',
                  fontSize: '12px',
                  marginBottom: '8px'
                }}>
                  {desc}
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={spicePreferences[key]}
                  onChange={(e) => handleSpiceChange(key, parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: '8px',
                    background: `linear-gradient(to right, #d2691e 0%, #d2691e ${spicePreferences[key]}%, #e5e5e5 ${spicePreferences[key]}%, #e5e5e5 100%)`,
                    borderRadius: '4px',
                    outline: 'none',
                    opacity: isLoading ? 0.5 : 1
                  }}
                  disabled={isLoading}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#8b4513',
                  marginTop: '4px'
                }}>
                  <span>控えめ (0)</span>
                  <span>普通 (50)</span>
                  <span>強め (100)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: 'clamp(12px, 3vw, 16px)',
            justifyContent: window.innerWidth <= 480 ? 'center' : 'flex-end',
            flexDirection: window.innerWidth <= 480 ? 'column' : 'row'
          }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              style={{
                padding: 'clamp(10px, 2vw, 12px) clamp(16px, 4vw, 24px)',
                border: '2px solid rgba(184, 128, 87, 0.6)',
                borderRadius: 'clamp(8px, 2vw, 12px)',
                backgroundColor: 'transparent',
                color: '#8b4513',
                fontSize: 'clamp(14px, 3vw, 16px)',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease-in-out',
                opacity: isLoading ? 0.5 : 1,
                width: window.innerWidth <= 480 ? '100%' : 'auto'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'rgba(184, 128, 87, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: 'clamp(10px, 2vw, 12px) clamp(16px, 4vw, 24px)',
                border: 'none',
                borderRadius: 'clamp(8px, 2vw, 12px)',
                backgroundColor: isLoading ? '#a0a0a0' : '#d2691e',
                color: '#ffffff',
                fontSize: 'clamp(14px, 3vw, 16px)',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease-in-out',
                boxShadow: isLoading ? 'none' : '0 4px 8px rgba(210, 105, 30, 0.3)',
                width: window.innerWidth <= 480 ? '100%' : 'auto'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#b8611e';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#d2691e';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {isLoading ? '登録中...' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserRegistrationForm;