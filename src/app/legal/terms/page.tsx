
import { Metadata } from 'next';
import TermsContent from './TermsContent';

export const metadata: Metadata = {
    alternates: {
        canonical: '/legal/terms',
    },
};

export default function Page() {
    return <TermsContent />;
}
