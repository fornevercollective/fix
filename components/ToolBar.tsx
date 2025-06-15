import React from 'react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Layers,
  Box,
  Clock,
  Save,
  FolderOpen,
  Settings,
  Activity,
  Monitor
,
  Activity,
  Monitor
} from 'lucide-react';

interface ToolBarProps {
  activeWorkspace: string;
  setActiveWorkspace: (workspace: string) => void;
  playbackState: string;
  setPlaybackState: (state: string) => void;
  scopesPanelVisible?: boolean;
  onToggleScopesPanel?: () => void;
}

export function ToolBar({ 
  activeWorkspace, 
  setActiveWorkspace, 
  playbackState, 
  setPlaybackState,
  scopesPanelVisible = false,
  onToggleScopesPanel
}: ToolBarProps) {
  const handlePlayback = (action: string) => {
    if (action === 'play' && playbackState !== 'playing') {
      setPlaybackState('playing');
    } else if (action === 'pause') {
      setPlaybackState('paused');
    } else if (action === 'stop') {
      setPlaybackState('stopped');
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b border-border bg-muted/10">
      {/* File Operations */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm">
          <FolderOpen className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Save className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Workspace Toggle */}
      <ToggleGroup 
        type="single" 
        value={activeWorkspace} 
        onValueChange={(value) => value && setActiveWorkspace(value)}
        className="bg-background rounded-md"
      >
        <ToggleGroupItem value="compositing" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
          <Layers className="w-4 h-4 mr-1" />
          Comp
        </ToggleGroupItem>
        <ToggleGroupItem value="3d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
          <Box className="w-4 h-4 mr-1" />
          3D
        </ToggleGroupItem>
        <ToggleGroupItem value="scopes" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
          <Activity className="w-4 h-4 mr-1" />
          Scopes
        </ToggleGroupItem>
        <ToggleGroupItem value="timeline" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
          <Clock className="w-4 h-4 mr-1" />
          Timeline
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="h-6" />

      {/* Playback Controls */}
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handlePlayback('skip-back')}
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handlePlayback(playbackState === 'playing' ? 'pause' : 'play')}
        >
          {playbackState === 'playing' ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handlePlayback('stop')}
        >
          <Square className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handlePlayback('skip-forward')}
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Panel Controls */}
      {onToggleScopesPanel && (
        <>
          <div className="flex items-center gap-1">
            <Button 
              variant={scopesPanelVisible ? "default" : "ghost"} 
              size="sm"
              onClick={onToggleScopesPanel}
              title="Toggle Video Scopes Panel"
            >
              <Monitor className="w-4 h-4" />
            </Button>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Settings */}
      <div className="flex items-center gap-1 ml-auto">
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}