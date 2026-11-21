import { NextResponse, type NextRequest } from 'next/server';

/** Historical Hub investor and board records remain available for reconciliation.
 * New corporate writes belong to the original website's database and workflows.
 */
export function middleware(request: NextRequest) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return NextResponse.next();
  return NextResponse.json({
    code: 'ORIGINAL_WEBSITE_WORKFLOW_REQUIRED',
    error: 'Investment and board changes now take place on the Citizen Bank website. Open the original website workflow to continue.',
    next: (process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://citizenbank.co.ls') + '/back-office-dashboard',
  }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
}

export const config = {
  matcher: [
    '/api/investments/:path*',
    '/api/subscriptions/:path*',
    '/api/investors',
    '/api/corporate',
    '/api/appointments',
    '/api/reconciliation',
    '/api/form-subscriptions',
    '/api/ai/tasks/:path*',
    '/api/dataroom',
  ],
};
