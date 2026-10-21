"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorFallback } from "./error-fallback";

type Props = { children: ReactNode; name: string; fallback?: ReactNode };
type State = { error: Error | null };

class Boundary extends Component<Props & { onReset: () => void }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.name}]`, error, info.componentStack);
  }

  reset = () => {
    this.props.onReset();
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return this.props.fallback ?? <ErrorFallback compact title={`Couldn't load ${this.props.name}`} onRetry={this.reset} />;
  }
}

/**
 * Error Boundary baroi har widget (Spec 10 §7.1): xatoi Stories yo Suggestions
 * tamomi sahifaro nameshikanad. "Try again" query-hoi xatodorro az nav mefiristad.
 */
export function WidgetBoundary(props: Props) {
  return <QueryErrorResetBoundary>{({ reset }) => <Boundary {...props} onReset={reset} />}</QueryErrorResetBoundary>;
}
