import {timingSafeEqual} from 'node:crypto';
import {query} from '@/lib/db';
import {processDocumentPack} from '@/lib/document-agent';
import {failure} from '@/lib/http';
export const maxDuration=300;
export async function GET(request:Request){const expected='Bearer '+(process.env.CRON_SECRET||''),supplied=request.headers.get('authorization')||'';if(!process.env.CRON_SECRET||expected.length!==supplied.length||!timingSafeEqual(Buffer.from(expected),Buffer.from(supplied)))return new Response('Unauthorised',{status:401});try{const jobs=await query<{id:string}>("SELECT id FROM hub_subscription_document_jobs WHERE status='queued' OR (status='processing' AND started_at<now()-interval '5 minutes') ORDER BY created_at LIMIT 1");for(const job of jobs)await processDocumentPack(job.id);return Response.json({ok:true,processed:jobs.length});}catch(e){return failure(e);}}
