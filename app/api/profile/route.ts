import {NextResponse} from 'next/server';
import {requirePerson} from '@/lib/session';
import {updateProfile} from '@/lib/profile';
import {requireOrigin,failure} from '@/lib/http';
export async function GET(){try{return NextResponse.json({person:await requirePerson()},{headers:{'Cache-Control':'no-store'}});}catch(error){return failure(error);}}
export async function PATCH(request:Request){try{requireOrigin(request);await updateProfile(await requirePerson(),await request.json());return NextResponse.json({ok:true});}catch(error){return failure(error);}}
