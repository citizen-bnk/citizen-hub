export type RecoveryAction='retry'|'sign_in'|'workspace'|'opportunities'|'reload'|'back'|'cancel';
export function recoveryActions(code:string):RecoveryAction[]{
 if(code==='SIGN_IN_REQUIRED')return ['sign_in','back','cancel'];
 if(code==='OPPORTUNITY_CHANGED')return ['opportunities','back','cancel'];
 if(code==='INVESTOR_ROLE_REQUIRED'||code==='INVESTMENT_ACCESS_REQUIRED')return ['opportunities','workspace','cancel'];
 if(code==='ADMIN_REQUIRED'||code==='INDEPENDENT_REVIEW_REQUIRED'||code==='REVIEW_ACCESS_DENIED'||code==='FINDING_ACTION_DENIED'||code==='WORKSPACE_ACCESS_DENIED'||code.endsWith('_ROLE_REQUIRED')||code.endsWith('_ACCESS_REQUIRED')||code==='REQUEST_ORIGIN_REJECTED')return ['workspace','back','cancel'];
 if(code==='PROFILE_CHANGED'||code==='RECORD_CONFLICT'||code==='READINESS_CHANGED'||code==='ITEM_CHANGED'||code==='FINDING_CHANGED')return ['reload','back','cancel'];
 if(code==='VOTE_CLOSED'||code==='MEETING_UNAVAILABLE'||code==='TASK_UNAVAILABLE')return ['workspace','back','cancel'];
 return ['retry','back','cancel'];
}
