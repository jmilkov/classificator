'use client';

import { useState } from 'react';

export default function CallMediaTypesManagement({
  currentUser,
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
  const [editMediaType, setEditMediaType] = useState(null); // null для создания, media type object для редактирования
  const [name, setName] = useState('');
  const [mediaTypeId, setMediaTypeId] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const openCreateModal = () => {
    setEditMediaType(null);
    setName('');
    setMediaTypeId('');
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (mediaType) => {
    setEditMediaType(mediaType);
    setName(mediaType.name);
    setMediaTypeId(mediaType.media_type_id);
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
      if (editMediaType) {
        // Редактирование
        await onUpdate(editMediaType.id, { name, media_type_id: mediaTypeId });
        setSuccess('Тип оповещения успешно обновлен');
      } else {
        // Создание
        if (!name) {
          throw new Error('Название обязательно');
        }
        if (!mediaTypeId) {
          throw new Error('Идентификатор типа оповещения (CALL_MEDIA_TYPE_ID) обязателен');
        }
        await onCreate({ name, media_type_id: mediaTypeId });
        setSuccess('Тип оповещения успешно создан');
      }
      setShowModal(false);
      onRefresh();
    } catch (err) {
      setError(err.message || 'Произошла ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, mediaTypeName) => {
    if (!isAdmin) return;

    if (!confirm(`Вы уверены, что хотите удалить тип оповещения "${mediaTypeName}"?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await onDelete(id);
      setSuccess('Тип оповещения успешно удален');
      onRefresh();
    } catch (err) {
      setError(err.message || 'Произошла ошибка при удалении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="media-types-container" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="title" style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Типы оповещений</h1>
          <p className="subtitle" style={{ margin: '4px 0 0 0', opacity: 0.7 }}>Управление типами оповещений (CALL_MEDIA_TYPE_ID)</p>
        </div>
        {isAdmin && (
          <button className="btn primary" onClick={openCreateModal} disabled={parentLoading || loading}>
            Создать тип оповещения
          </button>
        )}
      </header>

      {error && (
        <div className="error" style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '16px' }}>
          {success}
        </div>
      )}

      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Название</th>
                <th>CALL_MEDIA_TYPE_ID</th>
                <th>Дата создания</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {mediaTypes.map((mediaType) => {
                return (
                  <tr key={mediaType.id}>
                    <td style={{ fontWeight: 500 }}>
                      {mediaType.name}
                    </td>
                    <td>
                      <code>{mediaType.media_type_id}</code>
                    </td>
                    <td>
                      {mediaType.created_at ? new Date(mediaType.created_at).toLocaleString('ru-RU') : '—'}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn ghost"
                          onClick={() => openEditModal(mediaType)}
                          disabled={parentLoading || loading}
                          style={{ marginRight: '8px', padding: '4px 8px', fontSize: '13px' }}
                        >
                          Редактировать
                        </button>
                        <button
                          className="btn ghost"
                          onClick={() => handleDelete(mediaType.id, mediaType.name)}
                          disabled={parentLoading || loading}
                          style={{ color: '#ef4444', padding: '4px 8px', fontSize: '13px' }}
                        >
                          Удалить
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {mediaTypes.length === 0 && !parentLoading && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} style={{ textAlign: 'center', opacity: 0.5, padding: '24px' }}>
                    Нет типов оповещений
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
              {editMediaType ? `Редактирование типа: ${editMediaType.name}` : 'Создание типа оповещения'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="filter-field" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>Название *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  placeholder="Введите название (например, Голосовой звонок)"
                  disabled={loading}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              </div>

              <div className="filter-field" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>CALL_MEDIA_TYPE_ID *</label>
                <input 
                  type="text" 
                  value={mediaTypeId} 
                  onChange={(e) => setMediaTypeId(e.target.value)} 
                  required
                  placeholder="Введите ID (например, 3)"
                  disabled={loading}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
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
