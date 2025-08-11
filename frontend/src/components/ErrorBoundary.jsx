import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Se produjo un error en la aplicación</h2>
            <p className="text-sm text-gray-700 mb-4">Recarga la página. Si persiste, comparte este detalle:</p>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
{(this.state.error && this.state.error.toString()) || 'Error'}
{this.state.errorInfo ? '\n' + this.state.errorInfo.componentStack : ''}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


