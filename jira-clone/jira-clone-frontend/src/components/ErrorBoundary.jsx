import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("ErrorBoundary caught an error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', backgroundColor: '#ffebe6', color: '#bf2600', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1>Lỗi Giao Diện Bất Ngờ (Crash)</h1>
          <p>Xin hãy sao chép dòng lỗi dưới đây và báo lại cho AI để sửa chữa:</p>
          <hr />
          <h3>Chi tiết Lỗi:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#fff', padding: '12px', border: '1px solid #bf2600' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <h3>Stack Trace:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#fff', padding: '12px', border: '1px solid #bf2600' }}>
            {this.state.info && this.state.info.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
