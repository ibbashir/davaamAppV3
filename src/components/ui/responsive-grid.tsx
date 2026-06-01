import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const gapClasses = {
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const getGridColsClass = (cols?: number, breakpoint?: string) => {
  if (!cols) return '';
  const prefix = breakpoint && breakpoint !== 'xs' ? `${breakpoint}:` : '';
  return `${prefix}grid-cols-${cols}`;
};

export const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  (
    {
      children,
      columns = { xs: 1, sm: 1, md: 2, lg: 3, xl: 4 },
      gap = 'md',
      className,
      ...props
    },
    ref,
  ) => {
    const gridClasses = cn(
      'grid',
      getGridColsClass(columns.xs, 'xs'),
      getGridColsClass(columns.sm, 'sm'),
      getGridColsClass(columns.md, 'md'),
      getGridColsClass(columns.lg, 'lg'),
      getGridColsClass(columns.xl, 'xl'),
      gapClasses[gap],
      className,
    );

    return (
      <div ref={ref} className={gridClasses} {...props}>
        {children}
      </div>
    );
  },
);

ResponsiveGrid.displayName = 'ResponsiveGrid';
