'use client';

import { useEffect, useState } from 'react';
import { fetchMe } from '@/utils/api';

export default function Home() {
  const [userLogin, setUserLogin] = useState('');

  useEffect(() => {
    fetchMe()
      .then(payload => setUserLogin(payload.user?.login || ''))
      .catch(console.error);
  }, []);

  return (
    <div className="welcome-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: '20px' }}>
      <h1>Добро пожаловать в Classificator</h1>
      <p>Выберите нужный раздел в боковом меню.</p>
      {userLogin && <p style={{ marginTop: '12px', color: '#666' }}>Пользователь: {userLogin}</p>}
    </div>
  );
}
