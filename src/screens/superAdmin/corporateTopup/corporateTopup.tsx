import React, { useState } from 'react';
import { FaBuilding, FaListAlt, FaArrowLeft } from 'react-icons/fa';
import CorporateRegisterForm from './corporateRegisterForm'; // Adjust the import path as needed
import ViewCorporates from './registeredCorporates';

const CorporateTopup = () => {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'register', 'view'

  // Main Dashboard Component
  const MainDashboard = () => (
    <div style={contentStyle}>
      <h1 style={titleStyle}>Corporate Topup</h1>
      
      <div style={buttonsContainerStyle}>
        <button 
          style={primaryButtonStyle}
          onClick={() => setCurrentView('register')}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
          }}
        >
          <FaBuilding />
          Register New Corporate
        </button>
        
        <button 
          style={secondaryButtonStyle}
          onClick={() => setCurrentView('view')}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.background = '#764ba2';
            e.target.style.color = 'white';
            e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.background = 'white';
            e.target.style.color = '#764ba2';
            e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
          }}
        >
          <FaListAlt />
          View Registered Corporates
        </button>
      </div>
    </div>
  );

  // Register New Corporate Component - Using your form
  const RegisterCorporate = () => (
    <div style={registerContainerStyle}>
      <div style={headerContainerStyle}>
        <button 
          style={backButtonStyle}
          onClick={() => setCurrentView('main')}
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
      </div>
      <CorporateRegisterForm />
    </div>
  );

  // Render the appropriate component based on currentView
  const renderCurrentView = () => {
    switch (currentView) {
      case 'register':
        return <RegisterCorporate />;
      case 'view':
        return <ViewCorporates />;
      default:
        return <MainDashboard />;
    }
  };

  return (
    <div style={containerStyle}>
      {renderCurrentView()}
    </div>
  );
};

// Styles
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '20px'
};

const registerContainerStyle = {
  width: '100%',
  maxWidth: '1200px'
};

const contentStyle = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  padding: '40px',
  maxWidth: '900px',
  width: '100%',
  textAlign: 'center'
};

const headerContainerStyle = {
  marginBottom: '20px'
};

const titleStyle = {
  fontSize: '2.5rem',
  fontWeight: '700',
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  marginBottom: '40px'
};

const buttonsContainerStyle = {
  display: 'flex',
  gap: '20px',
  justifyContent: 'center',
  flexWrap: 'wrap'
};

const baseButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '16px 32px',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1.1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  minWidth: '250px',
  justifyContent: 'center',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
};

const primaryButtonStyle = {
  ...baseButtonStyle,
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  color: 'white'
};

const secondaryButtonStyle = {
  ...baseButtonStyle,
  background: 'white',
  color: '#764ba2',
  border: '2px solid #764ba2'
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
  fontSize: '1rem',
  marginBottom: '20px'
};



export default CorporateTopup;