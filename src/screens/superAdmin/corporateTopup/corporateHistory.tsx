import { getRequest } from '@/Apis/Api';
import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import moment from 'moment';

const CorporateHistory = ({ onBack }) => {
  const [corporates, setCorporates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    limit: 10,
    total_records: 0,
    total_pages: 0
  });

  // Fetch data with pagination
  const fetchCorporates = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await getRequest(`/superadmin/getCorporateTopupHistory?page=${page}&limit=${limit}`);
      console.log("Registered Corporates Response:", response);
      
      if (response && response.data) {
        setCorporates(response.data);
        setPagination(response.pagination || {
          current_page: page,
          limit: limit,
          total_records: response.total_topups || 0,
          total_pages: Math.ceil((response.total_topups || 0) / limit)
        });
      }
    } catch (err) {
      console.error("Error fetching corporates:", err);
      setError('Failed to load corporate data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchCorporates(1, 10);
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchCorporates(newPage, pagination.limit);
    }
  };

  // Render machine codes function
  const renderMachineCodes = (machineCodes) => {
    if (!machineCodes) {
      return <span style={noMachineCodesStyle}>No machine codes</span>;
    }
    
    // If machineCodes is a string, try to parse it as JSON or split by comma
    if (typeof machineCodes === 'string') {
      try {
        const parsedCodes = JSON.parse(machineCodes);
        if (Array.isArray(parsedCodes)) {
          return (
            <div style={machineCodesContainerStyle}>
              {parsedCodes.slice(0, 3).map((code, index) => (
                <span key={index} style={machineCodeStyle}>
                  {code}
                </span>
              ))}
              {parsedCodes.length > 3 && (
                <span style={moreCodesStyle}>+{parsedCodes.length - 3} more</span>
              )}
            </div>
          );
        }
      } catch (e) {
        // If not JSON, treat as comma-separated string
        const codes = machineCodes.split(',').map(code => code.trim()).filter(code => code);
        return (
          <div style={machineCodesContainerStyle}>
            {codes.slice(0, 3).map((code, index) => (
              <span key={index} style={machineCodeStyle}>
                {code}
              </span>
            ))}
            {codes.length > 3 && (
              <span style={moreCodesStyle}>+{codes.length - 3} more</span>
            )}
          </div>
        );
      }
    }
    
    // If machineCodes is already an array
    if (Array.isArray(machineCodes)) {
      return (
        <div style={machineCodesContainerStyle}>
          {machineCodes.slice(0, 3).map((code, index) => (
            <span key={index} style={machineCodeStyle}>
              {code}
            </span>
          ))}
          {machineCodes.length > 3 && (
            <span style={moreCodesStyle}>+{machineCodes.length - 3} more</span>
          )}
        </div>
      );
    }
    
    return <span style={noMachineCodesStyle}>No machine codes</span>;
  };

  if (loading && corporates.length === 0) {
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
          <h2 style={subTitleStyle}>Corporate Topup History</h2>
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
          <h2 style={subTitleStyle}>Corporate Topup History</h2>
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
        <h2 style={subTitleStyle}>Corporate Topup History</h2>
      </div>
      
      {error && (
        <div style={errorBannerStyle}>
          <p>{error}</p>
        </div>
      )}
      
      <div style={statsContainerStyle}>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Total Records:</span>
          <span style={statValueStyle}>{pagination.total_records}</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Page:</span>
          <span style={statValueStyle}>{pagination.current_page} of {pagination.total_pages}</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>Showing:</span>
          <span style={statValueStyle}>{corporates.length} records</span>
        </div>
      </div>
      
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderStyle}>
              <th style={tableCellStyle}>Company Name</th>
              <th style={tableCellStyle}>Amount</th>
              <th style={tableCellStyle}>Purpose</th>
              <th style={tableCellStyle}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {corporates.map(corporate => (
              <tr key={corporate.id} style={tableRowStyle}>
                <td style={tableCellStyle}>{corporate.corporate_name || 'N/A'}</td>
                <td style={tableCellStyle}>Rs: {corporate.amount || '0.00'}</td>
                <td style={tableCellStyle}>{corporate.purpose_of_payment || 'N/A'}</td>
                <td style={tableCellStyle}>
                  {corporate.created_at ? moment.utc(corporate.created_at).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination.total_pages > 1 && (
        <div style={paginationContainerStyle}>
          <button
            style={paginationButtonStyle}
            onClick={() => handlePageChange(pagination.current_page - 1)}
            disabled={pagination.current_page === 1}
          >
            <FaChevronLeft />
          </button>
          
          {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
            let pageNum;
            if (pagination.total_pages <= 5) {
              pageNum = i + 1;
            } else if (pagination.current_page <= 3) {
              pageNum = i + 1;
            } else if (pagination.current_page >= pagination.total_pages - 2) {
              pageNum = pagination.total_pages - 4 + i;
            } else {
              pageNum = pagination.current_page - 2 + i;
            }

            return (
              <button
                key={pageNum}
                style={{
                  ...paginationButtonStyle,
                  ...(pageNum === pagination.current_page ? activePageButtonStyle : {})
                }}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            style={paginationButtonStyle}
            onClick={() => handlePageChange(pagination.current_page + 1)}
            disabled={pagination.current_page === pagination.total_pages}
          >
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

// Styles
const contentStyle = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  padding: '40px',
  maxWidth: '1200px',
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

const statsContainerStyle = {
  display: 'flex',
  gap: '20px',
  marginBottom: '20px',
  padding: '15px',
  background: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #e9ecef'
};

const statItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '5px'
};

const statLabelStyle = {
  fontSize: '0.875rem',
  color: '#6c757d',
  fontWeight: '500'
};

const statValueStyle = {
  fontSize: '1.125rem',
  color: '#495057',
  fontWeight: '600'
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

// Pagination styles
const paginationContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  marginTop: '20px'
};

const paginationButtonStyle = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  background: 'white',
  color: '#374151',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  minWidth: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const activePageButtonStyle = {
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  color: 'white',
  border: '1px solid #764ba2'
};

// Machine codes styles (kept for reference, though not used in current data)
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

const moreCodesStyle = {
  color: '#6b7280',
  fontSize: '0.75rem',
  fontStyle: 'italic'
};

export default CorporateHistory;