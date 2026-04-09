const API = 'http://localhost:4000/api';

export async function fetchTactics() {
  const res = await fetch(`${API}/tactics`);
  return res.json();
}

export async function saveTactic(tactic) {
  await fetch(`${API}/tactics/${tactic.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tactic),
  });
}

export async function deleteTactic(id) {
  await fetch(`${API}/tactics/${id}`, { method: 'DELETE' });
}
