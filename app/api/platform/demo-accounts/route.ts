import { NextResponse } from "next/server";
import { accountCatalog } from "@/lib/contracts";
export async function GET(){return NextResponse.json({accounts:process.env.DEMO_MODE==="true"?accountCatalog.map(account=>({...account,email:`${account.key}@demo.citizenbank.test` })):[]},{headers:{"Cache-Control":"no-store"}});}
