'use client';

import { useState } from 'react';

export default function UsersManagement({
  currentUser,
  users,
  groups,
  mediaTypes,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  loading: parentLoading
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Состояния для модального окна создания/редактирования
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null); // null для создания, user object для редактирования
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [groupId, setGroupId] = useState('');
  const [callMediaTypeId, setCallMediaTypeId] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const openCreateModal = () => {
    setEditUser(null);
    setUsername('');
    setPassword('');
    setRole('user');
    setGroupId('');
    setCallMediaTypeId('');
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setUsername(user.username);
    setPassword(''); // пароль оставляем пустым, если не меняем
    setRole(user.role || 'user');
    setGroupId(user.group_id || '');
    setCallMediaTypeId(user.call_media_type_id || '');
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editUser) {
        // Редактирование
        const updateData = { 
          username, 
          role, 
          groupId: groupId || null,
          callMediaTypeId: callMediaTypeId ? parseInt(callMediaTypeId, 10) : null 
        };
        if (password) {
          updateData.password = password;
        }
        await onUpdate(editUser.id, updateData);
        setSuccess('Пользователь успешно обновлен');
      } else {
        // Создание
        if (!password) {
          throw new Error('Пароль обязателен для нового пользователя');
        }
        await onCreate({ 
          username, 
          password, 
          role, 
          groupId: groupId || null,
          callMediaTypeId: callMediaTypeId ? parseInt(callMediaTypeId, 10) : null 
        });
        setSuccess('Пользователь успешно создан');
      }
      setShowModal(false);
      onRefresh();
    } catch (err) {
      setError(err.message || 'Произошла ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, userToDeleteName) => {
    if (!isAdmin) return;
    if (userToDeleteName === currentUser?.login) {
      setError('Вы не можете удалить свою собственную учетную запись');
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить пользователя ${userToDeleteName}?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await onDelete(userId);
      setSuccess('Пользователь успешно удален');
      onRefresh();
    } catch (err) {
      setError(err.message || 'Произошла ошибка при удалении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-main">
      <header className="header">
        <div>
          <h1 className="title">👥 Пользователи</h1>
          <p className="subtitle">Управление учетными записями и правами доступа</p>
        </div>
        <div className="header-actions" style={{ marginLeft: 'auto' }}>
          <button className="btn primary" onClick={onRefresh} disabled={parentLoading || loading}>Обновить список</button>
          {isAdmin && (
            <button className="btn primary" onClick={openCreateModal} disabled={parentLoading || loading}>
              Создать пользователя
            </button>
          )}
        </div>
      </header>

      {error && <div className="error">{error}</div>}
      {success && <div className="success" style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '16px' }}>{success}</div>}

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Имя пользователя</th>
                <th>Роль</th>
                <th>Закрепленная группа</th>
                <th>Тип оповещения</th>
                <th>Дата создания</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const groupObj = groups && groups.find(g => String(g.groupid) === String(user.group_id));
                const groupName = groupObj ? `${user.group_id} — ${groupObj.name}` : (user.group_id || 'Все группы');
                
                const mediaTypeObj = mediaTypes && mediaTypes.find(m => m.id === user.call_media_type_id);
                const mediaTypeName = mediaTypeObj ? `${mediaTypeObj.name} (ID: ${mediaTypeObj.media_type_id})` : 'Не привязан';

                return (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 500 }}>
                      {user.username} {user.username === currentUser?.login && <span style={{ opacity: 0.5, fontSize: '0.85em', fontWeight: 'normal' }}>(Вы)</span>}
                    </td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'role-admin' : 'role-user'}`} style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: user.role === 'admin' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                        color: user.role === 'admin' ? '#d97706' : '#4b5563'
                      }}>
                        {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '14px', color: user.group_id ? '#1f2937' : '#9ca3af' }}>
                        {groupName}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '14px', color: user.call_media_type_id ? '#1f2937' : '#9ca3af' }}>
                        {mediaTypeName}
                      </span>
                    </td>
                    <td>
                      {user.created_at ? new Date(user.created_at).toLocaleString('ru-RU') : '—'}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn ghost"
                          onClick={() => openEditModal(user)}
                          disabled={parentLoading || loading}
                          style={{ marginRight: '8px' }}
                        >
                          Редактировать
                        </button>
                        <button
                          className="btn ghost"
                          onClick={() => handleDelete(user.id, user.username)}
                          disabled={parentLoading || loading || user.username === currentUser?.login}
                          style={{ color: user.username === currentUser?.login ? 'inherit' : '#ef4444' }}
                        >
                          Удалить
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {users.length === 0 && !parentLoading && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', opacity: 0.5, padding: '24px' }}>
                    Нет пользователей
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно создания/редактирования */}
      {showModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="modal-content" style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '450px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            color: '#1f2937'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              {editUser ? `Редактирование пользователя: ${editUser.username}` : 'Создание нового пользователя'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="filter-field" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>Имя пользователя *</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required
                  placeholder="Введите имя пользователя"
                  disabled={loading}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>

              <div className="filter-field" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                  Пароль {editUser && <span style={{ fontWeight: 'normal', opacity: 0.6 }}>(оставьте пустым для сохранения текущего)</span>} {!editUser && '*'}
                </label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required={!editUser}
                  placeholder={editUser ? "Новый пароль" : "Введите пароль"}
                  disabled={loading}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>

              <div className="filter-field" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>Роль *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading || (editUser && editUser.username === currentUser?.login)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff' }}
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
                  {editUser && editUser.username === currentUser?.login && (
                  <span style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Вы не можете изменить свою собственную роль.</span>
                )}
              </div>

              <div className="filter-field" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>Закрепленная группа</label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  disabled={loading}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff' }}
                >
                  <option value="">Все группы</option>
                  {groups && groups.map((group) => (
                    <option key={group.groupid} value={group.groupid}>
                      {group.groupid} — {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>Тип оповещения</label>
                <select
                  value={callMediaTypeId}
                  onChange={(e) => setCallMediaTypeId(e.target.value)}
                  disabled={loading}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff' }}
                >
                  <option value="">Не привязан</option>
                  {mediaTypes && mediaTypes.map((mediaType) => (
                    <option key={mediaType.id} value={mediaType.id}>
                      {mediaType.name} (ID: {mediaType.media_type_id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn ghost" onClick={() => setShowModal(false)} disabled={loading}>
                  Отмена
                </button>
                <button type="submit" className="btn primary" disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
