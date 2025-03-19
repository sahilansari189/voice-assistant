import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import { 
  Send, 
  Delete, 
  ArrowBack, 
  Mic, 
  MicOff, 
  AttachFile
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';

const EmailCompose = () => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activeField, setActiveField] = useState<'to' | 'subject' | 'body'>('to');
  
  const { token, user } = useAuth();
  const { speak } = useVoice();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!to) {
      setError('Recipient email is required');
      speak('Please provide a recipient email address');
      return;
    }
    
    if (!subject) {
      setError('Subject is required');
      speak('Please provide a subject for your email');
      return;
    }
    
    if (!body) {
      setError('Email body is required');
      speak('Please write some content for your email');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('to', to);
      formData.append('subject', subject);
      formData.append('body', body);
      
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
      
      await axios.post('/api/emails/send', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess('Email sent successfully');
      speak('Your email has been sent successfully');
      
      setTo('');
      setSubject('');
      setBody('');
      setAttachments([]);
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send email');
      speak('Failed to send email. Please try again.');
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
      
      if (isVoiceEnabled) {
        speak(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} attached`);
      }
    }
  };
  
  const handleRemoveAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
    
    if (isVoiceEnabled) {
      speak('Attachment removed');
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
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsVoiceEnabled(true);
        speak(`Voice recognition enabled. You're currently focused on the ${activeField} field.`);
      };
      
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        
        processVoiceCommand(transcript);
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
      speak('Voice recognition disabled');
    }
  };
  
  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('focus') || lowerCommand.includes('go to')) {
      if (lowerCommand.includes('recipient') || lowerCommand.includes('to')) {
        setActiveField('to');
        speak('Now focused on recipient field');
        return;
      } else if (lowerCommand.includes('subject')) {
        setActiveField('subject');
        speak('Now focused on subject field');
        return;
      } else if (lowerCommand.includes('body') || lowerCommand.includes('message') || lowerCommand.includes('content')) {
        setActiveField('body');
        speak('Now focused on message body');
        return;
      }
    }
    
    if (lowerCommand.includes('send') || lowerCommand.includes('submit')) {
      handleSubmit(new Event('submit') as any);
      return;
    }
    
    if (lowerCommand.includes('clear') || lowerCommand.includes('delete')) {
      if (lowerCommand.includes('all') || lowerCommand.includes('everything')) {
        setTo('');
        setSubject('');
        setBody('');
        speak('All fields cleared');
      } else if (lowerCommand.includes('recipient') || lowerCommand.includes('to')) {
        setTo('');
        speak('Recipient field cleared');
      } else if (lowerCommand.includes('subject')) {
        setSubject('');
        speak('Subject field cleared');
      } else if (lowerCommand.includes('body') || lowerCommand.includes('message') || lowerCommand.includes('content')) {
        setBody('');
        speak('Message body cleared');
      }
      return;
    }
    
    if (lowerCommand.includes('cancel') || lowerCommand.includes('go back')) {
      navigate('/');
      return;
    }
    
    if (activeField === 'to' && !lowerCommand.includes('focus') && !lowerCommand.includes('go to')) {
      const cleanedEmail = command.trim().replace(/\s+at\s+/g, '@').replace(/\s+dot\s+/g, '.').replace(/\s+/g, '');
      setTo(cleanedEmail);
    } else if (activeField === 'subject' && !lowerCommand.includes('focus') && !lowerCommand.includes('go to')) {
      setSubject(command.trim());
    } else if (activeField === 'body' && !lowerCommand.includes('focus') && !lowerCommand.includes('go to')) {
      setBody(prev => prev ? `${prev} ${command.trim()}` : command.trim());
    }
  };
  
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
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
      <Paper elevation={1} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <IconButton 
              onClick={() => navigate('/')}
              aria-label="Go back to inbox"
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1" ml={1}>
              Compose Email
            </Typography>
          </Box>
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
        
        {transcript && (
          <Box 
            sx={{ width: '100%', mb: 2, p: 1, bgcolor: '#f0f0f0', borderRadius: 1 }}
            aria-live="polite"
          >
            <Typography variant="body2">{transcript}</Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} aria-live="assertive">
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} aria-live="assertive">
            {success}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            onFocus={() => setActiveField('to')}
            placeholder="Recipient's email address"
            aria-label="Recipient's email address"
            required
            InputProps={{
              sx: { 
                bgcolor: activeField === 'to' ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
              }
            }}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onFocus={() => setActiveField('subject')}
            placeholder="Email subject"
            aria-label="Email subject"
            required
            InputProps={{
              sx: { 
                bgcolor: activeField === 'subject' ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
              }
            }}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onFocus={() => setActiveField('body')}
            placeholder="Write your message here..."
            aria-label="Email body"
            multiline
            rows={10}
            required
            InputProps={{
              sx: { 
                bgcolor: activeField === 'body' ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
              }
            }}
          />
          
          {/* Attachments section */}
          {attachments.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Attachments:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {attachments.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onDelete={() => handleRemoveAttachment(index)}
                    aria-label={`Remove ${file.name} attachment`}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          <Grid container justifyContent="space-between" mt={3}>
            <Grid item>
              <Button
                variant="contained"
                color="error"
                startIcon={<Delete />}
                onClick={() => {
                  setTo('');
                  setSubject('');
                  setBody('');
                  setAttachments([]);
                  speak('Form cleared');
                }}
                aria-label="Clear form"
              >
                Clear
              </Button>
            </Grid>
            
            <Grid item>
              <Box display="flex" gap={2}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<AttachFile />}
                  aria-label="Attach files"
                >
                  Attach Files
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleFileUpload}
                    aria-hidden="true"
                  />
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<Send />}
                  aria-label="Send email"
                >
                  Send
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default EmailCompose; 