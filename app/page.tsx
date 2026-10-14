import { redirect } from "next/navigation";
import { currentPerson } from "@/lib/session";
import { ServiceIssue } from "@/lib/db";
import { Recovery } from "@/components/Recovery";
export const dynamic='force-dynamic';
export default async function Home(){let person;try{person=await currentPerson();}catch(error){if(error instanceof ServiceIssue)return <Recovery message={error.message} code={error.code}/>;throw error;}if(!person)redirect('/login');redirect('/ai');}
