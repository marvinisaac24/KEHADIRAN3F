import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#f8d7da', color: '#721c24', borderRadius: 8, margin: 20 }}>
          <h2 style={{ marginTop: 0 }}>Ralat Sistem Dikesan</h2>
          <p>Sila muat semula halaman ini atau hubungi pentadbir.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>
            <summary>Butiran Ralat</summary>
            <br />
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

