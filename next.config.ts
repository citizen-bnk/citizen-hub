import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false, outputFileTracingRoot: process.cwd(),
  async redirects(){const routes:Record<string,string>={
   '/board-portal':'/board','/board-meetings':'/board','/board-documents':'/documents','/board-investment':'/investors','/governance':'/board','/governance-admin':'/board',
   '/account/:path*':'/profile','/complete-profile':'/profile','/board-onboarding':'/profile','/portfolio/:path*':'/investors','/my-subscriptions':'/investors','/share-subscription':'/investors','/invest':'/investors',
   '/meetings/:path*':'/board','/decisions/:path*':'/board','/notifications':'/communications','/newsletters':'/communications','/notification-preferences':'/settings','/compliance':'/documents','/data-room/:path*':'/documents','/my-agreements':'/documents',
   '/office/subscriptions/:path*':'/investors','/office/certificates/:path*':'/investors','/office/board':'/board','/office/decisions/:path*':'/board','/office/compliance':'/documents','/office/data-room/:path*':'/documents','/office/settings':'/settings','/office/communications':'/communications','/office/leads':'/people','/invitations':'/people','/admin/:path*':'/settings','/admin-dashboard':'/executive','/back-office-dashboard':'/executive',
  };return Object.entries(routes).map(([source,destination])=>({source,destination,permanent:false}));},
  async headers() { return [{ source:"/:path*",headers:[
    {key:"X-Content-Type-Options",value:"nosniff"}, {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
    {key:"X-Frame-Options",value:"DENY"}, {key:"Permissions-Policy",value:"camera=(), microphone=(self), geolocation=()"},
  ]}]; },
};
export default config;
