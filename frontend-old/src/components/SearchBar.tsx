import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "お店を検索...",
  initialValue = ""
}) => {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 248, 237, 0.9)',
        border: '2px solid rgba(184, 128, 87, 0.4)',
        borderRadius: '16px',
        padding: '4px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(45, 24, 16, 0.1)'
      }}>
        <div style={{
          flex: 1,
          position: 'relative'
        }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '16px 48px 16px 20px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              backgroundColor: 'transparent',
              color: '#2d1810',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          
          {/* Search Icon */}
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#8b4513',
            pointerEvents: 'none'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
          
          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: '44px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                border: 'none',
                borderRadius: '50%',
                backgroundColor: 'rgba(184, 128, 87, 0.3)',
                color: '#8b4513',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(184, 128, 87, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(184, 128, 87, 0.3)';
              }}
              title="検索をクリア"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Search Button */}
        <button
          type="submit"
          style={{
            padding: '12px 20px',
            border: 'none',
            borderRadius: '12px',
            backgroundColor: '#d2691e',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            boxShadow: '0 2px 6px rgba(210, 105, 30, 0.3)',
            marginLeft: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#b8611e';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#d2691e';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          検索
        </button>
      </div>
      
      {/* Search Tips */}
      <div style={{
        fontSize: '12px',
        color: '#8b4513',
        marginTop: '8px',
        textAlign: 'center',
        opacity: 0.8
      }}>
        店名、住所、料理の特徴などで検索できます
      </div>
    </form>
  );
};

export default SearchBar;