import { memo, useState } from 'react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm', 
  md: 'h-12 w-12 text-lg',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-2xl'
};

export const Avatar = memo(function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  className = '' 
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = sizeClasses[size];
  
  // Get first letter from alt text (usually displayName or username)
  const getInitial = () => {
    if (!alt) return 'U';
    return alt.charAt(0).toUpperCase();
  };

  // If we have a src and no error, try to show the image
  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        onError={() => {
          setImageError(true);
        }}
      />
    );
  }

  // Show fallback initials if no src or image failed to load
  return (
    <div className={`${sizeClass} rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 ${className}`}>
      <span className={`font-semibold text-gray-600 ${size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : size === 'xl' ? 'text-2xl' : 'text-lg'}`}>
        {getInitial()}
      </span>
    </div>
  );
});