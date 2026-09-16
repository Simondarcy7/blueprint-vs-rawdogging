/** App-owned runtime parsing is mandatory. This codec never trusts a TypeScript cast. */
export function createBackupCodec<T>({ appId, schemaVersion, maxBytes, parseSnapshot }: {
  appId: string; schemaVersion: number; maxBytes: number; parseSnapshot(value: unknown): T;
}) {
  if (!appId || !Number.isInteger(schemaVersion) || schemaVersion < 1 || !Number.isInteger(maxBytes) || maxBytes < 1) throw new Error('Invalid backup configuration');
  function checkSize(raw: string) {
    if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new Error('Backup exceeds the configured size limit');
  }
  return {
    encode(snapshot: T) {
      const raw = JSON.stringify({ format: 'app-backup', appId, schemaVersion, snapshot: parseSnapshot(snapshot) });
      checkSize(raw);
      return raw;
    },
    decode(raw: string): T {
      checkSize(raw);
      const envelope: unknown = JSON.parse(raw);
      if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)
        || !('format' in envelope) || envelope.format !== 'app-backup'
        || !('appId' in envelope) || envelope.appId !== appId
        || !('schemaVersion' in envelope) || envelope.schemaVersion !== schemaVersion
        || !('snapshot' in envelope)) throw new Error('Unsupported backup');
      return parseSnapshot(envelope.snapshot);
    },
  };
}

/** The host transaction must replace all records atomically, or provide its own durable journal. */
export async function restoreBackup<T>(raw: string, decode: (raw: string) => T, replaceAtomically: (snapshot: T) => Promise<void>) {
  const snapshot = decode(raw);
  await replaceAtomically(snapshot);
}
