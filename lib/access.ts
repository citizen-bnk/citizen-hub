import {modules,can,type Person,type ModuleId} from './contracts';
export function moduleAccess(roles:readonly string[],id:ModuleId){const module=modules.find(m=>m.id===id);return !!module&&can(roles,module.roles);}
export function requiredAccess(id:ModuleId){return modules.find(m=>m.id===id)?.roles.map(r=>r.replaceAll('_',' ')).join(' or ')||'assigned';}

export function pathAccess(roles:readonly string[],path:string){if(!path.startsWith('/')||path.startsWith('//'))return false;const segment=path.split(/[/?#]/)[1];if(!segment)return true;if(segment==='api')return path.startsWith('/api/platform/handoff')&&roles.includes('customer');if(segment==='dataroom')return true;const aliases:Record<string,ModuleId>={'document-centre':'documents',messages:'communications',subscriptions:'investors','corporate-history':'administration',cards:'administration'};return moduleAccess(roles,aliases[segment]||segment as ModuleId);}
