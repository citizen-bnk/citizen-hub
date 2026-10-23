import {redirect} from "next/navigation";
import {currentPerson} from "@/lib/session";
import {ensureCustomerMembership} from "@/lib/customer-onboarding";
export const dynamic="force-dynamic";
export default async function MobileOnboarding(){
 const person=await currentPerson();
 if(!person)redirect("/login?service=app&next=%2Fmobile-onboarding");
 await ensureCustomerMembership(person);
 redirect("/api/platform/handoff?audience=app");
}
