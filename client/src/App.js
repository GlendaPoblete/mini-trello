import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5001";

function App() {
  const [chapters, setChapters] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [newDeadline, setNewDeadline] = useState({ title: "", dueDate: "" });
  const [darkMode, setDarkMode] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [noteText, setNoteText] = useState("");

  // Load chapters
  useEffect(() => {
    fetch(`${API}/chapters`).then((res) => res.json()).then(setChapters);
  }, []);

  // Load deadlines
  useEffect(() => {
    fetch(`${API}/deadlines`).then((res) => res.json()).then(setDeadlines);
  }, []);

  // Toggle lesson done
  const toggleLesson = async (chapterId, lessonId) => {
    await fetch(`${API}/chapters/${chapterId}/${lessonId}`, { method: "PUT" });
    setChapters(chapters.map((c) =>
      c.id === chapterId
        ? { ...c, lessons: c.lessons.map((l) =>
            l.id === lessonId ? { ...l, done: !l.done } : l
          )}
        : c
    ));
  };

  // Notes
  const openNote = (chapterId, lesson) => {
    setActiveLesson({ ...lesson, chapterId });
    setNoteText(lesson.note || "");
  };
  const saveNote = async () => {
    if (!activeLesson) return;
    await fetch(`${API}/chapters/${activeLesson.chapterId}/${activeLesson.id}/note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteText }),
    });
    setChapters(chapters.map((c) =>
      c.id === activeLesson.chapterId
        ? { ...c, lessons: c.lessons.map((l) =>
            l.id === activeLesson.id ? { ...l, note: noteText } : l
          )}
        : c
    ));
    setActiveLesson(null);
    setNoteText("");
  };

  // Add deadline
  const addDeadline = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/deadlines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDeadline),
    });
    const data = await res.json();
    setDeadlines([...deadlines, data]);
    setNewDeadline({ title: "", dueDate: "" });
  };

  // Toggle deadline
  const toggleDeadline = async (id) => {
    await fetch(`${API}/deadlines/${id}`, { method: "PUT" });
    setDeadlines(deadlines.map((d) => (d.id === id ? { ...d, done: !d.done } : d)));
  };

  // Delete deadline
  const deleteDeadline = async (id) => {
    await fetch(`${API}/deadlines/${id}`, { method: "DELETE" });
    setDeadlines(deadlines.filter((d) => d.id !== id));
  };

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      <header className="app-header">
        <h1>📚 Full-Stack Development Tracker</h1>
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "🌞" : "🌙"}
        </button>
      </header>

      {/* Curriculum */}
      <div className="board">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="column">
            <h2>{chapter.title}</h2>
            <ul>
              {chapter.lessons.map((lesson) => (
                <li key={lesson.id} className={lesson.done ? "done" : ""}>
                  <div className="lesson-title" onClick={() => toggleLesson(chapter.id, lesson.id)}>
                    {lesson.title}
                  </div>
                  <button className="note-btn" onClick={() => openNote(chapter.id, lesson)}>📝</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Deadlines */}
      <div className="deadlines">
        <h2>📅 Assignment Deadlines</h2>
        <form onSubmit={addDeadline} className="deadline-form">
          <input type="text" placeholder="Assignment Title" value={newDeadline.title}
            onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })} required />
          <input type="date" value={newDeadline.dueDate}
            onChange={(e) => setNewDeadline({ ...newDeadline, dueDate: e.target.value })} required />
          <button type="submit">➕ Add</button>
        </form>
        <ul className="deadline-list">
          {deadlines.map((d) => (
            <li key={d.id} className={d.done ? "done" : ""}>
              <span onClick={() => toggleDeadline(d.id)}>
                {d.title} — {d.dueDate}
              </span>
              <button onClick={() => deleteDeadline(d.id)}>❌</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Notes Modal */}
      {activeLesson && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Notes for {activeLesson.title}</h2>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <div className="modal-actions">
              <button onClick={saveNote}>💾 Save</button>
              <button onClick={() => setActiveLesson(null)}>❌ Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
