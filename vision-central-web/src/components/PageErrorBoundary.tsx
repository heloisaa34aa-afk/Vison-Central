import React from 'react';

interface Props {
  children: React.ReactNode;
  resetKey: string;
}

interface State {
  hasError: boolean;
}

export default class PageErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erro ao exibir página:', error, info);
  }

  componentDidUpdate(previousProps: Props) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="rounded-xl border border-rose-500/30 bg-slate-900/70 p-6 text-center">
        <h2 className="text-lg font-bold text-white">Não foi possível abrir esta página</h2>
        <p className="mt-2 text-sm text-slate-400">Verifique a conexão e tente novamente. Seus dados não foram alterados.</p>
        <button
          type="button"
          onClick={() => this.setState({ hasError: false })}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
}
