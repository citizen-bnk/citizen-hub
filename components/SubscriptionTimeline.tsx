import {paidStatus,nextSubscriptionAction} from '@/lib/subscription-lifecycle';
type Record={status:string;agreement_link:string|null;payment_link:string|null;created_at:string};
export function SubscriptionTimeline({record}:{record:Record}){
 const closed=['declined','withdrawn'].includes(record.status);
 const steps=[{label:'Subscription saved',done:true},{label:'Signed agreement linked',done:!!record.agreement_link},{label:'Payment evidence submitted',done:!!record.payment_link},{label:'Settlement confirmed',done:paidStatus(record.status)},{label:'SAFE conversion',done:false}];
 return <section aria-label="Subscription progress"><ol className="subscription-timeline">{steps.map((step,index)=><li key={step.label} className={step.done?'complete':''}><span aria-hidden="true">{step.done?'✓':index+1}</span><div><strong>{step.label}</strong><small>{step.done?'Recorded':index===4?'Subject to the accepted SAFE terms':closed?'Subscription closed':'Outstanding'}</small></div></li>)}</ol><p className="journey-notice">{nextSubscriptionAction(record)}</p><small>Saved {new Intl.DateTimeFormat('en-ZA',{dateStyle:'medium',timeZone:'Africa/Johannesburg'}).format(new Date(record.created_at))}. Linking a document does not independently verify its contents.</small></section>;
}
