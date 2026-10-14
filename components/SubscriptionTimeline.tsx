import {paidStatus,nextSubscriptionAction} from '@/lib/subscription-lifecycle';
type Record={status:string;agreement_link:string|null;payment_link:string|null;created_at:string;digital_accepted_at?:string|null};
export function SubscriptionTimeline({record}:{record:Record}){
 const closed=['declined','withdrawn'].includes(record.status);
 const steps=[{label:'Subscription saved',done:true},{label:'Digital investor acceptance',done:!!record.digital_accepted_at},{label:'Settlement confirmed',done:paidStatus(record.status)},{label:'SAFE conversion',done:false}];
 return <section aria-label="Subscription progress"><ol className="subscription-timeline">{steps.map((step,index)=><li key={step.label} className={step.done?'complete':''}><span aria-hidden="true">{step.done?'✓':index+1}</span><div><strong>{step.label}</strong><small>{step.done?'Recorded':index===4?'Subject to the accepted SAFE terms':closed?'Subscription closed':'Outstanding'}</small></div></li>)}</ol><p className="journey-notice">{nextSubscriptionAction(record)}</p><small>Saved {new Intl.DateTimeFormat('en-ZA',{dateStyle:'medium',timeZone:'Africa/Johannesburg'}).format(new Date(record.created_at))}. Supporting documents and signatures are retained separately.</small></section>;
}
