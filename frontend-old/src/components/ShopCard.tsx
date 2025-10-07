import { CurryShop } from '../types';
import SpiceChart from './SpiceChart';

interface ShopCardProps {
  shop: CurryShop;
  onClick: () => void;
  isSelected: boolean;
}

const ShopCard = ({ shop, onClick, isSelected }: ShopCardProps) => {
  return (
    <button 
      style={{
        border: isSelected ? '3px solid #d2691e' : '2px solid rgba(184, 128, 87, 0.4)',
        borderRadius: '20px',
        padding: '28px',
        margin: '20px 0',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'rgba(210, 105, 30, 0.25)' : 'rgba(255, 248, 237, 0.9)',
        backdropFilter: 'blur(15px)',
        boxShadow: isSelected ? '0 25px 35px -5px rgba(210, 105, 30, 0.4), 0 15px 15px -5px rgba(210, 105, 30, 0.3), inset 0 0 0 2px rgba(210, 105, 30, 0.5)' : '0 15px 25px -3px rgba(45, 24, 16, 0.15), 0 6px 10px -2px rgba(45, 24, 16, 0.1)',
        transition: 'all 0.3s ease-in-out',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        width: '100%',
        textAlign: 'left',
        fontFamily: 'inherit'
      }}
      onClick={onClick}
      tabIndex={0}
      aria-pressed={isSelected}
      aria-describedby={`shop-${shop.id}-details`}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: 'clamp(16px, 4vw, 24px)',
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 
            style={{ 
              margin: '0 0 12px 0', 
              color: '#8b4513', 
              fontSize: 'clamp(18px, 4vw, 22px)', 
              fontWeight: '900',
              lineHeight: '1.2',
              letterSpacing: '-0.5px',
              textShadow: '1px 1px 2px rgba(139, 69, 19, 0.2)',
              wordBreak: 'break-word'
            }}
          >
            {shop.name}
          </h3>
          <p 
            style={{ 
              margin: '0 0 12px 0', 
              color: '#5a3429', 
              fontSize: 'clamp(14px, 3vw, 16px)',
              lineHeight: '1.5',
              fontWeight: '500',
              wordBreak: 'break-word'
            }}
          >
            {shop.address}
          </p>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '12px' 
            }}
            aria-label={`評価 ${shop.rating}`}
          >
            <div 
              style={{ 
                width: '18px', 
                height: '18px', 
                backgroundColor: '#d2691e',
                border: '1px solid rgba(210, 105, 30, 0.6)',
                borderRadius: '8px',
                boxShadow: '0 3px 6px rgba(210, 105, 30, 0.4)',
                background: 'linear-gradient(135deg, #d2691e, #cd853f)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#ffffff',
                fontWeight: '700'
              }}
              aria-hidden="true"
            >
              ★
            </div>
            <span 
              style={{ 
                fontWeight: '900', 
                color: '#2d1810',
                fontSize: '18px',
                textShadow: '1px 1px 2px rgba(45, 24, 16, 0.3)'
              }}
            >
              {shop.rating}
            </span>
          </div>
          {shop.description && (
            <p 
              id={`shop-${shop.id}-details`}
              style={{ 
                margin: '0', 
                color: '#5a3429', 
                fontSize: 'clamp(14px, 3vw, 16px)', 
                lineHeight: '1.6',
                fontWeight: '500',
                wordBreak: 'break-word'
              }}
            >
              {shop.description}
            </p>
          )}
        </div>
        <div 
          style={{ 
            flexShrink: 0, 
            width: window.innerWidth <= 768 ? '100%' : 'clamp(200px, 30vw, 240px)',
            maxWidth: window.innerWidth <= 768 ? '300px' : 'none',
            margin: window.innerWidth <= 768 ? '0 auto' : '0'
          }}
          aria-label="スパイスパラメーターチャート"
        >
          <SpiceChart
            spiceParameters={shop.spiceParameters} 
            shopName={shop.name} 
          />
        </div>
      </div>
    </button>
  );
};

export default ShopCard;