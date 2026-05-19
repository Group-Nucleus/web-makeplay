'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
            <p className="mb-2 text-lg font-bold text-white">Algo correu mal</p>
            <p className="mb-6 text-sm text-muted">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="rounded-lg bg-lime px-6 py-2.5 text-sm font-bold text-black">
              Tentar novamente
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
