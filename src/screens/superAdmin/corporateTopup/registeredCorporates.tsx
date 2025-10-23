import { getRequest } from '@/Apis/Api';
import React, { useState, useEffect } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import moment from 'moment';

const ViewCorporates = ({ onBack }) => {
  const [corporates, setCorporates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchCorporates = async () => {
      try {
        setLoading(true);
        const response = await getRequest("/superadmin/getAllCorporateClients");
        console.log("Registered Corporates Response:", response);
        
        // Assuming the response has a data property with the corporates array
        if (response && response.data) {
          setCorporates(response.data);
        }
      } catch (err) {
        console.error("Error fetching corporates:", err);
        setError('Failed to load corporate data');
      } finally {
        setLoading(false);
      }
    };

    fetchCorporates();
  }, []);

  // Function to display machine codes properly
  const renderMachineCodes = (machineCodes) => {
    if (!machineCodes) {
      return <span style={noMachineCodesStyle}>No machines</span>;
    }

    // Handle both array and string formats
    let codesArray = machineCodes;
    
    // If it's a string, try to parse it as JSON
    if (typeof machineCodes === 'string') {
      try {
        codesArray = JSON.parse(machineCodes);
      } catch (e) {
        // If parsing fails, treat it as a single code
        codesArray = [machineCodes];
      }
    }

    // If it's an array and has items
    if (Array.isArray(codesArray) && codesArray.length > 0) {
      return (
        <div style={machineCodesContainerStyle}>
          {codesArray.map((code, index) => (
            <span key={index} style={machineCodeStyle}>
              {code}
              {index < codesArray.length - 1 && ', '}
            </span>
          ))}
        </div>
      );
    }

    return <span style={noMachineCodesStyle}>No machines</span>;
  };

  if (loading) {
    return (
      <div style={contentStyle}>
        <div style={headerStyle}>
          <button 
            style={backButtonStyle}
            onClick={onBack}
            onMouseOver={(e) => {
              e.target.style.background = '#764ba2';
              e.target.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = '#764ba2';
            }}
          >
            <FaArrowLeft style={{ marginRight: '8px' }} />
            Back to Dashboard
          </button>
          <h2 style={subTitleStyle}>Registered Corporates</h2>
        </div>
        <div style={loadingStyle}>
          <p>Loading corporate data...</p>
        </div>
      </div>
    );
  }

  if (error && corporates.length === 0) {
    return (
      <div style={contentStyle}>
        <div style={headerStyle}>
          <button 
            style={backButtonStyle}
            onClick={onBack}
            onMouseOver={(e) => {
              e.target.style.background = '#764ba2';
              e.target.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = '#764ba2';
            }}
          >
            <FaArrowLeft style={{ marginRight: '8px' }} />
            Back to Dashboard
          </button>
          <h2 style={subTitleStyle}>Registered Corporates</h2>
        </div>
        <div style={errorStyle}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={contentStyle}>
      <div style={headerStyle}>
        <button 
          style={backButtonStyle}
          onClick={onBack}
          onMouseOver={(e) => {
            e.target.style.background = '#764ba2';
            e.target.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'white';
            e.target.style.color = '#764ba2';
          }}
        >
          <FaArrowLeft style={{ marginRight: '8px' }} />
          Back to Dashboard
        </button>
        <h2 style={subTitleStyle}>Registered Corporates</h2>
      </div>
      
      {error && (
        <div style={errorBannerStyle}>
          <p>{error}</p>
        </div>
      )}
      
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderStyle}>
              <th style={tableCellStyle}>Company Name</th>
              <th style={tableCellStyle}>Location</th>
              <th style={tableCellStyle}>Machine Codes</th>
              <th style={tableCellStyle}>Topup Limit</th>
              <th style={tableCellStyle}>Created At</th>
              <th style={tableCellStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {corporates.map(corporate => (
              <tr key={corporate.id} style={tableRowStyle}>
                <td style={tableCellStyle}>{corporate.corporate_name || corporate.name || 'N/A'}</td>
                <td style={tableCellStyle}>{corporate.location || 'N/A'}</td>
                <td style={tableCellStyle}>
                  {renderMachineCodes(corporate.machine_codes)}
                </td>
                <td style={tableCellStyle}>{corporate.topuplimit || 'N/A'}</td>
                <td style={tableCellStyle}>
                  {corporate.created_at ? moment.utc(corporate.created_at).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
                </td>
                <td style={tableCellStyle}>
                  <button 
                    style={actionButtonStyle}
                    onClick={() => alert(`View details for ${corporate.corporate_name || corporate.name}`)}
                    onMouseOver={(e) => {
                      e.target.style.background = '#764ba2';
                      e.target.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.color = '#764ba2';
                    }}
                  >
                    Topup
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Styles
const contentStyle = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  padding: '40px',
  maxWidth: '1000px', // Increased width to accommodate machine codes
  width: '100%',
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  marginBottom: '30px',
  justifyContent: 'flex-start'
};

const subTitleStyle = {
  fontSize: '2rem',
  fontWeight: '600',
  color: '#2d3748',
  margin: '0'
};

const backButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 24px',
  border: '2px solid #764ba2',
  borderRadius: '6px',
  background: 'white',
  color: '#764ba2',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  fontSize: '1rem'
};

const tableContainerStyle = {
  overflowX: 'auto',
  marginBottom: '30px'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
};

const tableHeaderStyle = {
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  color: 'white'
};

const tableRowStyle = {
  borderBottom: '1px solid #e2e8f0'
};

const tableCellStyle = {
  padding: '16px',
  textAlign: 'left',
  border: 'none'
};

const actionButtonStyle = {
  padding: '8px 16px',
  border: '1px solid #667eea',
  borderRadius: '4px',
  background: 'white',
  color: '#667eea',
  cursor: 'pointer',
  fontSize: '0.875rem',
  transition: 'all 0.3s ease',
  fontWeight: '500'
};

const loadingStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#667eea',
  fontSize: '1.1rem'
};

const errorStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#f44336',
  fontSize: '1.1rem'
};

const errorBannerStyle = {
  background: '#ffebee',
  color: '#c62828',
  padding: '12px 16px',
  borderRadius: '6px',
  marginBottom: '20px',
  border: '1px solid #ffcdd2'
};

// New styles for machine codes
const machineCodesContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px'
};

const machineCodeStyle = {
  background: '#e3f2fd',
  color: '#1976d2',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: '500'
};

const noMachineCodesStyle = {
  color: '#9e9e9e',
  fontStyle: 'italic',
  fontSize: '0.875rem'
};

export default ViewCorporates;