import type { Metadata } from 'next';
import { getListingMetadata } from '@/lib/db-queries';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingMetadata(id);

  if (!listing) {
    return {
      title: 'TicketTicket',
      description: 'TicketTicket 票券同行配對平台',
    };
  }

  const seat = listing.seat_grade ? `（${listing.seat_grade}）` : '';
  const title = `${listing.event_name}${seat} - TicketTicket`;
  const desc = listing.description?.slice(0, 150) ||
    `${listing.event_name} 同行配對 — TicketTicket 票券同行配對平台`;

  return {
    title,
    description: desc,
    alternates: { canonical: `/listing/${id}` },
    openGraph: {
      title,
      description: desc,
      url: `/listing/${id}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description: desc,
    },
    robots: listing.status === 'open' ? undefined : { index: false },
  };
}

export default function ListingDetailLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
