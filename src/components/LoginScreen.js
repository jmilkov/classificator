'use client';

export default function LoginScreen({ loginValue, password, error, loading, onLoginChange, onPasswordChange, onSubmit, APP_VERSION }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-head">
          <h1 className="title">СПК коллектор сбора данных</h1>
          <p className="subtitle">Введите логин и пароль для входа в приложение</p>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-field">
            <label htmlFor="login">Логин</label>
            <input id="login" value={loginValue} onChange={(e) => onLoginChange(e.target.value)} autoComplete="username" />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Пароль</label>
            <input id="password" type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} autoComplete="current-password" />
          </div>
          {error ? <div className="error auth-error">{error}</div> : null}
          <button className="btn primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Проверка…' : 'Войти'}
          </button>
          {APP_VERSION && <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.75rem', opacity: 0.5 }}>{APP_VERSION}</div>}
        </form>
      </section>
    </main>
  );
}