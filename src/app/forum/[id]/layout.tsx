import type { Metadata } from 'next';
import { getForumTopicMetadata } from '@/lib/db-queries';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const topic = await getForumTopicMetadata(id);

  if (!topic) {
    return {
      title: 'TicketTicket',
      description: 'TicketTicket 票券同行配對平台',
    };
  }

  const title = `${topic.title} - TicketTicket 論壇`;
  const desc = topic.content?.slice(0, 150) ||
    `${topic.title} — TicketTicket 票券同行配對平台論壇討論`;

  return {
    title,
    description: desc,
    alternates: { canonical: `/forum/${id}` },
    openGraph: {
      title,
      description: desc,
      url: `/forum/${id}`,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description: desc,
    },
  };
}

export default function ForumTopicLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
