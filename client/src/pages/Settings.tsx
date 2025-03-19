import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormControlLabel,
  Switch,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Save,
  Contrast,
  TextIncrease,
  TextDecrease,
  VolumeUp,
  Mic,
  MicOff
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useVoice } from '../contexts/VoiceContext';
import axios from 'axios';

type UserPreferences = {
  fontSize: string;
  highContrast: boolean;
  voiceSpeed: number;
};

const Settings = () => {
  const { user, token, updatePreferences } = useAuth();
  const { speak } = useVoice();
  
  const [fontSize, setFontSize] = useState<string>(user?.preferences?.fontSize || 'medium');
  const [highContrast, setHighContrast] = useState<boolean>(user?.preferences?.highContrast || false);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(user?.preferences?.voiceSpeed || 1);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // Initialize settings from user preferences
  useEffect(() => {
    if (user?.preferences) {
      setFontSize(user.preferences.fontSize);
      setHighContrast(user.preferences.highContrast);
      setVoiceSpeed(user.preferences.voiceSpeed);
    }
  }, [user]);
  
  // Apply high contrast mode to the document
  useEffect(() => {
    const rootElement = document.documentElement;
    
    if (highContrast) {
      rootElement.style.setProperty('--background-color', '#000000');
      rootElement.style.setProperty('--text-color', '#ffffff');
      rootElement.style.setProperty('--link-color', '#ffff00');
      rootElement.style.setProperty('--contrast-mode', 'high');
    } else {
      rootElement.style.removeProperty('--background-color');
      rootElement.style.removeProperty('--text-color');
      rootElement.style.removeProperty('--link-color');
      rootElement.style.removeProperty('--contrast-mode');
    }
    
    return () => {
      // Only remove if we applied it in this component
      if (highContrast) {
        rootElement.style.removeProperty('--background-color');
        rootElement.style.removeProperty('--text-color');
        rootElement.style.removeProperty('--link-color');
        rootElement.style.removeProperty('--contrast-mode');
      }
    };
  }, [highContrast]);
  
  // Apply font size to the document
  useEffect(() => {
    const rootElement = document.documentElement;
    
    switch (fontSize) {
      case 'small':
        rootElement.style.setProperty('--font-scale', '0.9');
        break;
      case 'medium':
        rootElement.style.setProperty('--font-scale', '1');
        break;
      case 'large':
        rootElement.style.setProperty('--font-scale', '1.2');
        break;
      default:
        rootElement.style.setProperty('--font-scale', '1');
    }
    
    return () => {
      rootElement.style.removeProperty('--font-scale');
    };
  }, [fontSize]);
  
  // Save preferences
  const handleSave = async () => {
    setSuccess('');
    setError('');
    
    try {
      const preferences: UserPreferences = {
        fontSize,
        highContrast,
        voiceSpeed
      };
      
      await updatePreferences(preferences);
      setSuccess('Settings saved successfully');
      speak('Your accessibility settings have been saved');
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save settings');
      speak('Failed to save settings. Please try again.');
    }
  };
  
  // Test voice speed
  const handleTestVoice = () => {
    const testUtterance = new SpeechSynthesisUtterance(
      'This is a test of the voice speed setting. You can adjust the slider to make the voice faster or slower.'
    );
    testUtterance.rate = voiceSpeed;
    window.speechSynthesis.speak(testUtterance);
  };
  
  // Toggle voice recognition
  const toggleVoiceRecognition = () => {
    if (isVoiceEnabled) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };
  
  // Start voice recognition
  const startVoiceRecognition = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsVoiceEnabled(true);
        speak('Voice recognition enabled. You can say commands like "set font size to large" or "enable high contrast".');
      };
      
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        
        // Process voice commands
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
      // @ts-ignore - Adding to the window object for cleanup
      window.recognition = recognition;
    } else {
      alert('Speech recognition is not supported in your browser');
    }
  };
  
  // Stop voice recognition
  const stopVoiceRecognition = () => {
    if (window.recognition) {
      window.recognition.stop();
      setIsVoiceEnabled(false);
      speak('Voice commands disabled');
    }
  };
  
  // Process voice commands
  const processVoiceCommand = (command: string) => {
    if (command.includes('font size') || command.includes('text size')) {
      if (command.includes('small')) {
        setFontSize('small');
        speak('Font size set to small');
      } else if (command.includes('medium') || command.includes('normal')) {
        setFontSize('medium');
        speak('Font size set to medium');
      } else if (command.includes('large') || command.includes('big')) {
        setFontSize('large');
        speak('Font size set to large');
      }
    } else if (command.includes('contrast')) {
      if (command.includes('enable') || command.includes('turn on') || command.includes('high')) {
        setHighContrast(true);
        speak('High contrast mode enabled');
      } else if (command.includes('disable') || command.includes('turn off') || command.includes('normal')) {
        setHighContrast(false);
        speak('High contrast mode disabled');
      } else {
        setHighContrast(!highContrast);
        speak(highContrast ? 'High contrast mode disabled' : 'High contrast mode enabled');
      }
    } else if (command.includes('voice speed') || command.includes('speaking speed') || command.includes('speech rate')) {
      if (command.includes('slow') || command.includes('slower')) {
        setVoiceSpeed(Math.max(0.5, voiceSpeed - 0.2));
        speak('Voice speed decreased');
      } else if (command.includes('fast') || command.includes('faster')) {
        setVoiceSpeed(Math.min(2, voiceSpeed + 0.2));
        speak('Voice speed increased');
      } else if (command.includes('normal') || command.includes('default') || command.includes('reset')) {
        setVoiceSpeed(1);
        speak('Voice speed set to normal');
      }
    } else if (command.includes('save') || command.includes('update') || command.includes('apply')) {
      handleSave();
    } else if (command.includes('test voice') || command.includes('test speech')) {
      handleTestVoice();
    }
  };
  
  // Cleanup speech recognition on component unmount
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
  
  // Preview text with current font size setting
  const getFontSizeInPx = () => {
    switch (fontSize) {
      case 'small': return '14px';
      case 'medium': return '16px';
      case 'large': return '20px';
      default: return '16px';
    }
  };
  
  return (
    <Box>
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3,
          bgcolor: highContrast ? '#000' : 'background.paper',
          color: highContrast ? '#fff' : 'text.primary'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Accessibility Settings
          </Typography>
          <Tooltip title={isVoiceEnabled ? "Disable voice commands" : "Enable voice commands"}>
            <IconButton 
              color={isVoiceEnabled ? "primary" : "default"} 
              onClick={toggleVoiceRecognition}
              aria-label={isVoiceEnabled ? "Disable voice commands" : "Enable voice commands"}
              sx={{ color: highContrast ? '#fff' : undefined }}
            >
              {isVoiceEnabled ? <Mic /> : <MicOff />}
            </IconButton>
          </Tooltip>
        </Box>
        
        {transcript && (
          <Box 
            sx={{ 
              width: '100%', 
              mb: 2, 
              p: 1, 
              bgcolor: highContrast ? '#333' : '#f0f0f0', 
              borderRadius: 1,
              color: highContrast ? '#fff' : 'text.primary'
            }}
            aria-live="polite"
          >
            <Typography variant="body2">{transcript}</Typography>
          </Box>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} aria-live="assertive">
            {success}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} aria-live="assertive">
            {error}
          </Alert>
        )}
        
        <Divider sx={{ mb: 4 }} />
        
        <Grid container spacing={4}>
          {/* Display Settings */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Contrast sx={{ mr: 1 }} /> Display Settings
            </Typography>
            
            <Box mb={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                    color="primary"
                  />
                }
                label="High Contrast Mode"
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ mt: 3 }}>
                <Typography id="font-size-label" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextIncrease sx={{ mr: 1 }} /> Font Size
                </Typography>
                
                <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                  <Select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value as string)}
                    aria-labelledby="font-size-label"
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                  </Select>
                </FormControl>
                
                <Typography variant="body1" sx={{ mt: 2, fontSize: getFontSizeInPx() }}>
                  This is how your text will appear with the selected font size.
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          {/* Voice Settings */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <VolumeUp sx={{ mr: 1 }} /> Voice Settings
            </Typography>
            
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography id="voice-speed-slider" gutterBottom>
                Voice Speed: {voiceSpeed.toFixed(1)}x
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextDecrease sx={{ mr: 1 }} />
                <Slider
                  aria-labelledby="voice-speed-slider"
                  value={voiceSpeed}
                  onChange={(_, newValue) => setVoiceSpeed(newValue as number)}
                  step={0.1}
                  marks
                  min={0.5}
                  max={2}
                  sx={{ mx: 2 }}
                />
                <TextIncrease sx={{ ml: 1 }} />
              </Box>
              
              <Button 
                variant="outlined" 
                onClick={handleTestVoice}
                sx={{ mt: 2 }}
                aria-label="Test voice speed"
              >
                Test Voice Speed
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4 }} />
        
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            onClick={handleSave}
            size="large"
            aria-label="Save settings"
          >
            Save Settings
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings; 