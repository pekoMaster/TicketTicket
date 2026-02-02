
import { Metadata } from 'next';
import HomePageContent from './_components/HomePageContent';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default function Page() {
  return <HomePageContent />;
}
