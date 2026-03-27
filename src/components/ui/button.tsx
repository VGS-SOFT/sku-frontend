import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:     'bg-black text-white hover:bg-gray-800 rounded-full',
        outline:     'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 rounded-full',
        ghost:       'text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg',
        destructive: 'bg-red-500 text-white hover:bg-red-600 rounded-full',
        link:        'text-gray-900 underline-offset-4 hover:underline',
        secondary:   'bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-full',
      },
      size: {
        default: 'h-9 px-5 py-2',
        sm:      'h-8 px-4 text-xs',
        lg:      'h-11 px-8 text-base',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export function Button({ className, variant, size, isLoading, children, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
