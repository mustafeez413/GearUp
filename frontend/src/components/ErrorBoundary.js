'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error,
            errorInfo
        });
        console.error('Error Boundary caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ 
            hasError: false, 
            error: null,
            errorInfo: null 
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/95 backdrop-blur-sm p-4 overflow-auto">
                    <div className="w-full min-w-[280px] max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 text-center m-auto shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0">
                            <AlertCircle size={36} className="text-red-500" />
                        </div>
                        <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter mb-3">
                            Something Went Wrong
                        </h1>
                        <p className="font-body text-slate-600 text-sm mb-4">
                            We encountered an unexpected error. Please try again.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left mt-4 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 max-h-[200px] overflow-auto">
                                <summary className="font-bold cursor-pointer mb-2">Error Details</summary>
                                <pre className="whitespace-pre-wrap break-words mt-2 font-mono text-[10px]">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="mt-6 w-full px-6 py-4 bg-slate-900 text-white rounded-xl font-body font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={16} /> Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
