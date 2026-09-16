import { Component, type ReactNode } from 'react';
import { AppState } from './AppState';
import { baselinePalettes } from '../../theme/baseline';

type Props = { children: ReactNode; onRecover?: () => void | Promise<void>; report?: (category: 'render-failure') => void };
/** Mount above storage/account/theme providers. No raw exception payload leaves this boundary. */
export class RecoveryBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {
    try { this.props.report?.('render-failure'); } catch { /* Diagnostics must not break recovery. */ }
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <AppState title="Something went wrong" message="Try reopening this screen. If the problem continues, contact support."
      palette={baselinePalettes.light} action={{ label: 'Try again', run: async () => {
        await this.props.onRecover?.();
        this.setState({ failed: false });
      } }} />;
  }
}
