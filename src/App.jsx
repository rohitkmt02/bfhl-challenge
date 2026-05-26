import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [jsonInput, setJsonInput] = useState('{\n  "data": ["M", "1", "334", "4", "B", "Z", "a", "7"]\n}');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  
  // Custom multiselect options
  const options = [
    { value: 'alphabets', label: 'Alphabets' },
    { value: 'numbers', label: 'Numbers' },
    { value: 'highest_lowercase_alphabet', label: 'Highest lowercase alphabet' }
  ];
  
  const [selectedOptions, setSelectedOptions] = useState(['numbers', 'alphabets', 'highest_lowercase_alphabet']);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Default page title
  useEffect(() => {
    document.title = "0827CS231224"; // fallback roll number
  }, []);

  // Handle clicking outside to close multiselect dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.multiselect-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleJsonSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResponse(null);
    
    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonInput);
    } catch (err) {
      setError("Invalid JSON format. Please check syntax (quotes, commas).");
      return;
    }

    if (!parsedJson || !Array.isArray(parsedJson.data)) {
      setError("JSON must contain a 'data' array field (e.g., { \"data\": [\"A\", \"1\"] }).");
      return;
    }

    setLoading(true);
    try {
      // The API endpoint is relative since both front and back run on the same server in Netlify
      const res = await fetch('/bfhl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedJson),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      if (data.roll_number) {
        document.title = data.roll_number;
      }
    } catch (err) {
      setError(err.message || "An error occurred while connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  const toggleOption = (optionValue) => {
    if (selectedOptions.includes(optionValue)) {
      setSelectedOptions(selectedOptions.filter(o => o !== optionValue));
    } else {
      setSelectedOptions([...selectedOptions, optionValue]);
    }
  };

  const renderResponseData = () => {
    if (!response) return null;

    return (
      <div className="response-display">
        {selectedOptions.includes('numbers') && (
          <div className="response-row">
            <span className="response-label">Numbers:</span>
            <div className="response-tags">
              {response.numbers && response.numbers.length > 0 ? (
                response.numbers.map((n, idx) => <span key={idx} className="tag tag-number">{n}</span>)
              ) : (
                <span className="no-data">None</span>
              )}
            </div>
          </div>
        )}

        {selectedOptions.includes('alphabets') && (
          <div className="response-row">
            <span className="response-label">Alphabets:</span>
            <div className="response-tags">
              {response.alphabets && response.alphabets.length > 0 ? (
                response.alphabets.map((a, idx) => <span key={idx} className="tag tag-alphabet">{a}</span>)
              ) : (
                <span className="no-data">None</span>
              )}
            </div>
          </div>
        )}

        {selectedOptions.includes('highest_lowercase_alphabet') && (
          <div className="response-row">
            <span className="response-label">Highest Lowercase Alphabet:</span>
            <div className="response-tags">
              {response.highest_lowercase_alphabet && response.highest_lowercase_alphabet.length > 0 ? (
                response.highest_lowercase_alphabet.map((h, idx) => <span key={idx} className="tag tag-highest">{h}</span>)
              ) : (
                <span className="no-data">None</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="glass-panel">
        <header className="app-header">
          <div className="header-badge">Qualifier 1</div>
          <h1>BFHL Dev Challenge</h1>
          <p className="subtitle">Submit JSON payload to analyze numbers, alphabets, primes, and base64 files.</p>
        </header>

        <form onSubmit={handleJsonSubmit} className="input-form">
          <div className="textarea-wrapper">
            <label htmlFor="json-input">API Request Payload (JSON)</label>
            <textarea
              id="json-input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "data": ["A", "1", "c"] }'
              rows="6"
            />
          </div>
          
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner-loader">Processing...</span>
            ) : (
              "Submit Request"
            )}
          </button>
        </form>

        {error && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
          </div>
        )}

        {response && (
          <div className="results-container">
            <div className="divider" />
            
            <div className="student-info">
              <div className="info-pill">
                <span className="info-title">User ID</span>
                <span className="info-val">{response.user_id}</span>
              </div>
              <div className="info-pill">
                <span className="info-title">Email</span>
                <span className="info-val">{response.email}</span>
              </div>
              <div className="info-pill">
                <span className="info-title">Roll Number</span>
                <span className="info-val">{response.roll_number}</span>
              </div>
            </div>

            <div className="metadata-indicators">
              <div className={`indicator-badge ${response.is_prime_found ? 'active' : 'inactive'}`}>
                {response.is_prime_found ? '✓ Prime Number Found' : '✗ No Primes Found'}
              </div>
              
              {response.file_valid ? (
                <div className="indicator-badge file-active">
                  ✓ File Valid ({response.file_mime_type} | {response.file_size_kb} KB)
                </div>
              ) : (
                <div className="indicator-badge inactive">
                  ✗ No Valid File Sent
                </div>
              )}
            </div>

            <div className="filter-section">
              <label>Filter Response Data</label>
              
              <div className="multiselect-container">
                <div 
                  className={`multiselect-trigger ${dropdownOpen ? 'open' : ''}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="selected-pills">
                    {selectedOptions.length === 0 ? (
                      <span className="placeholder-text">No filters selected</span>
                    ) : (
                      selectedOptions.map(val => {
                        const opt = options.find(o => o.value === val);
                        return (
                          <span key={val} className="selected-pill">
                            {opt?.label}
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOption(val);
                              }}
                            >
                              &times;
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                  <div className="dropdown-arrow">▼</div>
                </div>

                {dropdownOpen && (
                  <div className="multiselect-dropdown">
                    {options.map(opt => (
                      <label key={opt.value} className="dropdown-item">
                        <input
                          type="checkbox"
                          checked={selectedOptions.includes(opt.value)}
                          onChange={() => toggleOption(opt.value)}
                        />
                        <span className="checkbox-custom" />
                        <span className="item-label">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="response-output-container">
              <h3>Filtered Response Output</h3>
              {renderResponseData()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
