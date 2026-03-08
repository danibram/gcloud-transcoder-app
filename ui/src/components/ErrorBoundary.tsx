import { Component, JSX, ErrorBoundary as SolidErrorBoundary } from 'solid-js';
import { AlertCircleIcon } from './Icons';

interface ErrorBoundaryProps {
    children: JSX.Element;
}

const ErrorFallback: Component<{ error: Error; reset: () => void }> = (props) => {
    return (
        <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
                <AlertCircleIcon class="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 class="text-xl font-semibold text-gray-900 mb-2">
                    Something went wrong
                </h1>
                <p class="text-gray-600 mb-4">
                    An unexpected error occurred in the application.
                </p>
                <details class="text-left mb-4">
                    <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                        Error details
                    </summary>
                    <pre class="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-800 overflow-auto">
                        {props.error.message}
                        {props.error.stack}
                    </pre>
                </details>
                <button
                    onClick={props.reset}
                    class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
};

const ErrorBoundary: Component<ErrorBoundaryProps> = (props) => {
    return (
        <SolidErrorBoundary fallback={ErrorFallback}>
            {props.children}
        </SolidErrorBoundary>
    );
};

export default ErrorBoundary;

