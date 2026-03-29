'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import { useState } from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

const SIZE_MAP = {
  sm: { container: 'w-8 h-8', pixels: 32 },
  md: { container: 'w-10 h-10', pixels: 40 },
  lg: { container: 'w-12 h-12', pixels: 48 },
  xl: { container: 'w-16 h-16', pixels: 64 },
};

const ICON_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export default function Avatar({ src, alt = '', size = 'md', className = '', priority = false }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const sizeInfo = SIZE_MAP[size];

  // 如果有圖片且未發生錯誤
  if (src && !hasError) {
    return (
      <div className={`relative ${sizeInfo.container} flex-shrink-0 ${className}`}>
        <Image
          src={src}
          alt={alt}
          width={sizeInfo.pixels}
          height={sizeInfo.pixels}
          className="rounded-full object-cover w-full h-full"
          priority={priority}
          loading={priority ? undefined : "lazy"}
          onError={() => setHasError(true)}
          unoptimized={src.startsWith('data:')} // data URL 不需要優化
        />
      </div>
    );
  }

  // 無圖片或載入失敗時顯示預設圖示
  return (
    <div
      className={`
        ${sizeInfo.container}
        rounded-full bg-gray-200 dark:bg-gray-700
        flex items-center justify-center flex-shrink-0
        ${className}
      `}
    >
      <User className={`${ICON_SIZES[size]} text-gray-500 dark:text-gray-400`} />
    </div>
  );
}
