import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-rose-500/40 backdrop-blur-xl shadow-2xl space-y-5 my-6 text-slate-200">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400 text-xl font-mono">
              ⚠️
            </span>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {this.props.fallbackTitle || 'Something went wrong rendering this view'}
              </h3>
              <p className="text-xs text-rose-400/90 font-mono mt-0.5">
                {this.state.error?.message || 'Unexpected application error'}
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            A temporary component error was intercepted. The page prevented a blank screen crash. You can safely return to the home screen or reload this view.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer"
            >
              Return to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-xs transition-all cursor-pointer"
            >
              Reload Page
            </button>
          </div>

          {this.state.error && (
            <details className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
              <summary className="cursor-pointer hover:text-slate-300 transition-colors">
                Technical Error Details
              </summary>
              <pre className="mt-2 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-rose-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                {this.state.error.stack || this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
