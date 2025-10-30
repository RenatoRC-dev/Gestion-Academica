import axios from 'axios';

const RAW = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const BASE_URL = RAW.replace(/\/+$/, '');

// Cliente sin interceptores de auth/redirecciones
const publicApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 20000,
});

export default publicApi;

