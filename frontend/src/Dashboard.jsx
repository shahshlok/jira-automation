import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('http://localhost:5000/auth/me', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/', { replace: true });
          return;
        }
        throw new Error('Failed to fetch user info');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/', { replace: true });
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'red'
      }}>
        <div>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{ color: '#333', margin: 0 }}>Dashboard</h1>
          <button 
            onClick={handleLogout}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
        
        {user && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '1rem' }}>
              Welcome, {user.name}!
            </h2>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Name:</strong> {user.name}
              </p>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Email:</strong> {user.email}
              </p>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Account ID:</strong> {user.account_id}
              </p>
              {user.picture && (
                <div style={{ marginTop: '1rem' }}>
                  <img 
                    src={user.picture} 
                    alt="Profile" 
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%',
                      border: '2px solid #ddd'
                    }} 
                  />
                </div>
              )}
            </div>
            <div style={{ 
              backgroundColor: '#e8f5e8', 
              padding: '1rem', 
              borderRadius: '4px',
              border: '1px solid #c3e6c3'
            }}>
              <p style={{ margin: 0, color: '#2d5a2d' }}>
                ✅ Successfully connected to Atlassian! You can now access JIRA resources.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;