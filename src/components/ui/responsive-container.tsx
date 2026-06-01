import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  noPadding?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
};

export const ResponsiveContainer = React.forwardRef<
  HTMLDivElement,
  ResponsiveContainerProps
>(
  (
    { children, maxWidth = 'full', noPadding = false, className, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          !noPadding && 'px-4 sm:px-6 md:px-8',
          maxWidthClasses[maxWidth],
          'mx-auto',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ResponsiveContainer.displayName = 'ResponsiveContainer';
