export type ServiceResult<T, Code extends string> =
  | { ok: true; data: T }
  | { ok: false; code: Code; retryable: boolean };
export type CapabilityState = 'unsupported' | 'unconfigured' | 'undetermined' | 'denied' | 'ready' | 'pending' | 'failed';
export type DataInventory<Name extends string> = Record<Name, {
  sensitivity: 'public' | 'private' | 'sensitive';
  authority: 'device' | 'server';
  retention: string;
  deletionScope: string;
}>;
