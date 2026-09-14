import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null; info: ErrorInfo | null }

/**
 * App-level error boundary. Without this, any thrown error inside a
 * descendant component unmounts the whole React tree — which is exactly
 * why the NotificationBell realtime bug produced a blank white page
 * instead of a visible error.
 *
 * Renders a small recoverable card with a "Try again" button that resets
 * the boundary so the app can keep running.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log full context in the console for debugging; a real error-reporting
    // service can be wired in here later.
    console.error("[ErrorBoundary] caught:", error, info);
    this.setState({ error, info });
  }

  reset = () => this.setState({ error: null, info: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-mist px-gutter">
        <div className="card-lift w-full max-w-md rounded-card border border-line bg-background p-block text-center">
          <h1 className="mb-2 font-heading text-lg text-ink">
            Something went wrong
          </h1>
          <p className="mb-4 text-sm text-slate">
            A part of the page crashed. You can try again — your data is safe.
          </p>
          <pre className="mb-4 max-h-40 overflow-auto rounded-control border border-line bg-mist p-3 text-left text-[11px] leading-relaxed text-slate">
            {this.state.error.message}
          </pre>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="gradient-brand rounded-control px-4 py-2 text-sm text-primary-foreground hover:scale-hover"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="rounded-control border border-line px-4 py-2 text-sm text-ink hover:border-accent"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
