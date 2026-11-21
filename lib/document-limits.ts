import 'server-only';
import {query,ServiceIssue} from './db';
export async function documentLimit(personId:string,action:string){
 const rows=await query(`INSERT INTO hub_document_action_limits(person_id,action,window_at,attempts) VALUES($1,$2,now(),1) ON CONFLICT(person_id,action) DO UPDATE SET window_at=CASE WHEN hub_document_action_limits.window_at<now()-interval '1 hour' THEN now() ELSE hub_document_action_limits.window_at END,attempts=CASE WHEN hub_document_action_limits.window_at<now()-interval '1 hour' THEN 1 ELSE hub_document_action_limits.attempts+1 END WHERE hub_document_action_limits.window_at<now()-interval '1 hour' OR hub_document_action_limits.attempts<30 RETURNING attempts`,[personId,action]);
 if(!rows.length)throw new ServiceIssue('DOCUMENT_ACTION_LIMIT','Too many document actions. Try again in an hour.',429);
}
