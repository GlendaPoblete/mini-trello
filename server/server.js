// server/server.js
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5001;

// --- FILE PATHS ---
const CHAPTERS_FILE = path.join(__dirname, "chapters.json");
const DEADLINES_FILE = path.join(__dirname, "deadlines.json");

// Ensure data files exist
if (!fs.existsSync(CHAPTERS_FILE)) fs.writeFileSync(CHAPTERS_FILE, "[]", "utf8");
if (!fs.existsSync(DEADLINES_FILE)) fs.writeFileSync(DEADLINES_FILE, "[]", "utf8");

// --- HELPERS ---
function readFile(file) {
  return JSON.parse(fs.readFileSync(file, "utf8") || "[]");
}
function writeFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

// --- SERVER ---
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || "";
  const parts = url.split("/").filter(Boolean);

  // === CHAPTERS API ===
  if (url === "/chapters" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(readFile(CHAPTERS_FILE)));
    return;
  }

  if (parts[0] === "chapters" && parts[1] && parts[2] && req.method === "PUT") {
    const [_, chapterId, lessonId] = parts;
    const chapters = readFile(CHAPTERS_FILE);

    const updated = chapters.map((c) =>
      c.id === chapterId
        ? {
            ...c,
            lessons: c.lessons.map((l) =>
              l.id === lessonId ? { ...l, done: !l.done } : l
            ),
          }
        : c
    );

    writeFile(CHAPTERS_FILE, updated);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(updated));
    return;
  }

  if (
    parts[0] === "chapters" &&
    parts[1] &&
    parts[2] &&
    parts[3] === "note" &&
    req.method === "PUT"
  ) {
    const [_, chapterId, lessonId] = parts;
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { note } = JSON.parse(body);
        const chapters = readFile(CHAPTERS_FILE);

        const updated = chapters.map((c) =>
          c.id === chapterId
            ? {
                ...c,
                lessons: c.lessons.map((l) =>
                  l.id === lessonId ? { ...l, note } : l
                ),
              }
            : c
        );

        writeFile(CHAPTERS_FILE, updated);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(updated));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Invalid JSON" }));
      }
    });
    return;
  }

  // === DEADLINES API ===
  if (url === "/deadlines" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(readFile(DEADLINES_FILE)));
    return;
  }

  if (url === "/deadlines" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const { title, dueDate } = JSON.parse(body);
      const deadlines = readFile(DEADLINES_FILE);

      const newDeadline = {
        id: Date.now().toString(),
        title,
        dueDate,
        done: false,
      };

      deadlines.push(newDeadline);
      writeFile(DEADLINES_FILE, deadlines);

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(newDeadline));
    });
    return;
  }

  if (parts[0] === "deadlines" && parts[1] && req.method === "PUT") {
    const id = parts[1];
    const deadlines = readFile(DEADLINES_FILE);

    const updated = deadlines.map((d) =>
      d.id === id ? { ...d, done: !d.done } : d
    );

    writeFile(DEADLINES_FILE, updated);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(updated));
    return;
  }

  if (parts[0] === "deadlines" && parts[1] && req.method === "DELETE") {
    const id = parts[1];
    const deadlines = readFile(DEADLINES_FILE);

    const filtered = deadlines.filter((d) => d.id !== id);
    writeFile(DEADLINES_FILE, filtered);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Deadline removed" }));
    return;
  }

  // Not found
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Not found" }));
});

server.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
