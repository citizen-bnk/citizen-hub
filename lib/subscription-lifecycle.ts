export const subscriptionStatuses=['submitted','under_review','awaiting_agreement','awaiting_payment','received','pending_conversion','declined','withdrawn'] as const;
export type SubscriptionStatus=typeof subscriptionStatuses[number];
export const reviewTransitions:Record<SubscriptionStatus,readonly SubscriptionStatus[]>={
 submitted:['under_review','awaiting_agreement','awaiting_payment','received','declined'],
 under_review:['under_review','awaiting_agreement','awaiting_payment','received','declined'],
 awaiting_agreement:['under_review','awaiting_agreement','awaiting_payment','received','declined'],
 awaiting_payment:['under_review','awaiting_agreement','awaiting_payment','received','declined'],
 received:['received','pending_conversion'],
 pending_conversion:['pending_conversion'],declined:[],withdrawn:[],
};
export const statusLabels:Record<SubscriptionStatus,string>={
 submitted:'Subscription saved',under_review:'Under review',awaiting_agreement:'Agreement outstanding',
 awaiting_payment:'Payment outstanding',received:'Payment confirmed',pending_conversion:'Awaiting SAFE conversion',
 declined:'Declined',withdrawn:'Withdrawn',
};
export function paidStatus(status:string){return status==='received'||status==='pending_conversion';}
export function withdrawalAllowed(record:{status:string;agreement_link:string|null;payment_link:string|null}){
 return ['submitted','under_review','awaiting_agreement','awaiting_payment'].includes(record.status)&&!record.agreement_link&&!record.payment_link;
}
export function nextSubscriptionAction(record:{status:string;agreement_link:string|null;payment_link:string|null}){
 if(record.status==='withdrawn')return 'This subscription was withdrawn. Start a new subscription if you wish to invest.';
 if(record.status==='declined')return 'Read the administrator’s explanation and contact investor support if you need clarification.';
 if(paidStatus(record.status))return 'Payment is confirmed. Follow your accepted SAFE agreement for conversion; no shares are issued by this status.';
 if(record.payment_link)return record.agreement_link?'Your evidence is saved. An administrator must reconcile settlement before confirming receipt.':'Your evidence is saved. Complete the signed SAFE agreement while settlement is reviewed.';
 return record.agreement_link?'Add payment evidence when ready, or contact investor support for approved payment instructions.':'Complete the signed SAFE agreement with investor support. Payment can be made outside the Hub and evidence added later.';
}
