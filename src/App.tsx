import React, { useState, useEffect } from 'react'
import './App.css'

interface Note {
  id: number;
  text: string;
  position: { x: number; y: number };
  color: string;
  size: { width: number; height: number };
}

function App() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const savedNotes = localStorage.getItem('sticky-notes');
    return savedNotes ? JSON.parse(savedNotes) : [];
  });
  
  const colors = ['#ffd700', '#ff7eb9', '#7afcff', '#98fb98', '#ffa07a'];

  useEffect(() => {
    localStorage.setItem('sticky-notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    const newNote: Note = {
      id: Date.now(),
      text: '',
      position: { x: Math.random() * (window.innerWidth - 200), y: Math.random() * (window.innerHeight - 200) },
      color: colors[Math.floor(Math.random() * colors.length)],
      size: { width: 200, height: 200 }
    };
    setNotes([...notes, newNote]);
  };

  const updateNoteText = (id: number, text: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, text } : note
    ));
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const offsetX = e.clientX - note.position.x;
    const offsetY = e.clientY - note.position.y;
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id,
      offsetX,
      offsetY
    }));
  };

  const handleDragEnd = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (e.clientX === 0 && e.clientY === 0) return;

    // Calcula a nova posição considerando o offset
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const newX = e.clientX - data.offsetX;
    const newY = e.clientY - data.offsetY;
    
    setNotes(notes.map(note =>
      note.id === id ? { ...note, position: { x: newX, y: newY } } : note
    ));
  };

  const handleResize = (id: number, width: number, height: number) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, size: { width, height } } : note
    ));
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const [dragInfo, setDragInfo] = useState<{ noteId: number | null, offsetX: number, offsetY: number }>({
    noteId: null,
    offsetX: 0,
    offsetY: 0
  });

  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const offsetX = e.clientX - note.position.x;
    const offsetY = e.clientY - note.position.y;
    
    setDragInfo({
      noteId: id,
      offsetX,
      offsetY
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragInfo.noteId) return;

    const newX = e.clientX - dragInfo.offsetX;
    const newY = e.clientY - dragInfo.offsetY;

    setNotes(notes.map(note =>
      note.id === dragInfo.noteId ? { ...note, position: { x: newX, y: newY } } : note
    ));
  };

  const handleMouseUp = () => {
    setDragInfo({ noteId: null, offsetX: 0, offsetY: 0 });
  };

  useEffect(() => {
    if (dragInfo.noteId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragInfo, notes]);

  return (
    <div className="app">
      <button className="add-button" onClick={addNote}>
        + Nova Nota
      </button>

      {notes.map(note => (
        <div
          key={note.id}
          className="note"
          style={{
            backgroundColor: note.color,
            left: `${note.position.x}px`,
            top: `${note.position.y}px`,
            width: note.size.width + 'px',
            height: note.size.height + 'px'
          }}
          onMouseDown={(e) => handleMouseDown(e, note.id)}
        >
          <button className="delete-button" onClick={() => deleteNote(note.id)}>×</button>
          <textarea
            value={note.text}
            onChange={(e) => updateNoteText(note.id, e.target.value)}
            placeholder="Digite sua nota aqui..."
          />
          <div
            className="resize-handle"
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = note.size.width;
              const startHeight = note.size.height;

              const onMouseMove = (e: MouseEvent) => {
                const width = Math.max(200, startWidth + (e.clientX - startX));
                const height = Math.max(200, startHeight + (e.clientY - startY));
                handleResize(note.id, width, height);
              };

              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
              };

              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
          />
        </div>
      ))}
    </div>
  )
}

export default App