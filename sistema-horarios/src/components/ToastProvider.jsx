// src/components/ToastProvider.jsx
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastCtx = createContext({ push: () => { } });

export function useToast() {
    return useContext(ToastCtx);
}

export default function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const push = useCallback((message, type = 'info', ttl = 3500) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), ttl);
    }, []);

    const value = useMemo(() => ({ push }), [push]);

    return (
        <ToastCtx.Provider value={value}>
            {children}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={
                            'px-4 py-2 rounded shadow text-sm ' +
                            (t.type === 'success'
                                ? 'bg-green-600 text-white'
                                : t.type === 'error'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-800 text-white')
                        }
                    >
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastCtx.Provider>
    );
}