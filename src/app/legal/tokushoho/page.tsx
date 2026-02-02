
import { Metadata } from 'next';
import TokushohoContent from './TokushohoContent';

export const metadata: Metadata = {
    alternates: {
        canonical: '/legal/tokushoho',
    },
};

export default function Page() {
    return <TokushohoContent />;
}
