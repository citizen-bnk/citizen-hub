export function subscriptionAmount(units:number,price:string){
 if(!Number.isSafeInteger(units)||units<1||!/^\d+(\.\d{1,2})?$/.test(price))throw Error('Invalid subscription amount');
 const [whole,fraction='']=price.split('.');const cents=(BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0')))*BigInt(units);
 return (cents/100n).toString()+'.'+(cents%100n).toString().padStart(2,'0');
}
