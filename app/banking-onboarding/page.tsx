import { redirect } from 'next/navigation';
export default function LegacyEntry(){ redirect((process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://citizenbank.co.ls') + '/enter-banking'); }
