import { z } from 'zod';
import { failure, requireOrigin } from '@/lib/http';
import { requirePerson } from '@/lib/session';
import { institutionalRequest } from '@/lib/institutional-operations';

const requestSchema = z.object({
  operation: z.enum(['investment.list','investment.subscribe','investment.payment','investment.update',
    'cap_table.list','board.list','board.candidates','board.appoint','board.update']),
  data: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const person = await requirePerson();
    const input = requestSchema.parse(await request.json());
    const result = await institutionalRequest(person, input.operation, input.data);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return failure(error);
  }
}
