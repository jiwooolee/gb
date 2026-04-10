import { HashRouter, Routes, Route } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';
import TacticsList from './pages/TacticsList';
import TacticsBoard from './pages/TacticsBoard';
import './App.css';

const COLLECTION = 'tactics';

// Firestore는 중첩 배열을 지원하지 않으므로 변환
function framesToFirestore(frames) {
  return frames.map((f) => ({ players: f }));
}

function framesFromFirestore(frames) {
  return frames.map((f) => f.players);
}

function App() {
  const [tactics, setTactics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Firestore에서 초기 데이터 로드
  useEffect(() => {
    async function fetchTactics() {
      try {
        const snapshot = await getDocs(collection(db, COLLECTION));
        const data = snapshot.docs.map((d) => {
          const docData = d.data();
          return {
            ...docData,
            id: d.id,
            frames: docData.frames ? framesFromFirestore(docData.frames) : [],
          };
        });
        setTactics(data);
      } catch (e) {
        console.error('Failed to load tactics:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchTactics();
  }, []);

  const addTactic = useCallback(async (name) => {
    const id = String(Date.now());
    const newTactic = {
      id,
      name,
      createdAt: new Date().toLocaleDateString('ko-KR'),
      players: [],
      frames: [],
      nextId: 0,
    };
    // 낙관적 업데이트
    setTactics((prev) => [...prev, newTactic]);
    try {
      await setDoc(doc(db, COLLECTION, id), newTactic);
    } catch (e) {
      console.error('Failed to add tactic:', e);
    }
    return id;
  }, []);

  const handleDelete = useCallback((id) => {
    setTactics((prev) => prev.filter((t) => t.id !== id));
    deleteDoc(doc(db, COLLECTION, String(id))).catch((e) =>
      console.error('Failed to delete tactic:', e)
    );
  }, []);

  const updateTactic = useCallback((id, data) => {
    setTactics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t))
    );
    const firestoreData = { ...data };
    if (firestoreData.frames) {
      firestoreData.frames = framesToFirestore(firestoreData.frames);
    }
    updateDoc(doc(db, COLLECTION, String(id)), firestoreData).catch((e) =>
      console.error('Failed to update tactic:', e)
    );
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '20vh', fontSize: '1.2rem' }}>로딩 중...</div>;
  }

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
