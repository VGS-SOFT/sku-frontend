import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-black text-white',
        secondary:   'bg-gray-100 text-gray-700',
        outline:     'border border-gray-200 text-gray-700',
        success:     'bg-green-50 text-green-700 border border-green-100',
        destructive: 'bg-red-50 text-red-700 border border-red-100',
        warning:     'bg-amber-50 text-amber-700 border border-amber-100',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
