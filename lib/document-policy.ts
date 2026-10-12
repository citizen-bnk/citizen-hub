import {z} from 'zod';
import {driveReference} from './contracts';
export const documentLink=z.string().max(1000).transform(v=>driveReference(v));
export const signingConsent='I authorise my signature to be appended to this exact document version and digest, in the stated capacity. Named parties may countersign its unchanged terms. Saving a signature does not authorise any other document.';
export const partyInput=z.object({person_id:z.string().uuid(),capacity:z.enum(['investor','board_member','company_signatory','chairperson','company_secretary','individual'])}).strict();
export const signingRequestInput=z.object({document_id:z.string().uuid(),document_version:z.number().int().positive(),parties:z.array(partyInput).min(1).max(15)}).strict().refine(d=>new Set(d.parties.map(p=>p.person_id)).size===d.parties.length,'Select each signer once.');
export function certificateEligible(record:{kind:string;status:string;confirmed_by:string|null;confirmed_at:string|null;facts:Record<string,unknown>}){return record.kind==='holding'&&record.status==='confirmed'&&!!record.confirmed_by&&!!record.confirmed_at&&Number.isSafeInteger(Number(record.facts.quantity))&&Number(record.facts.quantity)>0&&!!record.facts.approval_link;}
export function canAuthorise(request:{status:string;document_digest:string},actualDigest:string,party:{person_id:string;authorised_at:string|null}|undefined,personId:string){return request.status==='requested'&&request.document_digest===actualDigest&&party?.person_id===personId&&!party.authorised_at;}
