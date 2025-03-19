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
  Tooltip
} from '@mui/material';
import { Visibility, VisibilityOff, Mic, MicOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
      speakText('Login failed. Please check your credentials and try again.');
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
        speakText('Voice recognition enabled. Please speak your email and password.');
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
    
    if (lowerCommand.includes('email') && lowerCommand.includes('is')) {
      const emailMatch = lowerCommand.match(/email is (.+?)( and| password|$)/i);
      if (emailMatch && emailMatch[1]) {
        const spokenEmail = emailMatch[1].trim().replace(/\s+at\s+/g, '@')
          .replace(/\s+dot\s+/g, '.')
          .replace(/\s+/g, '');
        setEmail(spokenEmail);
        speakText(`Email set to ${spokenEmail}`);
      }
    }
    
    if (lowerCommand.includes('password') && lowerCommand.includes('is')) {
      // Extract password from voice command
      const passwordMatch = lowerCommand.match(/password is (.+?)( and| email|$)/i);
      if (passwordMatch && passwordMatch[1]) {
        const spokenPassword = passwordMatch[1].trim();
        setPassword(spokenPassword);
        speakText('Password has been set');
      }
    }
    
    if (lowerCommand.includes('login') || lowerCommand.includes('sign in') || lowerCommand.includes('log in')) {
      handleSubmit(new Event('submit') as any);
    }
    
    if (lowerCommand.includes('register') || lowerCommand.includes('sign up')) {
      navigate('/register');
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
          Voice Email Login
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
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
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
            autoComplete="current-password"
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
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            aria-label="Sign In"
          >
            Sign In
          </Button>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link component={RouterLink} to="/register" variant="body2">
              {"Don't have an account? Sign Up"}
            </Link>
            
            <Tooltip title={isVoiceEnabled ? "Disable voice commands" : "Enable voice commands"}>
              <IconButton 
                color={isVoiceEnabled ? "primary" : "default"} 
                aria-label={isVoiceEnabled ? "Disable voice commands" : "Enable voice commands"}
                onClick={toggleVoiceRecognition}
              >
                {isVoiceEnabled ? <Mic /> : <MicOff />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    recognition: any;
  }
}

export default Login; 