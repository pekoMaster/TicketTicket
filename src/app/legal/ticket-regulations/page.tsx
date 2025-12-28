'use client';

import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import { Scale, AlertTriangle, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

export default function TicketRegulationsPage() {
    const t = useTranslations('ticketRegulations');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header title={t('title')} showBack />

            <div className="pt-20 pb-20 px-4 max-w-3xl mx-auto">
                <div className="space-y-6">
                    {/* Title */}
                    <Card>
                        <div className="flex items-center gap-3 mb-3">
                            <Scale className="w-8 h-8 text-indigo-500" />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{t('intro')}</p>
                    </Card>

                    {/* Japanese Law */}
                    <Card className="border-l-4 border-l-red-500">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                            🇯🇵 {t('japanLawTitle')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('japanLawName')}</p>

                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {t('japanLawProhibited')}
                            </h3>
                            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                                <li>{t('japanLawItem1')}</li>
                                <li>{t('japanLawItem2')}</li>
                            </ul>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {t('japanLawAllowed')}
                            </h3>
                            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
                                <li>{t('japanLawAllowedItem1')}</li>
                                <li>{t('japanLawAllowedItem2')}</li>
                            </ul>
                        </div>

                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            <p className="font-medium">{t('japanLawPenalty')}</p>
                            <a
                                href="https://elaws.e-gov.go.jp/document?lawid=430AC0000000103"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mt-2"
                            >
                                {t('viewFullText')} <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </Card>

                    {/* ZAIKO */}
                    <Card className="border-l-4 border-l-blue-500">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                            🎫 ZAIKO {t('platformRules')}
                        </h2>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('zaikoProhibited')}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('zaikoProhibitedDesc')}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('zaikoAllowed')}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('zaikoAllowedDesc')}</p>
                                </div>
                            </div>
                        </div>

                        <a
                            href="https://zaiko.io/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mt-3 text-sm"
                        >
                            ZAIKO {t('viewTerms')} <ExternalLink className="w-3 h-3" />
                        </a>
                    </Card>

                    {/* LAWSON */}
                    <Card className="border-l-4 border-l-green-500">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                            🏪 LAWSON Ticket (ローチケ) {t('platformRules')}
                        </h2>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('lawsonProhibited')}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('lawsonProhibitedDesc')}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('lawsonAllowed')}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('lawsonAllowedDesc')}</p>
                                </div>
                            </div>
                        </div>

                        <a
                            href="https://l-tike.com/guide/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mt-3 text-sm"
                        >
                            LAWSON Ticket {t('viewTerms')} <ExternalLink className="w-3 h-3" />
                        </a>
                    </Card>

                    {/* SPWN */}
                    <Card className="border-l-4 border-l-purple-500">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                            🎮 SPWN {t('platformRules')}
                        </h2>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('spwnProhibited')}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('spwnProhibitedDesc')}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{t('spwnAllowed')}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('spwnAllowedDesc')}</p>
                                </div>
                            </div>
                        </div>

                        <a
                            href="https://spwn.jp/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mt-3 text-sm"
                        >
                            SPWN {t('viewTerms')} <ExternalLink className="w-3 h-3" />
                        </a>
                    </Card>

                    {/* TicketTicket Policy */}
                    <Card className="border-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20">
                        <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
                            🎫 TicketTicket {t('ourPolicy')}
                        </h2>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">{t('ttPolicy1')}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">{t('ttPolicy2')}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">{t('ttPolicy3')}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">{t('ttPolicy4')}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Disclaimer */}
                    <Card className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {t('disclaimer')}
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300">{t('disclaimerContent')}</p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
