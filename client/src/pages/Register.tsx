import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Link, 
  Paper,
  IconButton,
  InputAdornment,
  Alert,
  Tooltip,
  Grid
} from '@mui/material';
import { Visibility, VisibilityOff, Mic, MicOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      speakText('Passwords do not match. Please try again.');
      return;
    }
    
    try {
      await register(name, email, password);
      navigate('/');
      speakText('Registration successful. Welcome to Voice Email!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
      speakText('Registration failed. Please check your information and try again.');
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
        speakText('Voice recognition enabled. Please speak your information for registration.');
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
      speakText('Voice recognition disabled');
    }
  };
  
  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('name') && lowerCommand.includes('is')) {
      const nameMatch = lowerCommand.match(/name is (.+?)( and| email| password|$)/i);
      if (nameMatch && nameMatch[1]) {
        const spokenName = nameMatch[1].trim();
        setName(spokenName);
        speakText(`Name set to ${spokenName}`);
      }
    }
    
    if (lowerCommand.includes('email') && lowerCommand.includes('is')) {
      const emailMatch = lowerCommand.match(/email is (.+?)( and| name| password|$)/i);
      if (emailMatch && emailMatch[1]) {
        const spokenEmail = emailMatch[1].trim().replace(/\s+at\s+/g, '@')
          .replace(/\s+dot\s+/g, '.')
          .replace(/\s+/g, '');
        setEmail(spokenEmail);
        speakText(`Email set to ${spokenEmail}`);
      }
    }
    
    if (lowerCommand.includes('password') && lowerCommand.includes('is')) {
      const passwordMatch = lowerCommand.match(/password is (.+?)( and| name| email|$)/i);
      if (passwordMatch && passwordMatch[1]) {
        const spokenPassword = passwordMatch[1].trim();
        setPassword(spokenPassword);
        setConfirmPassword(spokenPassword); // Auto-confirm for voice
        speakText('Password has been set');
      }
    }
    
    if (lowerCommand.includes('register') || lowerCommand.includes('sign up') || lowerCommand.includes('create account')) {
      handleSubmit(new Event('submit') as any);
    }
    
    if (lowerCommand.includes('login') || lowerCommand.includes('sign in')) {
      navigate('/login');
    }
  };
  
  // Text to speech for accessibility
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Cleanup speech recognition on component unmount
  React.useEffect(() => {
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
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={3}
        sx={{ 
          mt: 8, 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
          Create Account
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }} aria-live="assertive">
            {error}
          </Alert>
        )}
        
        {transcript && (
          <Box 
            sx={{ width: '100%', mb: 2, p: 1, bgcolor: '#f0f0f0', borderRadius: 1 }}
            aria-live="polite"
          >
            <Typography variant="body2">{transcript}</Typography>
          </Box>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Full Name"
            name="name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Full Name"
            inputProps={{
              'aria-required': 'true',
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email Address"
            inputProps={{
              'aria-required': 'true',
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Password"
            inputProps={{
              'aria-required': 'true',
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-label="Confirm Password"
            inputProps={{
              'aria-required': 'true',
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            aria-label="Register"
          >
            Create Account
          </Button>
          
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
            
            <Grid item>
              <Tooltip title={isVoiceEnabled ? "Disable voice commands" : "Enable voice commands"}>
                <IconButton 
                  color={isVoiceEnabled ? "primary" : "default"} 
                  aria-label={isVoiceEnabled ? "Disable voice commands" : "Enable voice commands"}
                  onClick={toggleVoiceRecognition}
                >
                  {isVoiceEnabled ? <Mic /> : <MicOff />}
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register; 