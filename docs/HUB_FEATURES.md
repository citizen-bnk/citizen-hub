# Citizen Hub: what it must do, and the features that do it

## Purpose

The Hub is where Citizen Bank's own people do their work. Four kinds of person sign in, with one identity, and each sees only
their own areas:

| Person | What they need from the Hub |
|---|---|
| **Investor / shareholder** | Hold and buy shares, pay, get certificates and receipts, read the data room, keep their profile |
| **Board member** | Attend meetings, decide (vote, approve), supply licence-compliance documents, invest as a board member |
| **Back office** | Run subscriptions and payments, certificates, the board roster, member documents, invitations and leads, the data room, communications, settings |
| **Administrator** | Manage users and roles, board positions |

Banking customers are not Hub users; the Hub only hands them on to banking.

## What the old Hub was, and why it was rebuilt

The first Hub was 50 screens (about 40,000 lines) copied from the website, with its own routes, headers and role checks in
every file, a stale generated API client (39 calls that did not exist on the backend), and the same try/catch-and-toast
error handling repeated on every screen. An audit of every screen (purpose, users, actions, backend routes, health) showed the
same jobs repeated in several places: two subscription lists, three certificate lists, two invitation screens, three data-room
screens, a board-documents screen and a licence-documents screen, a dashboard per role.

## The reduction: 50 screens become 14 features

| Feature | Replaces (old screens) | Screens in the new Hub |
|---|---|---|
| **home** | Invest, BoardPortal, BackOfficeDashboard, AdminDashboard | One role-aware Home: workspaces, plus tiles each feature contributes |
| **portfolio** | MySubscriptions, Invest, ShareSubscription, BoardInvestment | Investments list, subscription detail (documents, pay, proof), buy shares in 3 steps (Class C for the board is a flag) |
| **data-room** | DataRoom, DataRoomAccess, MyAgreements, BackOfficeDataRoom, BackOfficeDataRoomAccess | Investor data room (agreements gate and status inside it); back-office data room (categories, documents, access log, agreements, LOI review) |
| **meetings** | BoardMeetings, MeetingDetails, CreateMeeting | List, new meeting, one meeting (agenda, minutes, attendance, actions) |
| **decisions** | Governance, GovernanceAdmin | Board: what needs my vote or approval, and history. Back office: sessions (agenda, documents, open/close, results, notify) |
| **compliance** | BoardDocuments, BoardOnboarding, BackOfficeBoardDocuments, BackOfficeLicenseDocuments | Board: my required documents and uploads. Back office: requirements, review, chase |
| **roster** | BackOfficeBoardMembers, BackOfficeBoardMapping, BoardMemberDetail, AdminBoardPositions, BoardPortal | Board roster with member detail panel and account-link filter; positions and appointments; "my board profile" tile |
| **subscriptions** | BackOfficeSubscriptions, BackOfficeAdminSubscriptions, BackOfficeSubscribeOnBehalf, BackOfficeBoardInvestments | One list with filters (board, created by me) and a detail panel with status-driven actions; new subscription on behalf |
| **certificates** | BackOfficeCertificates, BackOfficeCertificateTemplates, SignCertificate, CertificateRegistry | Certificates list with actions (sign, revoke, resend, regenerate, download); templates |
| **people** | BoardPortalInvitations, BackOfficeInvitations, BackOfficeInvestorLeads, AdminUsers, AdminUserDetail | One invitations screen; investor leads; users and roles with a detail panel and history |
| **settings** | BackOfficeShareClasses, BackOfficeBankAccounts, BackOfficeCryptoWallets | One settings screen: share classes, payment accounts |
| **comms** | BackOfficeEngagement, BackOfficeSentItems, CommunicationPortal, BackOfficeMediaReleases, BackOfficeAchievements | Communications (campaign drafts, outbox with retry, email templates); public content (releases, achievements, timeline) |
| **account** | Profile, CompleteProfile, NotificationPreferences, NotificationBell | Profile and notification settings; first-time setup; the "to do" tile |

## Deliberately dropped

AdminAudit (an empty placeholder; no backend), AdminSetupGuide (a one-time bootstrap: use a seed script), the engagement
schedules tab (no backend), SMS and WhatsApp tabs, the AI model and price picker, the Google Drive AI import (own module later,
behind a flag), usage ranking and search tiles, investment recommendations, share transfer and class conversion (back office
can do them for now), confetti and South-African-ID-specific rules, the duplicate dashboards.

## Addresses

Every feature declares old website addresses it replaces (`legacy`). The website redirects those to the Hub and the Hub
redirects them to the new address, so bookmarks and emailed links keep working.

## How it is built

`src/platform/` is the only shared code: the API client and one error type, the query client that reports every failure once,
the session and roles, the shell (navigation built from roles, role gate), and small UI building blocks. Each feature is a
folder in `src/features/<id>/` that the shell discovers; features never import each other. See `BUILDING_A_FEATURE.md`.
