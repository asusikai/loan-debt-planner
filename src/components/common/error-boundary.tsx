"use client";

import type { ReactNode } from "react";
import { Component } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[ErrorBoundary]", error);
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="error-fallback" role="alert">
          <h2>오류가 발생했습니다</h2>
          <p>일시적인 문제일 수 있습니다. 다시 시도해 주세요.</p>
          <button type="button" onClick={this.reset}>
            다시 시도
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
