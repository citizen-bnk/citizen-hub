export const readinessManagers = ['back_office','admin','super_admin'];
export function managesReadiness(roles:readonly string[]) {return roles.some(role=>readinessManagers.includes(role));}
export function reviewsEvidence(roles:readonly string[]) {return managesReadiness(roles)||roles.includes('board_member')||roles.includes('regulatory_reviewer');}
export function verifiesReadiness(roles:readonly string[]) {return roles.some(role=>['back_office','admin','super_admin'].includes(role));}
export function mayVerify(roles:readonly string[],actor:string,submittedBy:string|null,status:string) {
 return verifiesReadiness(roles)&&status==='submitted'&&!!submittedBy&&actor!==submittedBy;
}
export function mayRetest(roles:readonly string[],actor:string,author:string,status:string) {
 return (actor===author)&&status==='fixed';
}
