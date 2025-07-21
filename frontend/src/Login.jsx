import React from 'react';

const Login = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/atlassian';
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#333', marginBottom: '2rem' }}>
          JIRA Automation
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Connect your Atlassian account to get started
        </p>
        <button 
          onClick={handleLogin}
          style={{
            backgroundColor: '#0052CC',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0043A3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#0052CC'}
        >
          Login with Atlassian
        </button>
      </div>
    </div>
  );
};

export default Login;