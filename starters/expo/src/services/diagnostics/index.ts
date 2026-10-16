type Diagnostic = {
  operation: 'startup' | 'storage' | 'render' | 'appearance';
  code: 'unavailable' | 'invalid' | 'failed';
};
type Reporter = (event: Diagnostic) => void;
let reporter: Reporter | undefined;
// Integrate the selected reporting vendor here. No user content, URLs or error messages.
export function configureDiagnostics(next: Reporter) {
  reporter = next;
}
export function report(event: Diagnostic) {
  try {
    reporter?.(event);
  } catch {
    /* Reporting must never break recovery. */
  }
}
