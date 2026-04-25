import type { Metadata } from 'next';
import { getRequestMetadata } from '@/lib/db-queries';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const req = await getRequestMetadata(id);

  if (!req) {
    return {
      title: 'TicketTicket',
      description: 'TicketTicket 票券同行配對平台',
    };
  }

  const title = `求票：${req.event_name} - TicketTicket`;
  const desc = req.description?.slice(0, 150) ||
    `${req.event_name} 求票同行 — TicketTicket 票券同行配對平台`;

  return {
    title,
    description: desc,
    alternates: { canonical: `/request/${id}` },
    openGraph: {
      title,
      description: desc,
      url: `/request/${id}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description: desc,
    },
    robots: req.status === 'open' ? undefined : { index: false },
  };
}

export default function RequestDetailLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
