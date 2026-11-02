import {NextResponse} from 'next/server';
import {opportunities,subscriptionRecords} from '@/lib/investments';
import {websitePerson} from '@/lib/website-identity';
import {failure} from '@/lib/http';
import {ServiceIssue} from '@/lib/db';

function allowedOrigin(request:Request){
 const origin=request.headers.get('origin');
 const configured=(process.env.INVESTMENT_WEBSITE_ORIGINS||'https://citizenbank.co.ls,https://www.citizenbank.co.ls').split(',').map(s=>s.trim());
 if(origin&&configured.includes(origin))return origin;
 if(process.env.NODE_ENV!=='production'&&origin&&/^http:\/\/localhost:\d+$/.test(origin))return origin;
 if(origin)throw new ServiceIssue('WEBSITE_ORIGIN_REJECTED','Open investments from the Citizen Bank website.',403);
 return null;
}
function cors(origin:string|null){return {'Cache-Control':'no-store','Vary':'Origin',...(origin?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, OPTIONS'}:{})};}
function websiteFailure(request:Request,error:unknown){const response=failure(error);try{const origin=allowedOrigin(request);for(const [name,value] of Object.entries(cors(origin)))response.headers.set(name,value);}catch{/* Do not grant CORS access to an unapproved origin. */}return response;}
export async function OPTIONS(request:Request){try{const origin=allowedOrigin(request);return new NextResponse(null,{status:204,headers:cors(origin)});}catch(error){return websiteFailure(request,error);}}
export async function GET(request:Request){try{
 const origin=allowedOrigin(request);
 const person=await websitePerson(request.headers.get('authorization'));
 const {offers}=await opportunities(person);
 const subscriptions=person?await subscriptionRecords(person):[];
 const records=subscriptions.map(r=>{const total=Number(r.units)*Number(r.unit_price),paid=Number(r.recorded_receipts||0);return {
  id:r.id,subscription_id:r.id,share_class:r.title,num_shares:r.units,total_amount:total,amount_paid:paid,
  amount_remaining:Math.max(0,total-paid),payment_status:paid>=total?'paid':paid>0?'partial':'unpaid',status:r.status,
  certificate_number:r.certificate_reference,certificate_url:r.certificate_preview_link,created_at:r.created_at,
  agreement_link:r.agreement_link,invoice_link:r.invoice_link,receipt_link:r.receipt_link,
 };});
 const summary={total_shares_owned:records.filter(r=>r.payment_status==='paid').reduce((n,r)=>n+r.num_shares,0),total_investment_amount:records.reduce((n,r)=>n+r.total_amount,0),active_subscriptions:records.length,pending_payments:records.reduce((n,r)=>n+r.amount_remaining,0),certificates_issued:records.filter(r=>r.certificate_number).length};
 return NextResponse.json({offers,summary,subscriptions:records,has_admin_created_subscriptions:false},{headers:cors(origin)});
 }catch(error){return websiteFailure(request,error);}}
