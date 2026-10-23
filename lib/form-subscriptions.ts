import 'server-only';
import {createHash} from 'node:crypto';
import {query,ServiceIssue} from './db';
import {driveToken} from './institutional-drive';
export const subscriptionSheet='1DMoI8qZ6472Z6E4xXu-oxbcwv5GWcpHMZc1dFf8Zx24';
export const subscriptionTab='Form Responses 1';
export type FormSubmission={id:string;sheet_row:number;source_link:string;source_timestamp:string;facts:Record<string,string>;review_status:string;version:number;synced_at:string};
export async function importFormRows(rows:{row:number;timestamp:string;facts:Record<string,string>}[]){
 if(rows.length>10000)throw new ServiceIssue('FORM_SYNC_RANGE_REQUIRED','The form exceeds this import limit. Configure paged reconciliation before continuing.',422);
 const input=rows.map(r=>({...r,digest:createHash('sha256').update(JSON.stringify({timestamp:r.timestamp,facts:r.facts})).digest('hex')}));
 const changed=await query(`WITH incoming AS (SELECT * FROM jsonb_to_recordset($1::jsonb) AS r(row integer,timestamp text,facts jsonb,digest text)),changed AS (INSERT INTO hub_form_submissions(sheet_id,sheet_row,scope,source_link,source_digest,source_timestamp,facts) SELECT $2,row,'live',$3,digest,timestamp,facts FROM incoming ON CONFLICT(sheet_id,sheet_row,scope) DO UPDATE SET source_digest=EXCLUDED.source_digest,source_timestamp=EXCLUDED.source_timestamp,facts=EXCLUDED.facts,person_id=NULL,corporate_record_id=NULL,review_status='source_changed',version=hub_form_submissions.version+1,synced_at=now() WHERE hub_form_submissions.source_digest<>EXCLUDED.source_digest RETURNING *),history AS (INSERT INTO hub_form_submission_history(submission_id,version,snapshot) SELECT id,version,to_jsonb(changed) FROM changed),run AS (INSERT INTO hub_form_sync_runs(sheet_id,scope,rows_read,changed) SELECT $2,'live',$4,count(*) FROM changed) SELECT id FROM changed`,[JSON.stringify(input),subscriptionSheet,'https://docs.google.com/spreadsheets/d/'+subscriptionSheet+'/edit',rows.length]);
 return {ok:true,rows:rows.length,changed:changed.length};
}
export async function syncFormSubscriptions(){
 const token=await driveToken('live'),headers={Authorization:'Bearer '+token};
 const meta=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+subscriptionSheet+'?fields=sheets.properties',{headers,cache:'no-store',signal:AbortSignal.timeout(10000)});if(!meta.ok)throw new ServiceIssue('FORM_SHEET_ACCESS_REQUIRED','Authorise the existing response sheet for the Hub Google connection. Existing records remain intact.',503);
 const data=await meta.json(),sheet=data.sheets?.find((s:{properties:{title:string}})=>s.properties.title===subscriptionTab),count=sheet?.properties.gridProperties?.rowCount;if(!Number.isInteger(count)||count>10000)throw new ServiceIssue('FORM_SHEET_RANGE_CHANGED','Review the response-sheet tab and row bounds before synchronising.',422);
 const params=new URLSearchParams({valueRenderOption:'FORMATTED_VALUE'});for(const range of ['A1:V1','A2:C'+count,'E2:F'+count,'H2:N'+count,'P2:P'+count])params.append('ranges',"'Form Responses 1'!"+range);
 const response=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+subscriptionSheet+'/values:batchGet?'+params,{headers,cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new ServiceIssue('FORM_SYNC_READ_FAILED','Google could not provide the latest responses. Retry; existing records are retained.',503);
 const ranges=(await response.json()).valueRanges,head=(ranges?.[0]?.values?.[0]||[]).map((s:string)=>s.trim());if(head[0]!=='Timestamp'||head[2]!=='Full Names (as on your Identity Document)'||head[4]!=='Email Address'||head[10]!=='Share Class'||head[12]!=='Number of Shares Subscribed For?')throw new ServiceIssue('FORM_FIELDS_CHANGED','The form response columns changed. Review the import mapping before synchronising.',422);
 const identity=ranges[1].values||[],contact=ranges[2].values||[],investment=ranges[3].values||[],evidence=ranges[4].values||[];
 const rows=identity.flatMap((row:string[],i:number)=>row[0]?[{row:i+2,timestamp:row[0],facts:{name:row[2]||'',email:contact[i]?.[0]||'',phone:contact[i]?.[1]||'',investor_type:investment[i]?.[0]||'',company_name:investment[i]?.[1]||'',share_class:investment[i]?.[3]||'',price:investment[i]?.[4]||'',quantity:investment[i]?.[5]||'',amount:investment[i]?.[6]||'',payment_evidence_link:evidence[i]?.[0]||''}}]:[]);
 return importFormRows(rows);
}
