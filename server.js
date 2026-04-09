const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const TACTICS_DIR = path.join(__dirname, 'public', 'tactics');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// tactics 폴더 없으면 생성
if (!fs.existsSync(TACTICS_DIR)) {
  fs.mkdirSync(TACTICS_DIR, { recursive: true });
}

// 전술 목록 조회
app.get('/api/tactics', (req, res) => {
  const files = fs.readdirSync(TACTICS_DIR).filter((f) => f.endsWith('.json'));
  const tactics = files.map((file) => {
    const data = JSON.parse(fs.readFileSync(path.join(TACTICS_DIR, file), 'utf-8'));
    return data;
  });
  res.json(tactics);
});

// 전술 저장 (생성/수정)
app.post('/api/tactics/:id', (req, res) => {
  const filePath = path.join(TACTICS_DIR, `${req.params.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf-8');
  res.json({ success: true });
});

// 전술 삭제
app.delete('/api/tactics/:id', (req, res) => {
  const filePath = path.join(TACTICS_DIR, `${req.params.id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
