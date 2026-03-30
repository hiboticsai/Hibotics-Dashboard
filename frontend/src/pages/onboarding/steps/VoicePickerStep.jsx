import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { AlertCircle, Play, Pause, Volume2, Search, Check, Loader2 } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const VoicePickerStep = ({ formData, updateFormData, errors }) => {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(null);
  const audioRef = useRef(null);
  
  useEffect(() => {
    fetchVoices();
    return () => {
      // Cleanup audio on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  const fetchVoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API}/api/onboarding/voices`);
      if (!response.ok) {
        throw new Error('Failed to load voices');
      }
      const data = await response.json();
      setVoices(data);
    } catch (err) {
      console.error('Error fetching voices:', err);
      setError('Unable to load voice options. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const playPreview = async (voice) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (playingVoiceId === voice.voice_id) {
      setPlayingVoiceId(null);
      return;
    }
    
    setLoadingPreview(voice.voice_id);
    
    try {
      // Use the preview URL directly (ElevenLabs sample voices have direct URLs)
      let audioUrl = voice.preview_url;
      
      // If no preview URL, try the API endpoint
      if (!audioUrl) {
        const response = await fetch(`${API}/api/onboarding/voice-preview/${voice.voice_id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.redirect_url) {
            audioUrl = data.redirect_url;
          }
        }
      }
      
      if (!audioUrl) {
        setLoadingPreview(null);
        return;
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingVoiceId(null);
      };
      
      audio.oncanplaythrough = () => {
        setLoadingPreview(null);
        setPlayingVoiceId(voice.voice_id);
        audio.play();
      };
      
      audio.onerror = () => {
        setLoadingPreview(null);
        console.error('Failed to play audio');
      };
      
      audio.load();
    } catch (err) {
      setLoadingPreview(null);
      console.error('Error playing preview:', err);
    }
  };
  
  const selectVoice = (voice) => {
    updateFormData('selected_voice', voice);
  };
  
  const filteredVoices = voices.filter(voice => {
    const query = searchQuery.toLowerCase();
    return (
      voice.name?.toLowerCase().includes(query) ||
      voice.category?.toLowerCase().includes(query) ||
      Object.values(voice.labels || {}).some(v => 
        String(v).toLowerCase().includes(query)
      )
    );
  });
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading available voices...</p>
      </div>
    );
  }
  
  if (error && voices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchVoices} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Choose Your AI Voice</h3>
        <p className="text-sm text-muted-foreground">Select a voice that represents your brand</p>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search voices by name or style..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="voice-search-input"
        />
      </div>
      
      {/* Selected Voice Indicator */}
      {formData.selected_voice && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center gap-3">
          <Check className="h-5 w-5 text-primary" />
          <span className="text-sm">
            Selected: <span className="font-medium">{formData.selected_voice.name}</span>
          </span>
        </div>
      )}
      
      {errors.selected_voice && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {errors.selected_voice}
        </p>
      )}
      
      {/* Voice Grid */}
      <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredVoices.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No voices found matching "{searchQuery}"
          </p>
        ) : (
          filteredVoices.map((voice) => (
            <div
              key={voice.voice_id}
              className={`border rounded-lg p-4 transition-all cursor-pointer hover:border-primary/50 ${
                formData.selected_voice?.voice_id === voice.voice_id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border'
              }`}
              onClick={() => selectVoice(voice)}
              data-testid={`voice-option-${voice.voice_id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{voice.name}</span>
                    {formData.selected_voice?.voice_id === voice.voice_id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {voice.category && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {voice.category}
                      </span>
                    )}
                    {voice.labels?.accent && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {voice.labels.accent}
                      </span>
                    )}
                    {voice.labels?.age && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {voice.labels.age}
                      </span>
                    )}
                    {voice.labels?.gender && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {voice.labels.gender}
                      </span>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-4 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    playPreview(voice);
                  }}
                  disabled={loadingPreview === voice.voice_id}
                  data-testid={`play-voice-${voice.voice_id}`}
                >
                  {loadingPreview === voice.voice_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : playingVoiceId === voice.voice_id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Tip:</span> Click the play button to preview 
          each voice. Choose a voice that matches your brand's personality and appeals to your customers.
        </p>
      </div>
    </div>
  );
};

export default VoicePickerStep;
