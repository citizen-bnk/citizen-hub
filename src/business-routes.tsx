import { lazy } from "react";
import { UserGuard } from "app/auth";
const AdminAudit = lazy(() => import("./pages/AdminAudit.tsx"));
const AdminBoardPositions = lazy(() => import("./pages/AdminBoardPositions.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const AdminSetupGuide = lazy(() => import("./pages/AdminSetupGuide.tsx"));
const AdminUserDetail = lazy(() => import("./pages/AdminUserDetail.tsx"));
const AdminUsers = lazy(() => import("./pages/AdminUsers.tsx"));
const BackOfficeAchievements = lazy(() => import("./pages/BackOfficeAchievements.tsx"));
const BackOfficeAdminSubscriptions = lazy(() => import("./pages/BackOfficeAdminSubscriptions.tsx"));
const BackOfficeBankAccounts = lazy(() => import("./pages/BackOfficeBankAccounts.tsx"));
const BackOfficeBoardDocuments = lazy(() => import("./pages/BackOfficeBoardDocuments.tsx"));
const BackOfficeBoardInvestments = lazy(() => import("./pages/BackOfficeBoardInvestments.tsx"));
const BackOfficeBoardMapping = lazy(() => import("./pages/BackOfficeBoardMapping.tsx"));
const BackOfficeBoardMembers = lazy(() => import("./pages/BackOfficeBoardMembers.tsx"));
const BackOfficeCertificateTemplates = lazy(() => import("./pages/BackOfficeCertificateTemplates.tsx"));
const BackOfficeCertificates = lazy(() => import("./pages/BackOfficeCertificates.tsx"));
const BackOfficeCryptoWallets = lazy(() => import("./pages/BackOfficeCryptoWallets.tsx"));
const BackOfficeDashboard = lazy(() => import("./pages/BackOfficeDashboard.tsx"));
const BackOfficeDataRoom = lazy(() => import("./pages/BackOfficeDataRoom.tsx"));
const BackOfficeDataRoomAccess = lazy(() => import("./pages/BackOfficeDataRoomAccess.tsx"));
const BackOfficeEngagement = lazy(() => import("./pages/BackOfficeEngagement.tsx"));
const BackOfficeInvestorLeads = lazy(() => import("./pages/BackOfficeInvestorLeads.tsx"));
const BackOfficeInvitations = lazy(() => import("./pages/BackOfficeInvitations.tsx"));
const BackOfficeLicenseDocuments = lazy(() => import("./pages/BackOfficeLicenseDocuments.tsx"));
const BackOfficeMediaReleases = lazy(() => import("./pages/BackOfficeMediaReleases.tsx"));
const BackOfficeSentItems = lazy(() => import("./pages/BackOfficeSentItems.tsx"));
const BackOfficeShareClasses = lazy(() => import("./pages/BackOfficeShareClasses.tsx"));
const BackOfficeSubscribeOnBehalf = lazy(() => import("./pages/BackOfficeSubscribeOnBehalf.tsx"));
const BackOfficeSubscriptions = lazy(() => import("./pages/BackOfficeSubscriptions.tsx"));
const BoardDocuments = lazy(() => import("./pages/BoardDocuments.tsx"));
const BoardInvestment = lazy(() => import("./pages/BoardInvestment.tsx"));
const BoardMeetings = lazy(() => import("./pages/BoardMeetings.tsx"));
const BoardMemberDetail = lazy(() => import("./pages/BoardMemberDetail.tsx"));
const BoardOnboarding = lazy(() => import("./pages/BoardOnboarding.tsx"));
const BoardPortal = lazy(() => import("./pages/BoardPortal.tsx"));
const BoardPortalInvitations = lazy(() => import("./pages/BoardPortalInvitations.tsx"));
const CommunicationPortal = lazy(() => import("./pages/CommunicationPortal.tsx"));
const CreateMeeting = lazy(() => import("./pages/CreateMeeting.tsx"));
const DataRoom = lazy(() => import("./pages/DataRoom.tsx"));
const DataRoomAccess = lazy(() => import("./pages/DataRoomAccess.tsx"));
const Governance = lazy(() => import("./pages/Governance.tsx"));
const GovernanceAdmin = lazy(() => import("./pages/GovernanceAdmin.tsx"));
const Invest = lazy(() => import("./pages/Invest.tsx"));
const MeetingDetails = lazy(() => import("./pages/MeetingDetails.tsx"));
const MyAgreements = lazy(() => import("./pages/MyAgreements.tsx"));
const MySubscriptions = lazy(() => import("./pages/MySubscriptions.tsx"));
const ShareSubscription = lazy(() => import("./pages/ShareSubscription.tsx"));
const SignCertificate = lazy(() => import("./pages/SignCertificate.tsx"));
const Profile=lazy(()=>import("./pages/Profile.tsx"));
const CompleteProfile=lazy(()=>import("./pages/CompleteProfile.tsx"));
const NotificationPreferences=lazy(()=>import("./pages/NotificationPreferences.tsx"));
export const businessRoutes = [
 {path:"/profile",element:<UserGuard><Profile /></UserGuard>},
 {path:"/complete-profile",element:<UserGuard><CompleteProfile /></UserGuard>},
 {path:"/completeprofile",element:<UserGuard><CompleteProfile /></UserGuard>},
 {path:"/notification-preferences",element:<UserGuard><NotificationPreferences /></UserGuard>},
 {path:"/notificationpreferences",element:<UserGuard><NotificationPreferences /></UserGuard>},
	{ path: "/admin-audit", element: <UserGuard><AdminAudit /></UserGuard> },
	{ path: "/adminaudit", element: <UserGuard><AdminAudit /></UserGuard> },
	{ path: "/admin-board-positions", element: <UserGuard><AdminBoardPositions /></UserGuard> },
	{ path: "/adminboardpositions", element: <UserGuard><AdminBoardPositions /></UserGuard> },
	{ path: "/admin-dashboard", element: <UserGuard><AdminDashboard /></UserGuard> },
	{ path: "/admindashboard", element: <UserGuard><AdminDashboard /></UserGuard> },
	{ path: "/admin-setup-guide", element: <UserGuard><AdminSetupGuide /></UserGuard> },
	{ path: "/adminsetupguide", element: <UserGuard><AdminSetupGuide /></UserGuard> },
	{ path: "/admin-user-detail", element: <UserGuard><AdminUserDetail /></UserGuard> },
	{ path: "/adminuserdetail", element: <UserGuard><AdminUserDetail /></UserGuard> },
	{ path: "/admin-users", element: <UserGuard><AdminUsers /></UserGuard> },
	{ path: "/adminusers", element: <UserGuard><AdminUsers /></UserGuard> },
	{ path: "/back-office-achievements", element: <UserGuard><BackOfficeAchievements /></UserGuard> },
	{ path: "/backofficeachievements", element: <UserGuard><BackOfficeAchievements /></UserGuard> },
	{ path: "/back-office-admin-subscriptions", element: <UserGuard><BackOfficeAdminSubscriptions /></UserGuard> },
	{ path: "/backofficeadminsubscriptions", element: <UserGuard><BackOfficeAdminSubscriptions /></UserGuard> },
	{ path: "/back-office-bank-accounts", element: <UserGuard><BackOfficeBankAccounts /></UserGuard> },
	{ path: "/backofficebankaccounts", element: <UserGuard><BackOfficeBankAccounts /></UserGuard> },
	{ path: "/back-office-board-documents", element: <UserGuard><BackOfficeBoardDocuments /></UserGuard> },
	{ path: "/backofficeboarddocuments", element: <UserGuard><BackOfficeBoardDocuments /></UserGuard> },
	{ path: "/back-office-board-investments", element: <UserGuard><BackOfficeBoardInvestments /></UserGuard> },
	{ path: "/backofficeboardinvestments", element: <UserGuard><BackOfficeBoardInvestments /></UserGuard> },
	{ path: "/back-office-board-mapping", element: <UserGuard><BackOfficeBoardMapping /></UserGuard> },
	{ path: "/backofficeboardmapping", element: <UserGuard><BackOfficeBoardMapping /></UserGuard> },
	{ path: "/back-office-board-members", element: <UserGuard><BackOfficeBoardMembers /></UserGuard> },
	{ path: "/backofficeboardmembers", element: <UserGuard><BackOfficeBoardMembers /></UserGuard> },
	{ path: "/back-office-certificate-templates", element: <UserGuard><BackOfficeCertificateTemplates /></UserGuard> },
	{ path: "/backofficecertificatetemplates", element: <UserGuard><BackOfficeCertificateTemplates /></UserGuard> },
	{ path: "/back-office-certificates", element: <UserGuard><BackOfficeCertificates /></UserGuard> },
	{ path: "/backofficecertificates", element: <UserGuard><BackOfficeCertificates /></UserGuard> },
	{ path: "/back-office-crypto-wallets", element: <UserGuard><BackOfficeCryptoWallets /></UserGuard> },
	{ path: "/backofficecryptowallets", element: <UserGuard><BackOfficeCryptoWallets /></UserGuard> },
	{ path: "/back-office-dashboard", element: <UserGuard><BackOfficeDashboard /></UserGuard> },
	{ path: "/backofficedashboard", element: <UserGuard><BackOfficeDashboard /></UserGuard> },
	{ path: "/back-office-data-room", element: <UserGuard><BackOfficeDataRoom /></UserGuard> },
	{ path: "/backofficedataroom", element: <UserGuard><BackOfficeDataRoom /></UserGuard> },
	{ path: "/back-office-data-room-access", element: <UserGuard><BackOfficeDataRoomAccess /></UserGuard> },
	{ path: "/backofficedataroomaccess", element: <UserGuard><BackOfficeDataRoomAccess /></UserGuard> },
	{ path: "/back-office-engagement", element: <UserGuard><BackOfficeEngagement /></UserGuard> },
	{ path: "/backofficeengagement", element: <UserGuard><BackOfficeEngagement /></UserGuard> },
	{ path: "/back-office-investor-leads", element: <UserGuard><BackOfficeInvestorLeads /></UserGuard> },
	{ path: "/backofficeinvestorleads", element: <UserGuard><BackOfficeInvestorLeads /></UserGuard> },
	{ path: "/back-office-invitations", element: <UserGuard><BackOfficeInvitations /></UserGuard> },
	{ path: "/backofficeinvitations", element: <UserGuard><BackOfficeInvitations /></UserGuard> },
	{ path: "/back-office-license-documents", element: <UserGuard><BackOfficeLicenseDocuments /></UserGuard> },
	{ path: "/backofficelicensedocuments", element: <UserGuard><BackOfficeLicenseDocuments /></UserGuard> },
	{ path: "/back-office-media-releases", element: <UserGuard><BackOfficeMediaReleases /></UserGuard> },
	{ path: "/backofficemediareleases", element: <UserGuard><BackOfficeMediaReleases /></UserGuard> },
	{ path: "/back-office-sent-items", element: <UserGuard><BackOfficeSentItems /></UserGuard> },
	{ path: "/backofficesentitems", element: <UserGuard><BackOfficeSentItems /></UserGuard> },
	{ path: "/back-office-share-classes", element: <UserGuard><BackOfficeShareClasses /></UserGuard> },
	{ path: "/backofficeshareclasses", element: <UserGuard><BackOfficeShareClasses /></UserGuard> },
	{ path: "/back-office-subscribe-on-behalf", element: <UserGuard><BackOfficeSubscribeOnBehalf /></UserGuard> },
	{ path: "/backofficesubscribeonbehalf", element: <UserGuard><BackOfficeSubscribeOnBehalf /></UserGuard> },
	{ path: "/back-office-subscriptions", element: <UserGuard><BackOfficeSubscriptions /></UserGuard> },
	{ path: "/backofficesubscriptions", element: <UserGuard><BackOfficeSubscriptions /></UserGuard> },
	{ path: "/board-documents", element: <UserGuard><BoardDocuments /></UserGuard> },
	{ path: "/boarddocuments", element: <UserGuard><BoardDocuments /></UserGuard> },
	{ path: "/board-investment", element: <UserGuard><BoardInvestment /></UserGuard> },
	{ path: "/boardinvestment", element: <UserGuard><BoardInvestment /></UserGuard> },
	{ path: "/board-meetings", element: <UserGuard><BoardMeetings /></UserGuard> },
	{ path: "/boardmeetings", element: <UserGuard><BoardMeetings /></UserGuard> },
	{ path: "/board-member-detail", element: <UserGuard><BoardMemberDetail /></UserGuard> },
	{ path: "/boardmemberdetail", element: <UserGuard><BoardMemberDetail /></UserGuard> },
	{ path: "/board-onboarding", element: <UserGuard><BoardOnboarding /></UserGuard> },
	{ path: "/boardonboarding", element: <UserGuard><BoardOnboarding /></UserGuard> },
	{ path: "/board-portal", element: <UserGuard><BoardPortal /></UserGuard> },
	{ path: "/boardportal", element: <UserGuard><BoardPortal /></UserGuard> },
	{ path: "/board-portal-invitations", element: <UserGuard><BoardPortalInvitations /></UserGuard> },
	{ path: "/boardportalinvitations", element: <UserGuard><BoardPortalInvitations /></UserGuard> },
	{ path: "/communication-portal", element: <UserGuard><CommunicationPortal /></UserGuard> },
	{ path: "/communicationportal", element: <UserGuard><CommunicationPortal /></UserGuard> },
	{ path: "/create-meeting", element: <UserGuard><CreateMeeting /></UserGuard> },
	{ path: "/createmeeting", element: <UserGuard><CreateMeeting /></UserGuard> },
	{ path: "/data-room", element: <UserGuard><DataRoom /></UserGuard> },
	{ path: "/dataroom", element: <UserGuard><DataRoom /></UserGuard> },
	{ path: "/data-room-access", element: <UserGuard><DataRoomAccess /></UserGuard> },
	{ path: "/dataroomaccess", element: <UserGuard><DataRoomAccess /></UserGuard> },
	{ path: "/governance", element: <UserGuard><Governance /></UserGuard> },
	{ path: "/governance-admin", element: <UserGuard><GovernanceAdmin /></UserGuard> },
	{ path: "/governanceadmin", element: <UserGuard><GovernanceAdmin /></UserGuard> },
	{ path: "/invest", element: <UserGuard><Invest /></UserGuard> },
	{ path: "/meeting-details", element: <UserGuard><MeetingDetails /></UserGuard> },
	{ path: "/meetingdetails", element: <UserGuard><MeetingDetails /></UserGuard> },
	{ path: "/my-agreements", element: <UserGuard><MyAgreements /></UserGuard> },
	{ path: "/myagreements", element: <UserGuard><MyAgreements /></UserGuard> },
	{ path: "/my-subscriptions", element: <UserGuard><MySubscriptions /></UserGuard> },
	{ path: "/mysubscriptions", element: <UserGuard><MySubscriptions /></UserGuard> },
	{ path: "/share-subscription", element: <UserGuard><ShareSubscription /></UserGuard> },
	{ path: "/sharesubscription", element: <UserGuard><ShareSubscription /></UserGuard> },
	{ path: "/sign-certificate", element: <UserGuard><SignCertificate /></UserGuard> },
	{ path: "/signcertificate", element: <UserGuard><SignCertificate /></UserGuard> },
];
