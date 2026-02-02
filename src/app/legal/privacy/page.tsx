
import { Metadata } from 'next';
import PrivacyContent from './PrivacyContent';

export const metadata: Metadata = {
    alternates: {
        canonical: '/legal/privacy',
    },
};

export default function Page() {
    return <PrivacyContent />;
}
