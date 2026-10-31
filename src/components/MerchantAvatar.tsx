import React, { useState } from 'react';
import { getMerchantFavicon } from '../lib/engines';

interface MerchantAvatarProps {
  merchant: string;
  className?: string;
  size?: number;
}

export const MerchantAvatar: React.FC<MerchantAvatarProps> = ({
  merchant,
  className = '',
  size = 40,
}) => {
  const [imageError, setImageError] = useState(false);
  const { url, initial } = getMerchantFavicon(merchant);

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
  };

  if (url && !imageError) {
    return (
      <div
        style={containerStyle}
        className={`rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center p-1.5 border border-white/10 ${className}`}
      >
        <img
          src={url}
          alt={merchant}
          onError={() => setImageError(true)}
          className="w-full h-full object-contain rounded-xl"
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback to lime-tinted letter avatar
  return (
    <div
      style={containerStyle}
      className={`rounded-2xl bg-[#C8F03C]/15 border border-[#C8F03C]/20 flex items-center justify-center text-[#C8F03C] font-semibold text-sm ${className}`}
    >
      {initial}
    </div>
  );
};
