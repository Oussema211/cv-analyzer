import React from 'react';

function CVList({ cvs, onSelectCV, onDeleteCV, searchQuery, setSearchQuery }) {
  console.log('CVList received cvs:', cvs, 'searchQuery:', searchQuery);

  const filteredCVs = cvs.filter(cv =>
    cv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      flex: 1,
      background: '#ffffff',
      padding: '20px',
      borderRadius: '10px',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ color: '#000000ff', marginTop: 0 }}>CV List</h2>
      <input
        type="text"
        placeholder="Search CVs by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '10px',
          border: '1px solid #555555',
          borderRadius: '5px',
          fontSize: '14px'
        }}
      />
      {filteredCVs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666' }}>
          {searchQuery ? 'No CVs match your search.' : 'No files found in cv_database.cv.'}
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredCVs.map(file => (
            <li
              key={file.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                margin: '5px 0',
                background: '#f5f5f5',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            >
              <span onClick={() => onSelectCV(file)}>{file.name || 'Unnamed CV'}</span>
              <button
                style={{
                  padding: '5px 10px',
                  background: '#ff4d4d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
                onClick={() => onDeleteCV(file.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CVList;