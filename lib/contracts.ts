export type Role = "customer"|"investor"|"shareholder"|"board_member"|"staff"|"back_office"|"admin"|"super_admin"|"candidate"|"regulatory_reviewer";
export type Scope = "live"|"demonstration";
export type Person = {id:string;provider_subject:string;email:string;display_name:string;phone:string|null;country:string|null;occupation:string|null;bio:string|null;version:number;scope:Scope;roles:Role[];account_key:string|null;street_address?:string;city?:string;employer?:string;role_profiles?:Record<string,Record<string,string>>};
export type ModuleId = "executive"|"board"|"investors"|"licensing"|"review"|"documents"|"finance"|"projects"|"people"|"risk"|"communications"|"ai"|"settings"|"profile"|"administration"|"careers"|"recruitment"|"appointments"|"opportunities"|"users";
export const modules: {id:ModuleId;label:string;description:string;roles:Role[];comingSoon?:boolean;path?:string}[] = [
 {id:"opportunities",label:"Invest opportunities",description:"Published investment offers and terms.",roles:["candidate","customer","investor","shareholder","board_member","staff","back_office","admin","regulatory_reviewer"]},
 {id:"users",label:"User access",description:"Profile, role and credential administration.",roles:["admin"]},
 {id:"administration",label:"Administration",description:"Shareholders, subscribers and corporate record reconciliation.",roles:["admin"]},
 {id:"appointments",label:"Appointments",description:"Corporate nominations, evidence, corrections and independent approval.",roles:["admin"]},
 {id:"ai",label:"Citizen AI",description:"Your shared Citizen assistant for investments, careers and workspace guidance.",roles:["candidate","customer","investor","shareholder","board_member","staff","back_office","admin","regulatory_reviewer"]},
 {id:"careers",label:"Careers",description:"Explore positions and manage your private applications.",roles:["candidate","customer","investor","shareholder","board_member","staff","back_office","admin","regulatory_reviewer"]},
 {id:"recruitment",label:"Recruitment",description:"Admin vacancy, application and appointment management.",roles:["admin"]},
 {id:"executive",label:"Executive",description:"Your institutional overview, capital progress and priorities.",roles:["staff","back_office","admin","board_member"]},
 {id:"board",label:"Board",description:"Governance. Oversight. Strategic direction.",roles:["board_member","admin"]},
 {id:"investors",label:"Investors",description:"Your investment, ownership records and institutional updates.",roles:["investor","shareholder","admin"]},
 {id:"licensing",label:"Licensing",description:"Requirements, regulatory evidence and readiness.",roles:["board_member","back_office","admin","regulatory_reviewer"]},
 {id:"review",label:"Testing & Review",description:"Released evidence, testing scenarios and findings.",roles:["board_member","back_office","admin","regulatory_reviewer"]},
 {id:"finance",label:"Finance",description:"Budget plans, recorded actuals and independent evidence review.",roles:["back_office","admin"],comingSoon:false},
 {id:"risk",label:"Risk & Compliance",description:"Risk ownership, controls and evidence review.",roles:["board_member","back_office","admin"],comingSoon:false},
 {id:"people",label:"People & Ownership",description:"Appointments, organisational directory and linked recruitment.",roles:["staff","back_office","admin"],comingSoon:false},
 {id:"projects",label:"Projects",description:"Published milestones shared with your audience.",roles:["investor","shareholder","board_member","staff","back_office","admin","regulatory_reviewer"]},
 {id:"documents",label:"Documents",description:"Your own documents and explicitly shared Google Drive files.",path:"/document-centre",roles:["candidate","customer","investor","shareholder","board_member","staff","back_office","admin","regulatory_reviewer"]},
 {id:"communications",label:"Communications",description:"Your institutional updates and notifications.",path:"/messages",roles:["candidate","customer","investor","shareholder","board_member","staff","back_office","admin","regulatory_reviewer"]},
 {id:"settings",label:"Settings",description:"Preferences, security and workspace integrations.",roles:["candidate","customer","investor","shareholder","board_member","staff","back_office","admin","regulatory_reviewer"]},
 {id:"profile",label:"Profile",description:"One Citizen identity with role-specific information.",roles:["candidate","customer","investor","shareholder","board_member","staff","back_office","admin","regulatory_reviewer"]},
];
export const can = (roles: readonly string[],wanted:readonly string[]) => roles.includes("super_admin")||roles.some(role=>wanted.includes(role));
export const registrationRole=(next:string|undefined):'candidate'|'investor'|'customer'=>/^\/banking-onboarding(?:[/?#]|$)/.test(safeReturn(next))?'customer':/^\/careers(?:[/?#]|$)/.test(safeReturn(next))?'candidate':'investor';
export const canVote = (roles:readonly string[])=>roles.includes('board_member');
export function safeReturn(value:string|null|undefined):string { return value && value.startsWith("/")&&!value.startsWith("//")&&!/[\\\u0000-\u001f\u007f]/.test(value)?value:"/"; }
export function driveReference(raw:string):{url:string;fileId:string} {
 const url=new URL(raw);
 if(url.protocol!=="https:"||url.username||url.password||url.port)throw new Error("Use a Google Drive shared link.");
 const match=url.hostname==="drive.google.com"?url.pathname.match(/^\/file\/d\/([\w-]+)(?:\/|$)/):url.hostname==="docs.google.com"?url.pathname.match(/^\/(?:document|spreadsheets|presentation)\/d\/([\w-]+)(?:\/|$)/):null;
 const id=match?.[1]||(url.hostname==="drive.google.com"&&["/open","/uc"].includes(url.pathname)?url.searchParams.get("id"):null);
 if(!id||!/^[-\w]{10,200}$/.test(id))throw new Error("Use a Google Drive file shared link, not a folder or another website.");
 const canonical=new URL(url.hostname==="docs.google.com"?`https://docs.google.com${url.pathname.split('/').slice(0,4).join('/')}/edit`:`https://drive.google.com/file/d/${id}/view`);
 const resourceKey=url.searchParams.get('resourcekey');if(resourceKey){if(!/^[-\w]{1,200}$/.test(resourceKey))throw new Error('Invalid Drive resource key.');canonical.searchParams.set('resourcekey',resourceKey);}
 return {fileId:id,url:canonical.href};
}
export const accountCatalog = [
 {key:"customer",description:"Banking customer",roles:["customer"]},
 {key:"investor",description:"Investor self-service",roles:["investor"]},
 {key:"shareholder",description:"Shareholder and investor",roles:["investor","shareholder"]},
 {key:"board",description:"Board governance and investments",roles:["board_member","investor"]},
 {key:"staff",description:"Back office and institutional operations",roles:["staff","back_office"]},
 {key:"admin",description:"Administration and all workspaces",roles:["admin","super_admin"]},
 {key:"combined",description:"Customer, investor, shareholder and board member",roles:["customer","investor","shareholder","board_member"]},
] as const;
