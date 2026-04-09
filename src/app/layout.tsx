import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import './globals.css';

export const metadata: Metadata = {
  title: 'Manual J HVAC Load Calculator',
  description:
    'Residential heating and cooling load calculator following ASHRAE / Manual J methods.',
};

// Inline script to set the .dark class BEFORE hydration, avoiding FOUC.
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <header
          className="border-b print-hide"
          style={{
            background: 'var(--header-bg)',
            borderColor: 'var(--header-border)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-semibold text-brand-700 dark:text-brand-500"
            >
              Manual J Load Calculator
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/calculate"
                className="text-slate-700 hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-400"
              >
                Calculate
              </Link>
              <Link
                href="/scenarios"
                className="text-slate-700 hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-400"
              >
                Scenarios
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
