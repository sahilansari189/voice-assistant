import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider, 
  IconButton, 
  Tooltip,
  Paper,
  CircularProgress,
  TextField,
  InputAdornment,
  Alert
} from '@mui/material';
import { 
  Star, 
  StarBorder, 
  Delete, 
  Visibility, 
  VisibilityOff,
  Search as SearchIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';

type Email = {
  _id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  createdAt: string;
};

const Dashboard = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { token } = useAuth();
  const { speak, isListening } = useVoice();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/emails', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmails(res.data);
        
        if (isListening) {
          speak(`You have ${res.data.length} emails in your inbox. ${res.data.filter((email: Email) => !email.isRead).length} are unread.`);
        }
      } catch (err: any) {
        console.error('Error fetching emails:', err);
        setError('Failed to load emails. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [token, isListening, speak]);

  const handleOpenEmail = async (emailId: string) => {
    try {
      await axios.put(`/api/emails/${emailId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEmails(emails.map(email => 
        email._id === emailId ? { ...email, isRead: true } : email
      ));
      
      navigate(`/email/${emailId}`);
    } catch (err) {
      console.error('Error marking email as read:', err);
    }
  };

  const handleToggleStar = async (emailId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const targetEmail = emails.find(email => email._id === emailId);
      if (!targetEmail) return;
      
      await axios.put(`/api/emails/${emailId}/star`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEmails(emails.map(email => 
        email._id === emailId ? { ...email, isStarred: !email.isStarred } : email
      ));
      
      if (isListening) {
        speak(`Email ${targetEmail.isStarred ? 'unstarred' : 'starred'}`);
      }
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  const handleDelete = async (emailId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await axios.delete(`/api/emails/${emailId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEmails(emails.filter(email => email._id !== emailId));
      
      if (isListening) {
        speak('Email deleted');
      }
    } catch (err) {
      console.error('Error deleting email:', err);
    }
  };

  const formatEmailTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (err) {
      return 'Unknown date';
    }
  };

  const filteredEmails = emails.filter(email => 
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSenderName = (email: string) => {
    const parts = email.split('@');
    return parts[0].replace(/\./g, ' ');
  };

  const getInitials = (email: string) => {
    const name = getSenderName(email);
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    if (!loading && emails.length > 0) {
      const unreadCount = emails.filter(email => !email.isRead).length;
      const message = `Inbox loaded. You have ${emails.length} emails, ${unreadCount} unread.`;
      const announcer = document.getElementById('inbox-announcer');
      if (announcer) {
        announcer.textContent = message;
      }
    }
  }, [loading, emails]);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Inbox
      </Typography>
      
      <div id="inbox-announcer" className="sr-only" aria-live="polite"></div>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} aria-live="assertive">
          {error}
        </Alert>
      )}
      
      <Paper elevation={1} sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search emails"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          aria-label="Search emails"
        />
      </Paper>
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress aria-label="Loading emails" />
        </Box>
      ) : emails.length === 0 ? (
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">No emails found</Typography>
          <Typography variant="body1" color="textSecondary">
            Your inbox is empty
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={1}>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }} aria-label="Email list">
            {filteredEmails.map((email, index) => (
              <React.Fragment key={email._id}>
                <ListItem 
                  alignItems="flex-start" 
                  onClick={() => handleOpenEmail(email._id)}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: email.isRead ? 'inherit' : 'rgba(25, 118, 210, 0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                    p: 2
                  }}
                  role="button"
                  aria-label={`Email from ${getSenderName(email.from)}, subject: ${email.subject}, ${email.isRead ? 'read' : 'unread'}`}
                >
                  <ListItemAvatar>
                    <Avatar aria-hidden="true">
                      {getInitials(email.from)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography
                          variant="subtitle1"
                          component="span"
                          sx={{ fontWeight: email.isRead ? 'normal' : 'bold' }}
                        >
                          {getSenderName(email.from)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {formatEmailTime(email.createdAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="body1"
                          component="span"
                          sx={{ 
                            display: 'block',
                            fontWeight: email.isRead ? 'normal' : 'bold',
                            mb: 1
                          }}
                        >
                          {email.subject}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component="span"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {email.body.slice(0, 120)}
                          {email.body.length > 120 ? '...' : ''}
                        </Typography>
                        
                        <Box 
                          display="flex" 
                          sx={{ mt: 1 }}
                        >
                          <Tooltip title={email.isStarred ? "Unstar" : "Star"}>
                            <IconButton 
                              size="small" 
                              onClick={(e) => handleToggleStar(email._id, e)}
                              aria-label={email.isStarred ? "Unstar this email" : "Star this email"}
                            >
                              {email.isStarred ? <Star color="primary" /> : <StarBorder />}
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={email.isRead ? "Mark as unread" : "Mark as read"}>
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEmails(emails.map(e => 
                                  e._id === email._id ? { ...e, isRead: !e.isRead } : e
                                ));
                              }}
                              aria-label={email.isRead ? "Mark as unread" : "Mark as read"}
                            >
                              {email.isRead ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={(e) => handleDelete(email._id, e)}
                              aria-label="Delete this email"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </>
                    }
                  />
                </ListItem>
                {index < filteredEmails.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
      
      {/* Hidden style for screen-reader only elements */}
      <style>
        {`.sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `}</style>
    </Box>
  );
};

export default Dashboard; 