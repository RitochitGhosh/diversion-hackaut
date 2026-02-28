import type { Metadata } from 'next';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReviewIQ — Human-AI Collaboration Platform',
  description:
    'Multi-tenant SaaS platform where AI drafts answers and human experts review before final delivery. The future of intelligent, accurate responses.',
  keywords: ['HITL', 'AI review', 'human-in-the-loop', 'multi-tenant SaaS', 'AI collaboration'],
  openGraph: {
    title: 'ReviewIQ — Human-AI Collaboration',
    description: 'AI power. Human expertise. Perfect answers.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
