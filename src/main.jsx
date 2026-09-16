import React from 'react';
import { createRoot } from 'react-dom/client';
import './telegramStorage.js'; // подкладывает window.storage ДО того, как App его спросит
import LifeRPG from './App.jsx';

if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand(); // разворачиваем на весь экран
}

createRoot(document.getElementById('root')).render(<LifeRPG />);
