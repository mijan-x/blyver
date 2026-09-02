import { Component, type ReactNode } from 'react'
type State = { failed: boolean }
class ErrorBoundary extends Component<{ children: ReactNode }, State> { state: State = { failed: false }; static getDerivedStateFromError() { return { failed: true } }; componentDidCatch() {} render() { if (this.state.failed) return <main className="grid min-h-screen place-items-center bg-blyver-ivory px-6 text-center text-blyver-ink"><div><p className="text-[11px] tracking-[0.2em] text-blyver-champagne">BLYVER</p><h1 className="mt-5 font-serif text-4xl">Something needs a moment.</h1><button onClick={() => window.location.reload()} className="mt-7 border border-blyver-ink px-5 py-3 text-[11px] tracking-[0.16em]">REFRESH PAGE</button></div></main>; return this.props.children } }
export default ErrorBoundary
