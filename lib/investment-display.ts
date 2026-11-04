export const investmentMoney=(amount:number|string,currency='LSL')=>new Intl.NumberFormat('en-ZA',{style:'currency',currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(amount));
export function paymentState(total:number,received:number,status:string){
 if(['withdrawn','declined'].includes(status))return 'closed';
 if(Math.round(received*100)>=Math.round(total*100))return 'paid';
 return received>0?'partial':'unpaid';
}
