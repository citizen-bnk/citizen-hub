import {planAITask} from '@/lib/ai-task-planner';
import {z} from 'zod';
import {requirePerson} from '@/lib/session';
import {requireOrigin,failure} from '@/lib/http';
import {aiRequest,aiContext} from '@/lib/citizen-ai';
import {can} from '@/lib/contracts';
import {ServiceIssue,query} from '@/lib/db';
export const maxDuration=60;
const input=z.discriminatedUnion('mode',[
 z.object({mode:z.literal('task'),instruction:z.string().trim().min(3).max(4000)}).strict(),
 z.object({mode:z.literal('document_draft'),instruction:z.string().trim().min(10).max(4000)}).strict(),
 z.object({mode:z.literal('investment_draft'),instruction:z.string().trim().min(10).max(4000)}).strict(),
 z.object({mode:z.literal('chat'),language:z.enum(['en','st','zu']),messages:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().trim().min(1).max(4000)}).strict()).min(1).max(20)}).strict(),
 z.object({mode:z.literal('speech'),language:z.enum(['en','st','zu']),text:z.string().trim().min(1).max(4000)}).strict(),
 z.object({mode:z.literal('status')}).strict()
]);
export async function POST(request:Request){try{
 requireOrigin(request);const person=await requirePerson();const raw=await request.text();if(raw.length>95000)return Response.json({error:'Start a new conversation; this one is too long.',code:'VALIDATION_FAILED'},{status:422});
 const data=input.parse(JSON.parse(raw));
 if(data.mode==='task')return Response.json(await planAITask(person,data.instruction),{headers:{'Cache-Control':'no-store'}});
 if(data.mode==='document_draft'){
  if(!can(person.roles,['admin']))throw new ServiceIssue('DOCUMENT_ADMIN_REQUIRED','Only administrators can prepare company documents.',403);
  const response=await aiRequest(person,{mode:'chat',language:'en',context:await aiContext(person),messages:[{role:'user',content:'Prepare a document instruction only. Return JSON {kind,subscription_id,reference}. kind is safe, bonus_agreement, invoice, receipt, or certificate_preview. Select an existing subscription UUID from context; never invent one. A revision reuses the exact unsigned reference; a new investment gets a new reference. Never modify signed documents, claim a draft is saved, or invent identity numbers. If ambiguous return {error:"Ask for clarification"}. Instruction: '+data.instruction}]});const result=await response.json();let value:unknown;try{value=JSON.parse(String(result.reply).replace(/^```(?:json)?\s*|\s*```$/g,''));}catch{throw new ServiceIssue('AI_DOCUMENT_REVIEW_REQUIRED','Specify the investor, document type and reference. Nothing has been generated.',422);}const draft=z.object({kind:z.enum(['safe','bonus_agreement','invoice','receipt','certificate_preview']),subscription_id:z.string().uuid(),reference:z.string().trim().min(3).max(100)}).strict().safeParse(value);if(!draft.success)throw new ServiceIssue('AI_DOCUMENT_REVIEW_REQUIRED','Specify the subscription, document type and reference, or open Documents to select them.',422);const [subscription]=await query<{display_name:string}>('SELECT p.display_name FROM hub_subscription_requests r JOIN hub_people p ON p.id=r.person_id WHERE r.id=$1 AND r.scope=$2',[draft.data.subscription_id,person.scope]);if(!subscription)throw new ServiceIssue('SUBSCRIPTION_UNAVAILABLE','The suggested subscription is unavailable. Select an existing record.',422);return Response.json({draft:{...draft.data,name:subscription.display_name},saved:false},{headers:{'Cache-Control':'no-store'}});
 }
 if(data.mode==='investment_draft'){
  if(!can(person.roles,['admin']))throw new ServiceIssue('INVESTMENT_ADMIN_REQUIRED','Only administrators can prepare investor transactions.',403);
  const response=await aiRequest(person,{mode:'chat',language:'en',context:await aiContext(person),messages:[{role:'user',content:'Prepare a draft only; never claim it is saved or paid. Return only JSON with units (positive integer purchased reference shares), bonus_units (nonnegative integer conditional on full payment), investor_name (string), and note (20-2000 characters). Derive purchased units only from the approved offer price in context. If the amount or price is ambiguous do not guess; return {"error":"Explain the missing information"}. No credentials, identity documents, or arbitrary tools. User instruction: '+data.instruction}]});
  const result=await response.json();let draft:unknown;try{draft=JSON.parse(String(result.reply).replace(/^```(?:json)?\s*|\s*```$/g,''));}catch{throw new ServiceIssue('AI_DRAFT_REVIEW_REQUIRED','CitizenAI could not prepare a structured draft. Rephrase the amount and bonus, or use Capture investor subscription in the cap table.',422);}
  const parsed=z.object({units:z.number().int().positive().max(2147483647),bonus_units:z.number().int().nonnegative().max(2147483647),investor_name:z.string().max(200),note:z.string().min(20).max(2000)}).strict().safeParse(draft);
  if(!parsed.success)throw new ServiceIssue('AI_DRAFT_REVIEW_REQUIRED','The instruction needs clarification. Include the investor name, purchase amount and bonus terms. Nothing has been saved.',422);
  return Response.json({draft:parsed.data,saved:false},{headers:{'Cache-Control':'no-store'}});
 }
 const response=await aiRequest(person,{...data,...(data.mode==='chat'?{context:await aiContext(person)}:{})});
 if(data.mode==='speech')return new Response(await response.arrayBuffer(),{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store'}});
 const result=await response.json();return Response.json(data.mode==='chat'?{reply:result.reply}:result,{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
