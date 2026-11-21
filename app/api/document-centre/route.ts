import {requirePerson} from '@/lib/session';
import {requireOrigin,failure} from '@/lib/http';
import {documentAction} from '@/lib/document-actions';
export const maxDuration=120;
export async function POST(request:Request){try{requireOrigin(request);return documentAction(request,await requirePerson());}catch(e){return failure(e);}}
