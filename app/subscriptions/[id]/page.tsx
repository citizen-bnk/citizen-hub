import { redirect } from 'next/navigation';

/** Original website records are the investment and board source of truth. */
export default function OriginalWebsiteWorkspace() {
  redirect((process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://citizenbank.co.ls') + '/back-office-subscriptions');
}
