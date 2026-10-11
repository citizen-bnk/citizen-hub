import {z} from 'zod';
export const suitabilityQuestions=[
 ['integrity','Have you had a conviction or court finding involving dishonesty, fraud, violence or financial misconduct?'],
 ['discipline','Have you faced professional discipline, regulatory investigation, refusal of professional entry, or disqualification from management or directorship?'],
 ['employment','Have you been dismissed or asked to resign for misconduct, or been involved in relevant pending legal proceedings?'],
 ['financial','Have you or a business you managed faced insolvency, unsatisfied judgment debts, debt write-offs or legal action over unpaid obligations?'],
 ['governance','Have you faced findings concerning negligence, improper business practices, conflicts of interest or failure of duty of care?'],
 ['interests','Do you hold other directorships, controlling interests or business interests that could conflict with this role?'],
] as const;
export function linkedinURL(value:string){try{const u=new URL(value);return u.protocol==='https:'&&['linkedin.com','www.linkedin.com'].includes(u.hostname)&&/^\/in\/[^/]+\/?$/.test(u.pathname)&&!u.username&&!u.password&&!u.search&&!u.hash;}catch{return false;}}
const answer=z.enum(['no','yes','discuss']);
export const applicantInput=z.object({
 vacancy_id:z.string().uuid(),vacancy_version:z.number().int().positive(),request_key:z.string().uuid(),
 name:z.string().trim().min(3).max(160),email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),phone:z.string().trim().min(7).max(40),
 location:z.string().trim().min(2).max(200),linkedin:z.string().trim().max(300).refine(linkedinURL,'Use your https://www.linkedin.com/in/… profile URL.'),
 experience:z.string().trim().min(30).max(4000),qualifications:z.string().trim().min(10).max(2000),achievement:z.string().trim().min(30).max(3000),
 cover_statement:z.string().trim().min(30).max(4000),availability:z.string().trim().min(2).max(200),eligibility:z.enum(['eligible','permission_required','discuss']),
 cv_link:z.string().max(500).default(''),references_link:z.string().max(500).default(''),selfie_link:z.string().max(500).default(''),id_photo_link:z.string().max(500).default(''),
 suitability:z.object({integrity:answer,discipline:answer,employment:answer,financial:answer,governance:answer,interests:answer}).optional(),
 disclosure:z.string().trim().max(4000).default(''),commitment:z.literal(true),consent:z.literal(true),accuracy:z.literal(true),
}).strict();
export function suitabilityRequired(kind:string,title:string){return kind==='board'||/chief|director|head of|company secretary|compliance|risk|audit/i.test(title);}
