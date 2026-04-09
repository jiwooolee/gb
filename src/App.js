import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import { fetchTactics, saveTactic, deleteTactic as deleteTacticApi } from './api';
import TacticsList from './pages/TacticsList';
import TacticsBoard from './pages/TacticsBoard';
import './App.css';

function App() {
  const [tactics, setTactics] = useState([]);

  // 서버에서 전술 목록 불러오기
  useEffect(() => {
    fetchTactics().then(setTactics).catch(() => {});
  }, []);

  // 전술 추가
  const addTactic = useCallback(async (name) => {
    const id = Date.now();
    const newTactic = {
      id,
      name,
      createdAt: new Date().toLocaleDateString('ko-KR'),
      players: [],
      frames: [],
      nextId: 0,
    };
    setTactics((prev) => [...prev, newTactic]);
    await saveTactic(newTactic);
    return id;
  }, []);

  // 전술 삭제
  const handleDelete = useCallback(async (id) => {
    setTactics((prev) => prev.filter((t) => t.id !== id));
    await deleteTacticApi(id);
  }, []);

  // 전술 업데이트
  const updateTactic = useCallback(async (id, data) => {
    setTactics((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...data } : t));
      const tactic = updated.find((t) => t.id === id);
      if (tactic) saveTactic(tactic);
      return updated;
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <TacticsList
              tactics={tactics}
              onAdd={addTactic}
              onDelete={handleDelete}
            />
          }
        />
        <Route
          path="/board/:id"
          element={
            <TacticsBoard
              tactics={tactics}
              onUpdate={updateTactic}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
