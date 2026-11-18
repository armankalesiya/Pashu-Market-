import React from 'react';
import { ErrorState } from './ErrorState';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    let readable = error.message;
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && parsed.error) readable = parsed.error;
    } catch {
      // keep raw message
    }
    return { hasError: true, message: readable };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            <ErrorState
              title="Application Error"
              message={this.state.message || 'An unexpected error occurred.'}
              onRetry={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              retryLabel="Reload App"
            />
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
