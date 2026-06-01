import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveStackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'row' | 'col';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

const gapClasses = {
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

export const ResponsiveStack = React.forwardRef<HTMLDivElement, ResponsiveStackProps>(
  (
    {
      children,
      direction = 'col',
      gap = 'md',
      responsive = false,
      align = 'start',
      justify = 'start',
      className,
      ...props
    },
    ref,
  ) => {
    const directionClass =
      direction === 'row'
        ? responsive
          ? 'flex-col sm:flex-row'
          : 'flex-row'
        : 'flex-col';

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          directionClass,
          gapClasses[gap],
          alignClasses[align],
          justifyClasses[justify],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ResponsiveStack.displayName = 'ResponsiveStack';
