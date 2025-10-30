import React from 'react';
import ReactDOM from 'react-dom/client';
// BrowserRouter import removed
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { Provider } from 'react-redux';
import store from './store/store.js';
import ToastProvider from './components/ToastProvider.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  // Quitamos StrictMode en dev para evitar dobles efectos y mejorar fluidez
  <Provider store={store}>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </Provider>
);
