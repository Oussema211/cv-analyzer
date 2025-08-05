import React from 'react';

function Header() {
  return (
    <header style={{
      background: '#b1b1b1ff',
      padding: '20px',
      border: '1px solid #555555',
      borderRadius: '10px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: '#232323'
    }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f1f1fff' }}>CV CONSULTANT</div>
      <nav>
        <ul style={{ listStyle: 'none', display: 'flex', gap: '20px', margin: 0, padding: 0 }}>
          <li><a href="#home" style={{ color: '#232323', textDecoration: 'none' }}>Home</a></li>
          <li><a href="#features" style={{ color: '#232323', textDecoration: 'none' }}>Features</a></li>
          <li><a href="#contact" style={{ color: '#232323', textDecoration: 'none' }}>Contact</a></li>
          <li><a href="#support" style={{ color: '#232323', textDecoration: 'none' }}>Support</a></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
