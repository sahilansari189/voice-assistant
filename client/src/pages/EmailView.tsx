import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack,
  Reply,
  Forward,
  Delete,
  Star,
  StarBorder,
  Mic,
  MicOff,
  PlayArrow,
  Pause
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';

type Email = {
  _id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments: Array<{
    filename: string;
    path: string;
    contentType: string;
  }>;
  isRead: boolean;
  isStarred: boolean;
  createdAt: string;
};

const EmailView = () => {
  const { id } = useParams<{ id: string }>();
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const { token } = useAuth();
  const { speak, stopSpeaking } = useVoice();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/emails/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmail(res.data);
      } catch (err: any) {
        console.error('Error fetching email:', err);
        setError('Failed to load email. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchEmail();
    }
  }, [id, token]);
  
  const getSenderName = (emailAddress: string) => {
    if (!emailAddress) return 'Unknown';
    const parts = emailAddress.split('@');
    return parts[0].replace(/\./g, ' ');
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (err) {
      return 'Unknown date';
    }
  };
  
  const handleReply = () => {
    if (!email) return;
    
    navigate('/compose', { 
      state: { 
        to: email.from,
        subject: `Re: ${email.subject}`,
        body: `\n\n-------- Original Message --------\nFrom: ${email.from}\nDate: ${formatDate(email.createdAt)}\nSubject: ${email.subject}\n\n${email.body}`
      } 
    });
  };
  
  const handleForward = () => {
    if (!email) return;
    
    navigate('/compose', { 
      state: { 
        subject: `Fwd: ${email.subject}`,
        body: `\n\n-------- Forwarded Message --------\nFrom: ${email.from}\nDate: ${formatDate(email.createdAt)}\nSubject: ${email.subject}\n\n${email.body}`
      } 
    });
  };
  
  const handleDelete = async () => {
    if (!email) return;
    
    try {
      await axios.delete(`/api/emails/${email._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      speak('Email deleted');
      navigate('/');
    } catch (err) {
      console.error('Error deleting email:', err);
      setError('Failed to delete email');
    }
  };
  
  const handleToggleStar = async () => {
    if (!email) return;
    
    try {
      await axios.put(`/api/emails/${email._id}/star`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEmail(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
      speak(email.isStarred ? 'Email unstarred' : 'Email starred');
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };
  
  const handleReadAloud = () => {
    if (!email) return;
    
    if (!isReading) {
      setIsReading(true);
      speak(`Email from ${getSenderName(email.from)}. Subject: ${email.subject}. ${email.body}`);
    } else {
      setIsReading(false);
      stopSpeaking();
    }
  };
  
  const toggleVoiceRecognition = () => {
    if (isVoiceEnabled) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };
  
  const startVoiceRecognition = () => {
    if (!email) return;
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsVoiceEnabled(true);
        speak('Voice commands enabled. You can say commands like reply, forward, delete, read aloud, or go back.');
      };
      
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        
        processVoiceCommand(transcript.toLowerCase().trim());
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsVoiceEnabled(false);
      };
      
      recognition.onend = () => {
        setIsVoiceEnabled(false);
      };
      
      recognition.start();
      window.recognition = recognition;
    } else {
      alert('Speech recognition is not supported in your browser');
    }
  };
  
  const stopVoiceRecognition = () => {
    if (window.recognition) {
      window.recognition.stop();
      setIsVoiceEnabled(false);
      speak('Voice commands disabled');
    }
  };
  
  const processVoiceCommand = (command: string) => {
    if (command.includes('reply') || command.includes('respond')) {
      handleReply();
    } else if (command.includes('forward')) {
      handleForward();
    } else if (command.includes('delete') || command.includes('remove')) {
      handleDelete();
    } else if (command.includes('back') || command.includes('inbox') || command.includes('return')) {
      navigate('/');
    } else if (command.includes('star') || command.includes('unstar')) {
      handleToggleStar();
    } else if (command.includes('read') || command.includes('speak') || command.includes('tell me')) {
      handleReadAloud();
    } else if (command.includes('stop reading') || command.includes('stop speaking')) {
      setIsReading(false);
      stopSpeaking();
    }
  };
  
  useEffect(() => {
    return () => {
      if (window.recognition) {
        window.recognition.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  return (
    <Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress aria-label="Loading email" />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }} aria-live="assertive">
          {error}
        </Alert>
      ) : email ? (
        <Paper elevation={1} sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center">
              <IconButton 
                onClick={() => navigate('/')}
                aria-label="Back to inbox"
              >
                <ArrowBack />
              </IconButton>
              <Typography variant="h5" ml={1} component="h1">
                {email.subject}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Tooltip title={isReading ? "Stop reading" : "Read aloud"}>
                <IconButton 
                  color={isReading ? "primary" : "default"} 
                  onClick={handleReadAloud}
                  aria-label={isReading ? "Stop reading email aloud" : "Read email aloud"}
                >
                  {isReading ? <Pause /> : <PlayArrow />}
                </IconButton>
              </Tooltip>
              <Tooltip title={isVoiceEnabled ? "Disable voice commands" : "Enable voice commands"}>
                <IconButton 
                  color={isVoiceEnabled ? "primary" : "default"} 
                  onClick={toggleVoiceRecognition}
                  aria-label={isVoiceEnabled ? "Disable voice commands" : "Enable voice commands"}
                >
                  {isVoiceEnabled ? <Mic /> : <MicOff />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {transcript && (
            <Box 
              sx={{ width: '100%', mb: 2, p: 1, bgcolor: '#f0f0f0', borderRadius: 1 }}
              aria-live="polite"
            >
              <Typography variant="body2">{transcript}</Typography>
            </Box>
          )}
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center">
              <Typography variant="subtitle1" component="div" fontWeight="bold">
                {getSenderName(email.from)}
              </Typography>
              <Typography variant="body2" color="text.secondary" ml={1}>
                {`<${email.from}>`}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatDate(email.createdAt)}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" mb={2}>
            To: {email.to}
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box mb={3}>
            <Typography 
              variant="body1" 
              component="div" 
              sx={{ 
                whiteSpace: 'pre-line',
                mb: 3 
              }}
            >
              {email.body}
            </Typography>
            
            {email.attachments && email.attachments.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Attachments:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {email.attachments.map((attachment, index) => (
                    <Chip
                      key={index}
                      label={attachment.filename}
                      component="a"
                      href={attachment.path}
                      clickable
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box display="flex" gap={2}>
            <Button 
              variant="contained" 
              startIcon={<Reply />}
              onClick={handleReply}
              aria-label="Reply to email"
            >
              Reply
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<Forward />}
              onClick={handleForward}
              aria-label="Forward email"
            >
              Forward
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<Delete />}
              color="error"
              onClick={handleDelete}
              aria-label="Delete email"
            >
              Delete
            </Button>
            <IconButton 
              onClick={handleToggleStar}
              aria-label={email.isStarred ? "Unstar this email" : "Star this email"}
            >
              {email.isStarred ? <Star color="primary" /> : <StarBorder />}
            </IconButton>
          </Box>
        </Paper>
      ) : (
        <Alert severity="warning">Email not found</Alert>
      )}
    </Box>
  );
};

export default EmailView; 