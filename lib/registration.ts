import {z} from "zod";
import {safeReturn} from "./contracts";

export const registrationInput=z.object({
  firstName:z.string().trim().min(1).max(100),
  lastName:z.string().trim().min(1).max(100),
  email:z.string().trim().email().max(254).transform(value=>value.toLowerCase()),
  password:z.string().min(10).max(128).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/,"Use at least 10 characters, including a letter and a number."),
  phone:z.string().trim().max(30).optional().transform(value=>value||undefined),
  service:z.enum(["banking","app"]).optional(),
  next:z.string().optional()
}).strict();

export function registrationDestination(service:"banking"|"app"|undefined,next:string|undefined):string{
  if(service==="banking"||service==="app")return `/api/platform/handoff?audience=${service}`;
  return safeReturn(next);
}
