import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export const ResponsiveForm = React.forwardRef<HTMLFormElement, ResponsiveFormProps>(
  (
    {
      children,
      columns = { xs: 1, sm: 1, md: 2, lg: 2 },
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <form
        ref={ref}
        className={cn(
          'space-y-4 sm:space-y-6',
          className,
        )}
        {...props}
      >
        {children}
      </form>
    );
  },
);

ResponsiveForm.displayName = 'ResponsiveForm';

interface ResponsiveFormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: number;
}

export const ResponsiveFormGroup = React.forwardRef<HTMLDivElement, ResponsiveFormGroupProps>(
  (
    {
      children,
      columns = 1,
      className,
      ...props
    },
    ref,
  ) => {
    const gridCols = {
      1: 'grid-cols-1',
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-3',
      4: 'sm:grid-cols-4',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'grid gap-3 sm:gap-4',
          gridCols[columns as keyof typeof gridCols],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ResponsiveFormGroup.displayName = 'ResponsiveFormGroup';

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      error,
      required,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn('flex flex-col gap-1.5 sm:gap-2', className)} {...props}>
        {label && (
          <label className="text-xs sm:text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {children}
        {error && <p className="text-xs sm:text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

FormField.displayName = 'FormField';
