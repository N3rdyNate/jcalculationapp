import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Manual J HVAC Load Calculator',
  description:
    'Residential heating and cooling load calculator following ASHRAE / Manual J methods.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-brand-700">
              Manual J Load Calculator
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/calculate"
                className="text-slate-700 hover:text-brand-600"
              >
                Calculate
              </Link>
              <Link
                href="/scenarios"
                className="text-slate-700 hover:text-brand-600"
              >
                Scenarios
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
