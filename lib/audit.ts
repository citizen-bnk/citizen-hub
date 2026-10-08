import 'server-only';
import {query} from './db';
import type {Person} from './contracts';
export async function audited<T=Record<string,unknown>>(statement:string,params:unknown[],person:Person,action:string,type:string,column:'id'|'resolution_id'|'meeting_id'='id'):Promise<T[]>{
 const start=params.length+1;
 return query<T>(`WITH changed AS (${statement}),logged AS (INSERT INTO hub_audit(actor_id,action,resource_type,resource_id,scope) SELECT $${start},$${start+1},$${start+2},changed.${column},$${start+3} FROM changed RETURNING id) SELECT * FROM changed`,[...params,person.id,action,type,person.scope]);
}
