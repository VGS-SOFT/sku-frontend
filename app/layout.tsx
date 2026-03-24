import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'SKU Generator | VGS IT SOLUTION',
  description: 'Internal SKU catalog management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="ml-60 flex-1 min-h-screen">
            <div className="max-w-6xl mx-auto px-8 py-8">
              {children}
            </div>
          </main>
        </div>
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              border: '1px solid hsl(var(--border))',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  );
}
