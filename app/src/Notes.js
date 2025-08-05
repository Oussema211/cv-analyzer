import React, { useState } from 'react';

function Notes({ cvId, notes, onAddNote }) {
  const [newNote, setNewNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(cvId, newNote);
      setNewNote('');
    }
  };

  return (
    <div style={{
      background: '#ffffff',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ color: '#FFC107' }}>Reviews/Notes</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a review or note..."
          style={{
            width: '100%',
            padding: '10px',
            background: '#f5f5f5',
            color: '#212121',
            border: '1px solid #bdbdbd',
            borderRadius: '5px',
            resize: 'vertical',
            marginBottom: '10px'
          }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: '#FFC107',
            color: '#212121',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FFA000'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFC107'}
        >
          Add Review
        </button>
      </form>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
        {notes.map((note, index) => (
          <li
            key={index}
            style={{
              padding: '10px',
              margin: '5px 0',
              background: '#f5f5f5',
              borderRadius: '5px',
              color: '#212121'
            }}
          >
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Notes;