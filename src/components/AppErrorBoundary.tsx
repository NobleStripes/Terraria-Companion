import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Terraria Companion app error boundary caught an error:', error, info)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="min-h-screen bg-terra-bg px-4 py-10">
        <div className="mx-auto max-w-xl rounded-xl border border-terra-border bg-terra-surface p-6">
          <p className="font-pixel text-xs text-terra-red">Something broke in the companion.</p>
          <p className="mt-3 text-sm text-gray-300 leading-relaxed">
            Your saved progress is still in local storage. You can retry the render or reload the app.
          </p>
          {this.state.errorMessage ? (
            <p className="mt-3 rounded border border-terra-border bg-terra-bg px-3 py-2 text-xs text-gray-400">
              {this.state.errorMessage}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded border border-terra-border px-3 py-2 text-xs text-gray-300 transition-colors hover:border-terra-gold hover:text-white"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded border border-terra-gold px-3 py-2 text-xs text-terra-gold transition-colors hover:bg-terra-panel"
            >
              Reload App
            </button>
          </div>
        </div>
      </div>
    )
  }
}
