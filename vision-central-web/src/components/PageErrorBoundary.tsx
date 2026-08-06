import React from 'react';

interface Props {
  children: React.ReactNode;
  resetKey: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class PageErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Erro desconhecido' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erro ao exibir página:', error, info);
  }

  componentDidUpdate(previousProps: Props) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, message: '' });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="rounded-xl border border-rose-500/30 bg-slate-900/70 p-6 text-center">
        <h2 className="text-lg font-bold text-white">Não foi possível abrir esta página</h2>
        <p className="mt-2 text-sm text-slate-400">Verifique a conexão e tente novamente. Seus dados não foram alterados.</p>
        <p className="mt-3 break-words rounded-lg bg-black/30 p-3 text-left font-mono text-xs text-rose-300">
          Código: {this.state.message}
        </p>
        <button
          type="button"
          onClick={() => this.setState({ hasError: false, message: '' })}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
}
