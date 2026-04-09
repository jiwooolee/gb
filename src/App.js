import { HashRouter, Routes, Route } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import TacticsList from './pages/TacticsList';
import TacticsBoard from './pages/TacticsBoard';
import './App.css';

const STORAGE_KEY = 'tactics';

function loadTactics() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveTactics(tactics) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tactics));
}

function App() {
  const [tactics, setTactics] = useState(loadTactics);

  // state 변경 시 자동 저장
  useEffect(() => {
    saveTactics(tactics);
  }, [tactics]);

  const addTactic = useCallback((name) => {
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
    return id;
  }, []);

  const handleDelete = useCallback((id) => {
    setTactics((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTactic = useCallback((id, data) => {
    setTactics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t))
    );
  }, []);

  return (
    <HashRouter>
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
    </HashRouter>
  );
}

export default App;
