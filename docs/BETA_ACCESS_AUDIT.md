# Citizen platform beta access audit and implementation plan

Reviewed against the checked-out published website, Hub, Internet Banking, app and Core on 12 October 2026. This is a code and deployment audit, not a regulatory certification or a claim that every business workflow is complete.

## Role matrix

Roles are additive. A person who is both a customer and investor receives both personal capabilities, with one canonical identity. A corporate appointment, shareholding or SAFE record does not by itself grant application authority. Administrators grant approved access separately, with audit history.

| Role | Website | Hub features | Banking/app | Excluded capabilities |
|---|---|---|---|---|
| Public visitor | Public information, opportunities and careers | Published opportunity information, careers and guest applications; sign-in to review released investment evidence | Login/register and fictional demo selector | Private records and all administration |
| Candidate | Public content | Own applications, profile, messages and explicitly shared documents; can deliberately start a personal investment | Requires an additional customer role | Corporate register, board deliberations, other applicants and administrative review |
| Customer | Public content | Own profile, messages and shared documents; opportunities | Own accounts, cards, transfers, payments, statements and assistant | Other customers' records; institutional authority |
| Investor | Public content | Own portfolio, subscriptions, agreements, signing requests; released/stage-approved data room and published audience-specific progress | Requires additional customer role | Other investors' private contracts; cap-table changes, board voting and recruitment administration |
| Shareholder | Public content | Investor functions plus own linked holdings and ownership records | Requires additional customer role | Editing or certifying holdings; automatic board membership |
| Board member | Public content | Board meetings, resolutions, RSVP and voting; own messages and assigned documents; published board progress | Requires additional customer role | Corporate editing, recruitment administration or someone else's personal investment |
| Staff | Public content | Executive overview, people workspace when implemented, published operational progress; own files and messages | Requires additional customer role | Board material, cap-table changes and financial approval solely because of employment |
| Back office | Public content | Executive/operational overview, permitted finance/risk/licensing workspaces when implemented; published operational progress | Customer banking requires customer role; Core operational privileges remain separately approved | Board deliberations/voting, automatic admin status and unrestricted corporate editing |
| Regulatory reviewer | Public content | Explicitly released documents and project evidence; licensing/testing entries retained as coming soon until completed | Fictional demonstration access through demo accounts; no live money or corporate edits | Investor administration, private board records, recruitment dossiers and real financial operations |
| Administrator | Public content | Corporate register/cap table, subscriptions/payment review, vacancies/applicants, appointments, private document preparation/sharing, messages/projects, user profiles and ordinary role assignment | No implied customer or financial operations role | Granting super-admin status, direct password/email changes, signing as another person or voting without board role |
| Super administrator | Public content | Administration plus super-admin grants and direct canonical identity email/password changes | No implied customer role; banking back-office privileges remain a separate approval domain | Impersonating signers, casting votes without board role, bypassing independent approval or authorising real money before licensing |

## Record and action controls

- Own-record filters apply to portfolios, applications, banking accounts, cards, tasks, notifications and subscription details. A permitted page does not permit all its records.
- Documents require ownership, an explicit recipient grant or an approved audience. Drive permissions still apply. Documents and signatures are never stored as database bytes.
- Corporate confirmation/appointments require independent approval and source evidence. A board access role does not finalise an appointment. Payment or an explicitly authorised deferral remains required before investment signing.
- Signature authorisation is always assigned-party specific and requires fresh authentication and exact document/version consent. Admin access does not authorise a user's signature.
- Live and demonstration data remain distinct. Demo signers/files/identities cannot access live records, issue live share certificates or send real investor email.
- Core re-reads current roles from the database for every verified session. Hub re-reads active memberships. Menu hiding supplements page and API checks; it never replaces them.

## Findings and changes

1. Staff/back office inherited broad board read and RSVP access. Restrict board menus, pages and underlying meeting/resolution/member queries; RSVP and votes require actual board membership.
2. Staff/back office inherited investor portfolio navigation. Restrict it to investor/shareholder/admin; public opportunity discovery remains separate.
3. Assigned-document and personal-message pages were absent for some legitimate roles. Keep personal/shared access available to every recognised role while retaining object-level filters.
4. Projects and subscription pages could be opened directly despite menu restrictions. Apply the same catalog to the page boundary and menus.
5. The reviewer role introduced by an earlier migration was dropped by a later constraint replacement. Restore it in the role catalog, database constraint and transactional assignment function. Allow released document/project audiences. Do not claim the unfinished findings workflow is ready.
6. Core authenticated APIs enforced ownership but lacked an explicit customer-role gate. Guard all banking namespaces, including assistant/speech; institutional admin status alone grants no personal banking.
7. A legacy demo-admin activation route used a global flag and could operate outside demo scope. Retire it and its build-time invitation bootstrap. Canonical user administration remains in the Hub.
8. Permission errors could fall through to a futile Retry action. Show a specific access explanation and safe workspace/back/website navigation; authentication expiry offers sign-in. Do not disclose whether another person's private record exists.

## Implementation order

- P0: Apply role matrix and board-query restrictions, restore reviewer assignment, retire legacy privilege activation, add explicit banking customer gate and safe recovery UI. Test negative permissions and same-person mixed roles before production deployment.
- P1: Complete regulator-specific released licensing evidence and private findings submission/review before inviting CBL to a formal test release. These pages currently retain their coming-soon status.
- P1: Reconcile future Core-only registrations to canonical shared identities; universal credential administration cannot operate on unlinked legacy/password-only accounts.
- P1: Configure the Hub's Google Drive OAuth and application Resend connection and Core AI providers; test uploads, final personalised documents, restricted sharing, delivery and provider failure recovery. Account/provider names alone are not server credentials.
- P1: Define independently approved banking operational privileges separately from Hub roles. Do not map corporate administrator access to Core SUPER_ADMIN automatically.
- P2: Invite reviewers and investors, test combinations on phone/tablet/desktop, validate published Drive permissions and exercise revoked-role sessions. Resolve business-data reconciliation and legal template approvals before representing records as certified.

## Beta release limits

Public UI and completed self-service/administrative controls can be tested. This access release does not certify licensing, confirm investment holdings, enable real-money banking, activate an AI provider or complete the coming-soon regulator finding/finance/risk workflows. These remain explicit beta release prerequisites, not silently accessible placeholder functions.
