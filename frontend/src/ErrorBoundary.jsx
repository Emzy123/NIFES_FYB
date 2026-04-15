import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { err: null };

  static getDerivedStateFromError(err) {
    return { err };
  }

  render() {
    if (this.state.err) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: "2rem",
            fontFamily: "system-ui,sans-serif",
            background: "#0a192f",
            color: "#f5f5f5",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Something went wrong</h1>
          <p style={{ opacity: 0.85, marginBottom: "1rem" }}>
            The app hit a JavaScript error. Open DevTools (F12) → Console for details, or try a hard refresh (Ctrl+Shift+R).
          </p>
          <pre
            style={{
              fontSize: "0.8rem",
              overflow: "auto",
              padding: "1rem",
              background: "#0008",
              borderRadius: "8px",
              color: "#ffb4b4",
            }}
          >
            {String(this.state.err?.message || this.state.err)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
