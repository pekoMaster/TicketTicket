import type { Metadata } from 'next';
import { getUserMetadata } from '@/lib/db-queries';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await getUserMetadata(userId);

  if (!user) {
    return {
      title: 'TicketTicket',
      description: 'TicketTicket 票券同行配對平台',
    };
  }

  const title = `${user.username} 的評價 - TicketTicket`;
  const desc = `查看 ${user.username} 在 TicketTicket 的評價（${user.review_count ?? 0} 則評價，${(user.rating ?? 0).toFixed(1)} 星）`;

  return {
    title,
    description: desc,
    alternates: { canonical: `/reviews/${userId}` },
    openGraph: {
      title,
      description: desc,
      url: `/reviews/${userId}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title,
      description: desc,
    },
  };
}

export default function ReviewsLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
