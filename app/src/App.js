import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './Header';
import CVList from './CVList';
import CVViewer from './CVViewer';
import Notes from './Notes';

const initialCVs = [];

function App() {
  const [cvs, setCVs] = useState(initialCVs);
  const [selectedCV, setSelectedCV] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log('Fetching files from cv_database.cv...');
    fetch('http://localhost:5000/cv')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Raw data from cv_database.cv:', data);
        if (Array.isArray(data)) {
          const formattedCVs = data.map(file => {
            const fileId = file.file_id ? String(file.file_id) : null;
            if (!fileId) {
              console.warn(`No file_id for CV: ${file.name || 'Unnamed CV'} (id: ${file.id || file._id})`);
            }
            const cv = {
              id: file.id || String(file._id),
              name: file.name || 'Unnamed CV',
              email: '',
              phone: '',
              education: '',
              experience: '',
              skills: '',
              notes: Array.isArray(file.notes) ? file.notes : [],
              pdfUrl: fileId ? `http://localhost:5000/pdf/${fileId}` : '',
              analysisResult: null
            };
            console.log('Formatted CV:', { name: cv.name, fileId, pdfUrl: cv.pdfUrl });
            return cv;
          });
          console.log('All formatted CVs:', formattedCVs);
          setCVs(formattedCVs);
        } else {
          console.error('Unexpected data format:', data);
          setCVs([]);
        }
      })
      .catch(error => {
        console.error('Error fetching CVs:', error.message);
        setCVs([]);
      });
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setUploadError('No file selected');
      return;
    }

    setFileName(file.name);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);

    fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(newFile => {
        console.log('Uploaded file response:', newFile);
        const fileId = newFile.file_id ? String(newFile.file_id) : null;
        if (!fileId) {
          console.warn(`No file_id in upload response for CV: ${newFile.name || 'Unnamed CV'}`);
        }
        const formattedCV = {
          id: newFile.id || String(newFile._id),
          name: newFile.name || 'Unnamed CV',
          email: '',
          phone: '',
          education: '',
          experience: '',
          skills: '',
          notes: Array.isArray(newFile.notes) ? newFile.notes : [],
          pdfUrl: fileId ? `http://localhost:5000/pdf/${fileId}` : '',
          analysisResult: null
        };
        console.log('New CV:', { name: formattedCV.name, fileId, pdfUrl: formattedCV.pdfUrl });
        setCVs(prevCVs => [...prevCVs, formattedCV]);
        setFileName('');
      })
      .catch(error => {
        console.error('Error uploading file:', error.message);
        setUploadError(`Upload failed: ${error.message}`);
      });
  };

  const handleDeleteCV = (cvId) => {
    console.log('Deleting CV:', cvId);
    fetch(`http://localhost:5000/cv/${cvId}`, {
      method: 'DELETE'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Delete response:', data);
        setCVs(prevCVs => prevCVs.filter(cv => cv.id !== cvId));
        if (selectedCV && selectedCV.id === cvId) {
          setSelectedCV(null);
        }
      })
      .catch(error => {
        console.error('Error deleting CV:', error.message);
        setUploadError(`Delete failed: ${error.message}`);
      });
  };

  const handleSelectCV = (cv) => {
    console.log('Selected CV:', { name: cv.name, pdfUrl: cv.pdfUrl });
    setSelectedCV({ ...cv, analysisResult: null });
  };

  const handleAddNote = (cvId, note) => {
    setCVs(cvs.map(cv =>
      cv.id === cvId ? { ...cv, notes: [...cv.notes, note] } : cv
    ));
  };

  const handleAnalyzeCV = (cvId) => {
    if (!cvId) {
      setUploadError('No CV selected for analysis.');
      return;
    }
    fetch('http://localhost:5000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cv_id: cvId })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Analysis result:', data);
        setSelectedCV(prev => prev ? { ...prev, analysisResult: data } : null);
      })
      .catch(error => {
        console.error('Error analyzing CV:', error.message);
        setUploadError(`Analysis failed: ${error.message}`);
      });
  };

  console.log('Rendering App with cvs:', cvs, 'selectedCV:', selectedCV, 'searchQuery:', searchQuery);

  return (
    <div className="app">
      <Header />
      <div className="main-content">
        <div className="upload-section">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            style={{ display: 'block', marginBottom: '10px' }}
          />
          {fileName && <p>Uploading: {fileName}</p>}
          {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
        </div>
        <CVList
          key={cvs.length}
          cvs={cvs}
          onSelectCV={handleSelectCV}
          onDeleteCV={handleDeleteCV}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        {cvs.length === 0 ? (
          <div className="no-selection">
            No files found in cv_database.cv. Upload a file or check the server.
          </div>
        ) : selectedCV ? (
          <div className="cv-details">
            <CVViewer cv={selectedCV} onAnalyzeCV={() => handleAnalyzeCV(selectedCV.id)} />
            <Notes cvId={selectedCV.id} notes={selectedCV.notes} onAddNote={handleAddNote} />
          </div>
        ) : (
          <div className="no-selection">Select a file to view details</div>
        )}
      </div>
    </div>
  );
}

export default App;