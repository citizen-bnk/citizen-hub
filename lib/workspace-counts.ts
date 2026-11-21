import 'server-only';import {query} from './db';import {type Person} from './contracts';
export async function workspaceCount(path:string,p:Person){const scope=p.scope;const sql:Record<string,[string,unknown[]]>={
 '/opportunities':["SELECT count(*)::int AS n FROM hub_opportunities WHERE scope=$1 AND status='open'",[scope]],
 '/users':['SELECT count(*)::int AS n FROM hub_people WHERE scope=$1 AND active',[scope]],
 '/recruitment':['SELECT count(*)::int AS n FROM hub_job_applications WHERE scope=$1',[scope]],
 '/careers':["SELECT count(*)::int AS n FROM hub_vacancies WHERE scope=$1 AND status='open' AND closes_at>now()",[scope]],
 '/finance':["SELECT count(*)::int AS n FROM hub_operational_records WHERE scope=$1 AND kind='finance'",[scope]],
 '/risk':["SELECT count(*)::int AS n FROM hub_operational_records WHERE scope=$1 AND kind='risk'",[scope]]};
 const selected=sql[path];if(!selected)return null;const [row]=await query<{n:number}>(selected[0],selected[1]);return row.n;}
