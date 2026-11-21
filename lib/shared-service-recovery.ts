/** Only propagate known public service issues; never expose upstream error text. */
export function sharedServiceRecovery(value: unknown) {
  const code = value && typeof value === 'object' && 'code' in value ? value.code : undefined;
  if (code === 'DATA_QUOTA_EXHAUSTED') return {
    code,
    message: 'Some services are temporarily unavailable. Please return later. You can still browse the Citizen Bank website.',
  };
  if (code === 'DATA_CAPACITY_UNAVAILABLE') return {
    code,
    message: 'Some services are temporarily unavailable. Please return later.',
  };
  return undefined;
}
