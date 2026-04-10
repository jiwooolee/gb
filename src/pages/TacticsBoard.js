import { useRef, useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import GIF from 'gif.js';
import './TacticsBoard.css';

function TacticsBoard({ tactics, onUpdate }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [players, setPlayers] = useState([]);
  const [frames, setFrames] = useState([]);
  const [penColor, setPenColor] = useState('#3498db');
  const nextId = useRef(0);

  // 저장된 데이터 불러오기
  useEffect(() => {
    const tactic = tactics.find((t) => t.id === id);
    if (!tactic) {
      navigate('/');
      return;
    }
    setPlayers(tactic.players || []);
    setFrames(tactic.frames || []);
    nextId.current = tactic.nextId || 0;
  }, [id, tactics, navigate]);

  // 캔버스 크기를 컨테이너에 맞추기
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // 상태를 상위로 저장
  const saveUp = useCallback(
    (newPlayers, newFrames) => {
      onUpdate(id, {
        players: newPlayers,
        frames: newFrames,
        nextId: nextId.current,
      });
    },
    [id, onUpdate]
  );

  // 뒤로가기
  const goBack = () => {
    saveUp(players, frames);
    navigate('/');
  };

  // 컨테이너 크기 대비 비율로 좌표 변환
  const getContainerSize = () => {
    const c = containerRef.current;
    return c ? { w: c.clientWidth, h: c.clientHeight } : { w: 600, h: 520 };
  };

  // 선수 추가 (비율 좌표 사용)
  const addPlayer = (type) => {
    const pid = nextId.current++;
    const { w, h } = getContainerSize();
    setPlayers((prev) => {
      const next = [
        ...prev,
        { id: pid, type, label: type === 'home' ? 'H' : 'A', x: w * 0.08, y: h * 0.1 },
      ];
      saveUp(next, frames);
      return next;
    });
  };

  // 공 추가
  const addBall = () => {
    const pid = nextId.current++;
    const { w, h } = getContainerSize();
    setPlayers((prev) => {
      const next = [
        ...prev,
        { id: pid, type: 'ball', label: '', x: w * 0.48, y: h * 0.48 },
      ];
      saveUp(next, frames);
      return next;
    });
  };

  // 드래그 (마우스 + 터치)
  const handlePointerDown = useCallback(
    (e, playerId) => {
      e.preventDefault();
      e.stopPropagation();

      const getPos = (ev) => {
        if (ev.touches) return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
        return { x: ev.clientX, y: ev.clientY };
      };

      let start = getPos(e);

      const onMove = (moveEvent) => {
        moveEvent.preventDefault();
        const pos = getPos(moveEvent);
        const dx = pos.x - start.x;
        const dy = pos.y - start.y;
        start = pos;

        setPlayers((prev) =>
          prev.map((p) =>
            p.id === playerId ? { ...p, x: p.x + dx, y: p.y + dy } : p
          )
        );
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
        setPlayers((prev) => {
          saveUp(prev, frames);
          return prev;
        });
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    },
    [saveUp, frames]
  );

  // 캔버스 터치 이벤트 등록 (passive: false)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e) => {
      e.preventDefault();
      handleCanvasDownRaw(e);
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      handleCanvasMoveRaw(e);
    };
    const onTouchEnd = (e) => {
      e.preventDefault();
      handleCanvasUpRaw();
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  });

  // 캔버스 좌표 계산
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
        y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height),
      };
    }
    return {
      x: e.nativeEvent.offsetX * (canvas.width / rect.width),
      y: e.nativeEvent.offsetY * (canvas.height / rect.height),
    };
  };

  // 선 그리기 (Raw = 네이티브 이벤트, 일반 = React 이벤트 공용)
  const handleCanvasDownRaw = (e) => {
    isDrawingRef.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handleCanvasUpRaw = () => {
    isDrawingRef.current = false;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
  };

  const handleCanvasMoveRaw = (e) => {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getCanvasPos(e);
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const clearLines = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // 장면 저장
  const saveFrame = () => {
    const newFrames = [...frames, players.map((p) => ({ ...p }))];
    setFrames(newFrames);
    saveUp(players, newFrames);
  };

  // 장면 클릭 → 해당 장면으로 이동
  const loadFrame = (index) => {
    const frame = frames[index];
    if (!frame) return;
    setPlayers(frame.map((p) => ({ ...p })));
  };

  // 장면 삭제
  const deleteFrame = (e, index) => {
    e.stopPropagation();
    const newFrames = frames.filter((_, i) => i !== index);
    setFrames(newFrames);
    saveUp(players, newFrames);
  };

  // 전술 재생
  const playAnimation = async () => {
    if (frames.length < 2) {
      alert('최소 2개 이상의 장면을 저장해야 합니다.');
      return;
    }

    for (let i = 0; i < frames.length; i++) {
      setPlayers(frames[i].map((p) => ({ ...p, transition: true })));
      await new Promise((r) => setTimeout(r, 1100));
    }
    setPlayers((prev) => prev.map((p) => ({ ...p, transition: false })));
  };

  // GIF 생성
  const [isCreatingGif, setIsCreatingGif] = useState(false);

  const createGif = async () => {
    if (frames.length < 2) {
      alert('최소 2개 이상의 장면을 저장해야 합니다.');
      return;
    }

    setIsCreatingGif(true);
    const container = containerRef.current;

    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: `${process.env.PUBLIC_URL}/gif.worker.js`,
      width: container.clientWidth,
      height: container.clientHeight,
    });

    // 각 장면을 캡처
    for (let i = 0; i < frames.length; i++) {
      setPlayers(frames[i].map((p) => ({ ...p, transition: false })));
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(container, {
        backgroundColor: '#4caf50',
        scale: 1,
      });
      gif.addFrame(canvas, { delay: 1000 });
    }

    gif.on('finished', (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'basketball_tactics.gif';
      a.click();
      URL.revokeObjectURL(url);
      setIsCreatingGif(false);
    });

    gif.render();
  };

  return (
    <>
      <div id="toolbar">
        <button className="btn-back" onClick={goBack}>
          ← 목록
        </button>
        <button className="btn-blue" onClick={() => addPlayer('home')}>
          우리팀
        </button>
        <button className="btn-red" onClick={() => addPlayer('away')}>
          상대팀
        </button>
        <button className="btn-orange" onClick={addBall}>
          공
        </button>
        <button
          className={`btn-pen-blue${penColor === '#3498db' ? ' pen-active' : ''}`}
          onClick={() => setPenColor('#3498db')}
        >
          우리팀 선
        </button>
        <button
          className={`btn-pen-red${penColor === '#e74c3c' ? ' pen-active' : ''}`}
          onClick={() => setPenColor('#e74c3c')}
        >
          상대팀 선
        </button>
        <button className="btn-gray" onClick={clearLines}>
          선 지우기
        </button>
        <button className="btn-green" onClick={saveFrame}>
          장면 저장
        </button>
        <button className="btn-green" onClick={playAnimation}>
          ▶ 재생
        </button>
        <button
          style={{ background: '#c0392b', color: 'white' }}
          onClick={createGif}
          disabled={isCreatingGif}
        >
          {isCreatingGif ? '생성 중...' : 'GIF 저장'}
        </button>
        <span>장면: {frames.length}</span>
      </div>

      <div className="board-layout">
      <div id="court-container" ref={containerRef}>
        <div
          className="court-watermark"
          style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/background.jpg)` }}
        />
        <div className="line backboard"></div>
        <div className="line rim"></div>
        <div className="line key-area"></div>
        <div className="line three-point"></div>

        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasDownRaw}
          onMouseUp={handleCanvasUpRaw}
          onMouseMove={handleCanvasMoveRaw}
        />

        {players.map((p) => (
          <div
            key={p.id}
            className={`player ${p.type}`}
            style={{
              left: p.x,
              top: p.y,
              transition: p.transition ? 'all 1s ease-in-out' : 'none',
            }}
            onMouseDown={(e) => handlePointerDown(e, p.id)}
            onTouchStart={(e) => handlePointerDown(e, p.id)}
          >
            {p.label}
          </div>
        ))}
      </div>
      {frames.length > 0 && (
        <div className="frames-panel">
          <div className="frames-panel-title">장면</div>
          {frames.map((frame, i) => (
            <div key={i} className="frame-thumb" onClick={() => loadFrame(i)}>
              <div className="frame-thumb-court">
                {frame.map((p) => (
                  <div
                    key={p.id}
                    className={`frame-thumb-player ${p.type}`}
                    style={{
                      left: `${(p.x / 600) * 100}%`,
                      top: `${(p.y / 520) * 100}%`,
                    }}
                  />
                ))}
              </div>
              <div className="frame-thumb-label">
                <span>#{i + 1}</span>
                <button className="frame-thumb-delete" onClick={(e) => deleteFrame(e, i)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}

export default TacticsBoard;
