import {z} from 'zod';
export const subscriptionInput=z.object({request_key:z.string().uuid(),opportunity_id:z.string().uuid(),version:z.number().int().positive(),units:z.number().int().positive().max(1000000),source_of_funds:z.string().trim().min(3).max(2000),purpose:z.string().trim().min(3).max(2000),consent:z.literal(true)}).strict();
export function subscriptionAmount(units:number,price:string){
 if(!Number.isSafeInteger(units)||units<1||!/^\d+(\.\d{1,2})?$/.test(price))throw Error('Invalid subscription amount');
 const [whole,fraction='']=price.split('.');const cents=(BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0')))*BigInt(units);
 return (cents/100n).toString()+'.'+(cents%100n).toString().padStart(2,'0');
}
