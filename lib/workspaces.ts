import {modules,can,type Role} from './contracts';
export const workspaces=[
 {id:'invest',label:'Invest',icon:'investors',modules:['opportunities','investors','administration'],extras:[{label:'Cap table',path:'/cap-table',roles:['admin']},{label:'Review subscriptions',path:'/subscriptions',roles:['admin']},{label:'Investment data room',path:'/dataroom',roles:['investor','shareholder','customer','admin']}]},
 {id:'governance',label:'Governance',icon:'board',modules:['board','appointments'],extras:[]},
 {id:'careers',label:'Careers',icon:'careers',modules:['careers','recruitment'],extras:[{label:'My applications',path:'/applications',roles:['candidate','customer','investor','shareholder','board_member','staff','back_office','admin','regulatory_reviewer']} ]},
 {id:'business',label:'Business',icon:'executive',modules:['executive','projects','licensing','review','finance','risk','people'],extras:[]},
 {id:'documents',label:'Documents',icon:'documents',modules:['documents'],extras:[]},
 {id:'administration',label:'Administration',icon:'settings',modules:['users'],extras:[{label:'Platform connections',path:'/integrations',roles:['admin']},{label:'Card recovery',path:'/cards',roles:['admin']}]}
] as const;
export type WorkspaceId=typeof workspaces[number]['id'];
export function workspaceCards(id:string,roles:readonly string[]){const w=workspaces.find(w=>w.id===id);if(!w)return [];return [...modules.filter(m=>(w.modules as readonly string[]).includes(m.id)&&can(roles,m.roles)).map(m=>({label:m.id==='administration'?'Manage investors & shareholders':m.id==='careers'?'Vacancies':m.id==='investors'?'My investment portfolio':m.label,path:m.path||'/'+m.id,description:m.description,comingSoon:!!m.comingSoon})),...w.extras.filter(e=>can(roles,e.roles as readonly Role[])).map(e=>({...e,description:'',comingSoon:false}))];}
export function workspaceFor(module:string){return workspaces.find(w=>(w.modules as readonly string[]).includes(module))?.id||'';}

