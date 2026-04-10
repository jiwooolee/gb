import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TacticsList.css';

function TacticsList({ tactics, onAdd, onDelete }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');

  const openModal = () => {
    setNewName('');
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = await onAdd(newName.trim());
    setShowModal(false);
    navigate(`/board/${id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') setShowModal(false);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm('이 전술을 삭제하시겠습니까?')) return;
    onDelete(id);
  };

  return (
    <div className="tactics-page">
      <header className="tactics-header">
        <h1>🏀 농구 전술 보드</h1>
        <p>전술을 만들고 관리하세요</p>
      </header>

      <button className="btn-create" onClick={openModal}>
        + 새 전술 만들기
      </button>

      <div className="tactics-grid">
        {tactics.length === 0 ? (
          <div className="empty-state">
            <p>저장된 전술이 없습니다.</p>
            <p>새 전술을 만들어보세요!</p>
          </div>
        ) : (
          tactics.map((t) => (
            <div
              key={t.id}
              className="tactic-card"
              onClick={() => navigate(`/board/${t.id}`)}
            >
              <div className="tactic-card-icon">🏀</div>
              <div className="tactic-card-info">
                <h3>{t.name}</h3>
                <span>{t.createdAt}</span>
                <span>장면: {t.frames.length}개</span>
              </div>
              <button
                className="btn-delete"
                onClick={(e) => handleDelete(e, t.id)}
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>새 전술 만들기</h2>
            <input
              type="text"
              className="modal-input"
              placeholder="전술 이름을 입력하세요"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                취소
              </button>
              <button
                className="btn-confirm"
                onClick={handleCreate}
                disabled={!newName.trim()}
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TacticsList;
