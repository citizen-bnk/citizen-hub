/** Only propagate known public service issues; never expose upstream error text. */
export function sharedServiceRecovery(value: unknown) {
  const code = value && typeof value === 'object' && 'code' in value ? value.code : undefined;
  if (code === 'DATA_QUOTA_EXHAUSTED') return {
    code,
    message: 'The shared database allowance is exhausted. Your records remain stored. Please return later; repeated attempts will not restore access.',
  };
  if (code === 'DATA_CAPACITY_UNAVAILABLE') return {
    code,
    message: 'The shared data service is temporarily at capacity. Please return later.',
  };
  return undefined;
}
