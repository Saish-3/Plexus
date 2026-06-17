/* ---------------- graph generators ---------------- */

export const ring = (ids, cx = 420, cy = 280, r = 190) =>
  ids.map((id, i) => ({
    id,
    x: cx + r * Math.cos((i / ids.length) * Math.PI * 2),
    y: cy + r * Math.sin((i / ids.length) * Math.PI * 2),
    vx: 0, vy: 0,
  }));

export const GENERATORS = {
  social: () => {
    const names = ["Asha", "Ravi", "Meera", "Karan", "Divya", "Imran", "Tara", "Nikhil", "Priya", "Vikram", "Sana", "Arjun"];
    const pairs = [["Asha", "Ravi"], ["Asha", "Meera"], ["Ravi", "Meera"], ["Meera", "Karan"], ["Karan", "Divya"],
      ["Karan", "Imran"], ["Divya", "Imran"], ["Imran", "Tara"], ["Tara", "Nikhil"], ["Tara", "Priya"],
      ["Nikhil", "Priya"], ["Priya", "Vikram"], ["Vikram", "Sana"], ["Sana", "Arjun"], ["Vikram", "Arjun"],
      ["Meera", "Tara"], ["Asha", "Karan"]];
    return { nodes: ring(names), edges: pairs.map(([a, b]) => ({ a, b })) };
  },
  bridge: () => {
    const A = ["A1", "A2", "A3", "A4", "A5", "A6"], B = ["B1", "B2", "B3", "B4", "B5", "B6"];
    const edges = [];
    const clique = (g) => {
      for (let i = 0; i < g.length; i++)
        for (let j = i + 1; j < g.length; j++)
          if (Math.random() < 0.7) edges.push({ a: g[i], b: g[j] });
    };
    clique(A); clique(B);
    edges.push({ a: "A1", b: "Hub" }, { a: "Hub", b: "B1" });
    return {
      nodes: [...ring(A, 260, 280, 120), ...ring(B, 580, 280, 120), { id: "Hub", x: 420, y: 280, vx: 0, vy: 0 }],
      edges,
    };
  },
  star: () => {
    const ids = Array.from({ length: 11 }, (_, i) => (i === 0 ? "Core" : `S${i}`));
    return { nodes: ring(ids), edges: ids.slice(1).map((id) => ({ a: "Core", b: id })) };
  },
  random: () => {
    const ids = Array.from({ length: 16 }, (_, i) => `R${i + 1}`);
    const edges = [];
    for (let i = 1; i < ids.length; i++)
      edges.push({ a: ids[i], b: ids[Math.floor(Math.random() * i)] });
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++)
        if (Math.random() < 0.08) edges.push({ a: ids[i], b: ids[j] });
    return { nodes: ring(ids), edges };
  },
};
