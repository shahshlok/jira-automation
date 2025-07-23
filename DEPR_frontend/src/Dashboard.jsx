import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
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

  // UserStoriesSidebar Component
  const UserStoriesSidebar = () => {
    const [stories, setStories] = useState([]);
    const [storiesLoading, setStoriesLoading] = useState(true);
    const [storiesError, setStoriesError] = useState(null);

    useEffect(() => {
      fetchUserStories();
    }, []);

    const fetchUserStories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/jira-proxy/search?jql=issuetype="Story"&maxResults=50', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user stories');
        }

        const data = await response.json();
        setStories(data.data.issues || []);
      } catch (err) {
        setStoriesError(err.message);
        console.error('Error fetching user stories:', err);
      } finally {
        setStoriesLoading(false);
      }
    };

    if (storiesLoading) {
      return (
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          Loading stories...
        </div>
      );
    }

    if (storiesError) {
      return (
        <div style={{ padding: '1rem', color: 'red', textAlign: 'center' }}>
          Error: {storiesError}
        </div>
      );
    }

    return (
      <div style={{
        height: '100%',
        overflowY: 'auto',
        padding: '1rem'
      }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          color: '#333',
          borderBottom: '2px solid #0052cc',
          paddingBottom: '0.5rem'
        }}>
          User Stories
        </h3>
        {stories.length === 0 ? (
          <p style={{ color: '#666' }}>No user stories found</p>
        ) : (
          stories.map((story) => (
            <div
              key={story.id}
              onClick={() => setSelectedStory(story)}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                backgroundColor: selectedStory?.id === story.id ? '#e6f3ff' : '#f8f9fa',
                border: selectedStory?.id === story.id ? '2px solid #0052cc' : '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (selectedStory?.id !== story.id) {
                  e.target.style.backgroundColor = '#e9ecef';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStory?.id !== story.id) {
                  e.target.style.backgroundColor = '#f8f9fa';
                }
              }}
            >
              <div style={{ 
                fontWeight: '600',
                fontSize: '0.9rem',
                marginBottom: '0.25rem'
              }}>
                {story.key}
              </div>
              <div style={{ 
                fontSize: '0.8rem',
                color: '#666',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {story.fields.summary}
              </div>
              <div style={{ 
                fontSize: '0.7rem',
                color: '#999',
                marginTop: '0.25rem'
              }}>
                Status: {story.fields.status.name}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // StoryDetails Component
  const StoryDetails = ({ story }) => {
    if (!story) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#666',
          fontSize: '1.1rem'
        }}>
          Select a user story to view details
        </div>
      );
    }

    return (
      <div style={{ 
        padding: '2rem',
        height: '100%',
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ 
            margin: '0 0 0.5rem 0',
            color: '#333',
            fontSize: '1.5rem'
          }}>
            {story.key}: {story.fields.summary}
          </h2>
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            <span style={{
              backgroundColor: '#e6f3ff',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              border: '1px solid #0052cc'
            }}>
              Status: {story.fields.status.name}
            </span>
            {story.fields.assignee && (
              <span style={{
                backgroundColor: '#f0f0f0',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px'
              }}>
                Assignee: {story.fields.assignee.displayName}
              </span>
            )}
            {story.fields.priority && (
              <span style={{
                backgroundColor: '#fff2e6',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px'
              }}>
                Priority: {story.fields.priority.name}
              </span>
            )}
          </div>
        </div>

        {story.fields.description && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              margin: '0 0 0.5rem 0',
              color: '#333',
              fontSize: '1.1rem'
            }}>
              Description
            </h3>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              lineHeight: '1.6'
            }}>
              {typeof story.fields.description === 'string' 
                ? story.fields.description 
                : story.fields.description?.content 
                  ? story.fields.description.content.map(block => 
                      block.content?.map(text => text.text).join(' ')
                    ).join('\n\n')
                  : 'No description available'
              }
            </div>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            margin: '0 0 0.5rem 0',
            color: '#333',
            fontSize: '1.1rem'
          }}>
            Additional Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <strong>Issue Type:</strong> {story.fields.issuetype.name}
            </div>
            <div>
              <strong>Created:</strong> {new Date(story.fields.created).toLocaleDateString()}
            </div>
            <div>
              <strong>Updated:</strong> {new Date(story.fields.updated).toLocaleDateString()}
            </div>
            {story.fields.reporter && (
              <div>
                <strong>Reporter:</strong> {story.fields.reporter.displayName}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // AIChatInterface Component
  const AIChatInterface = ({ story }) => {
    const [chatMessages, setChatMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');

    if (!story) {
      return null;
    }

    const handleSendMessage = () => {
      if (inputMessage.trim()) {
        setChatMessages([...chatMessages, {
          id: Date.now(),
          type: 'user',
          message: inputMessage
        }]);
        
        // Placeholder AI response
        setTimeout(() => {
          setChatMessages(prev => [...prev, {
            id: Date.now() + 1,
            type: 'ai',
            message: `I understand you're asking about "${story.key}". This is a placeholder response - AI integration will be implemented in a future update.`
          }]);
        }, 1000);
        
        setInputMessage('');
      }
    };

    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        borderLeft: '1px solid #ddd'
      }}>
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #ddd',
          backgroundColor: '#f8f9fa'
        }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>
            AI Assistant - {story.key}
          </h3>
        </div>
        
        <div style={{
          flex: 1,
          padding: '1rem',
          overflowY: 'auto',
          minHeight: 0
        }}>
          {chatMessages.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>
              Ask me anything about this user story!
            </div>
          ) : (
            chatMessages.map(msg => (
              <div key={msg.id} style={{
                marginBottom: '1rem',
                textAlign: msg.type === 'user' ? 'right' : 'left'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: msg.type === 'user' ? '#0052cc' : '#f0f0f0',
                  color: msg.type === 'user' ? 'white' : '#333',
                  maxWidth: '80%'
                }}>
                  {msg.message}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #ddd',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about this story..."
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0052cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
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
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Top Navigation Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        <h1 style={{ color: '#333', margin: 0, fontSize: '1.5rem' }}>
          Jira Dashboard
        </h1>
        
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/api-tester')}
              style={{
                backgroundColor: '#0052cc',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔧 API Tester
            </button>
            <span style={{ color: '#333' }}>
              Hello, {user.name}
            </span>
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
        )}
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: selectedStory ? '300px 1fr 400px' : '300px 1fr',
        minHeight: 0
      }}>
        {/* Left Sidebar - User Stories */}
        <div style={{
          backgroundColor: 'white',
          borderRight: '1px solid #ddd',
          overflow: 'hidden'
        }}>
          <UserStoriesSidebar />
        </div>

        {/* Middle Section - Story Details */}
        <div style={{
          backgroundColor: 'white',
          overflow: 'hidden'
        }}>
          <StoryDetails story={selectedStory} />
        </div>

        {/* Right Section - AI Chat Interface */}
        {selectedStory && (
          <div style={{
            backgroundColor: 'white',
            overflow: 'hidden'
          }}>
            <AIChatInterface story={selectedStory} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;