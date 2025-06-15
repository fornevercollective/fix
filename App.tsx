import React, { useState, useEffect, useCallback } from 'react';
import { NodeEditor } from './components/NodeEditor';
import { ViewportPanel } from './components/ViewportPanel';
import { TimelinePanel } from './components/TimelinePanel';
import { PropertyPanel } from './components/PropertyPanel';
import { AssetBrowser } from './components/AssetBrowser';
import { ScopesPanel } from './components/ScopesPanel';
import { PythonConsole } from './components/PythonConsole';
import { MenuBar } from './components/MenuBar';
import { ToolBar } from './components/ToolBar';
import { StatusBar } from './components/StatusBar';
import { Button } from './components/ui/button';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from './components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
import { useResponsive, getResponsiveStyles, type DeviceType } from './components/ui/use-responsive';
import { PanelLeft, Menu, Activity, Terminal } from 'lucide-react';

export default function App() {
  const [activeWorkspace, setActiveWorkspace] = useState('compositing');
  const [selectedNode, setSelectedNode] = useState({
    id: 'colorcorrect1',
    type: 'ColorCorrect',
    position: { x: 300, y: 400 },
    inputs: ['rgb'],
    outputs: ['rgb'],
    properties: { 
      master: { gain: 1.0, gamma: 1.0, offset: 0.0, saturation: 1.0, contrast: 1.0 },
      shadows: { gain: 1.0, gamma: 1.0, offset: 0.0, saturation: 1.0, contrast: 1.0 },
      midtones: { gain: 1.0, gamma: 1.0, offset: 0.0, saturation: 1.0, contrast: 1.0 },
      highlights: { gain: 1.0, gamma: 1.0, offset: 0.0, saturation: 1.0, contrast: 1.0 }
    }
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackState, setPlaybackState] = useState('stopped');
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [scopesPanelVisible, setScopesPanelVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deviceOverride, setDeviceOverride] = useState<DeviceType | null>(null);
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  const [viewportMode, setViewportMode] = useState('select'); // select, translate, rotate, scale

  const responsiveInfo = useResponsive();
  const actualDeviceType = deviceOverride || responsiveInfo.deviceType;
  const responsiveStyles = getResponsiveStyles({
    ...responsiveInfo,
    deviceType: actualDeviceType
  });

  // Nuke-style keyboard shortcuts handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Disable shortcuts when typing in input fields
    const activeElement = document.activeElement;
    const isInputActive = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true' ||
      activeElement.classList.contains('python-console-input')
    );

    if (!shortcutsEnabled || isInputActive) return;

    const { key, ctrlKey, shiftKey, altKey, metaKey } = event;
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const cmdOrCtrl = isMac ? metaKey : ctrlKey;

    // Prevent default for handled shortcuts
    const preventDefault = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    // Universal shortcuts (work in all workspaces)
    
    // File operations
    if (cmdOrCtrl && !shiftKey && !altKey) {
      switch (key) {
        case 'n':
        case 'N':
          preventDefault();
          const newEvent = new CustomEvent('app-new');
          document.dispatchEvent(newEvent);
          return;
        case 'o':
        case 'O':
          preventDefault();
          const openEvent = new CustomEvent('app-open');
          document.dispatchEvent(openEvent);
          return;
        case 's':
        case 'S':
          preventDefault();
          const saveEvent = new CustomEvent('app-save');
          document.dispatchEvent(saveEvent);
          return;
        case 'z':
        case 'Z':
          preventDefault();
          const undoEvent = new CustomEvent('app-undo', { detail: { workspace: activeWorkspace } });
          document.dispatchEvent(undoEvent);
          return;
        case 'y':
        case 'Y':
          preventDefault();
          const redoEvent = new CustomEvent('app-redo', { detail: { workspace: activeWorkspace } });
          document.dispatchEvent(redoEvent);
          return;
      }
    }

    // Redo alternative (Cmd+Shift+Z)
    if (cmdOrCtrl && shiftKey && !altKey) {
      switch (key) {
        case 'z':
        case 'Z':
          preventDefault();
          const redoEvent = new CustomEvent('app-redo', { detail: { workspace: activeWorkspace } });
          document.dispatchEvent(redoEvent);
          return;
        case 's':
        case 'S':
          preventDefault();
          const saveAsEvent = new CustomEvent('app-save-as');
          document.dispatchEvent(saveAsEvent);
          return;
      }
    }

    // Playback controls (Nuke-style)
    if (!cmdOrCtrl && !shiftKey && !altKey) {
      switch (key) {
        case ' ':
        case 'Space':
          preventDefault();
          setPlaybackState(prev => prev === 'playing' ? 'stopped' : 'playing');
          return;
        case 'ArrowLeft':
          preventDefault();
          setCurrentTime(prev => Math.max(0, prev - 1));
          return;
        case 'ArrowRight':
          preventDefault();
          setCurrentTime(prev => prev + 1);
          return;
        case 'Home':
          preventDefault();
          setCurrentTime(0);
          return;
        case 'End':
          preventDefault();
          setCurrentTime(200); // Go to end
          return;
        case 'ArrowUp':
          preventDefault();
          setCurrentTime(prev => Math.max(0, prev - 10));
          return;
        case 'ArrowDown':
          preventDefault();
          setCurrentTime(prev => prev + 10);
          return;
      }
    }

    // Page Up/Down for larger jumps
    if (!cmdOrCtrl && !shiftKey && !altKey) {
      switch (key) {
        case 'PageUp':
          preventDefault();
          setCurrentTime(prev => Math.max(0, prev - 50));
          return;
        case 'PageDown':
          preventDefault();
          setCurrentTime(prev => prev + 50);
          return;
      }
    }

    // Workspace switching (Nuke-style function keys + numbers)
    if (!cmdOrCtrl && !shiftKey && !altKey) {
      switch (key) {
        case '1':
          preventDefault();
          setActiveWorkspace('compositing');
          return;
        case '2':
          preventDefault();
          setActiveWorkspace('3d');
          return;
        case '3':
          preventDefault();
          setActiveWorkspace('scopes');
          return;
        case '4':
          preventDefault();
          setActiveWorkspace('timeline');
          return;
        case '5':
          preventDefault();
          setActiveWorkspace('python');
          return;
      }
    }

    // Node Editor shortcuts (when in compositing workspace)
    if (activeWorkspace === 'compositing') {
      if (!cmdOrCtrl && !shiftKey && !altKey) {
        switch (key) {
          case 'Tab':
            preventDefault();
            const addNodeEvent = new CustomEvent('node-add-menu');
            document.dispatchEvent(addNodeEvent);
            return;
          case 'Delete':
          case 'Backspace':
            preventDefault();
            const deleteNodeEvent = new CustomEvent('node-delete-selected');
            document.dispatchEvent(deleteNodeEvent);
            return;
          case 'f':
          case 'F':
            preventDefault();
            // Frame selected nodes
            const frameSelectedEvent = new CustomEvent('node-frame-selected');
            document.dispatchEvent(frameSelectedEvent);
            return;
          case 'h':
          case 'H':
            preventDefault();
            // Home/frame all nodes
            const frameAllEvent = new CustomEvent('node-frame-all');
            document.dispatchEvent(frameAllEvent);
            return;
          case 'd':
          case 'D':
            preventDefault();
            // Disable/enable selected nodes
            const disableEvent = new CustomEvent('node-toggle-disable');
            document.dispatchEvent(disableEvent);
            return;
          case 'g':
          case 'G':
            preventDefault();
            // Toggle grid snap
            const gridSnapEvent = new CustomEvent('node-toggle-grid-snap');
            document.dispatchEvent(gridSnapEvent);
            return;
          case 'b':
          case 'B':
            preventDefault();
            // Create backdrop
            const backdropEvent = new CustomEvent('node-create-backdrop');
            document.dispatchEvent(backdropEvent);
            return;
          case 'n':
          case 'N':
            preventDefault();
            // Create note
            const noteEvent = new CustomEvent('node-create-note');
            document.dispatchEvent(noteEvent);
            return;
        }
      }

      // Node editing with modifiers
      if (cmdOrCtrl && !shiftKey && !altKey) {
        switch (key) {
          case 'd':
          case 'D':
            preventDefault();
            const duplicateEvent = new CustomEvent('node-duplicate-selected');
            document.dispatchEvent(duplicateEvent);
            return;
          case 'a':
          case 'A':
            preventDefault();
            const selectAllEvent = new CustomEvent('node-select-all');
            document.dispatchEvent(selectAllEvent);
            return;
          case 'g':
          case 'G':
            preventDefault();
            // Group selected nodes
            const groupEvent = new CustomEvent('node-group-selected');
            document.dispatchEvent(groupEvent);
            return;
          case 'u':
          case 'U':
            preventDefault();
            // Ungroup selected group
            const ungroupEvent = new CustomEvent('node-ungroup-selected');
            document.dispatchEvent(ungroupEvent);
            return;
        }
      }

      // Shift+shortcuts for node operations
      if (!cmdOrCtrl && shiftKey && !altKey) {
        switch (key) {
          case 'D':
          case 'd':
            preventDefault();
            // Show/hide disabled nodes
            const showDisabledEvent = new CustomEvent('node-toggle-show-disabled');
            document.dispatchEvent(showDisabledEvent);
            return;
          case 'A':
          case 'a':
            preventDefault();
            // Deselect all
            const deselectAllEvent = new CustomEvent('node-deselect-all');
            document.dispatchEvent(deselectAllEvent);
            return;
        }
      }

      // Alt+shortcuts for advanced node operations  
      if (!cmdOrCtrl && !shiftKey && altKey) {
        switch (key) {
          case 'c':
          case 'C':
            preventDefault();
            // Clone selected nodes
            const cloneEvent = new CustomEvent('node-clone-selected');
            document.dispatchEvent(cloneEvent);
            return;
          case 'x':
          case 'X':
            preventDefault();
            // Extract selected
            const extractEvent = new CustomEvent('node-extract-selected');
            document.dispatchEvent(extractEvent);
            return;
        }
      }
    }

    // 3D Viewport shortcuts (when in 3d workspace)
    if (activeWorkspace === '3d') {
      if (!cmdOrCtrl && !shiftKey && !altKey) {
        switch (key) {
          case 't':
          case 'T':
            preventDefault();
            setViewportMode('translate');
            const translateEvent = new CustomEvent('viewport-set-translate-mode');
            document.dispatchEvent(translateEvent);
            return;
          case 'r':
          case 'R':
            preventDefault();
            setViewportMode('rotate');
            const rotateEvent = new CustomEvent('viewport-set-rotate-mode');
            document.dispatchEvent(rotateEvent);
            return;
          case 's':
          case 'S':
            preventDefault();
            setViewportMode('scale');
            const scaleEvent = new CustomEvent('viewport-set-scale-mode');
            document.dispatchEvent(scaleEvent);
            return;
          case 'f':
          case 'F':
            preventDefault();
            // Frame selected objects
            const frameSelectedEvent = new CustomEvent('viewport-frame-selected');
            document.dispatchEvent(frameSelectedEvent);
            return;
          case 'h':
          case 'H':
            preventDefault();
            // Frame all objects
            const frameAllEvent = new CustomEvent('viewport-frame-all');
            document.dispatchEvent(frameAllEvent);
            return;
          case 'g':
          case 'G':
            preventDefault();
            // Toggle grid
            const gridEvent = new CustomEvent('viewport-toggle-grid');
            document.dispatchEvent(gridEvent);
            return;
          case 'w':
          case 'W':
            preventDefault();
            // Toggle wireframe
            const wireframeEvent = new CustomEvent('viewport-toggle-wireframe');
            document.dispatchEvent(wireframeEvent);
            return;
          case 'z':
          case 'Z':
            preventDefault();
            // Toggle shading mode
            const shadingEvent = new CustomEvent('viewport-toggle-shading');
            document.dispatchEvent(shadingEvent);
            return;
        }
      }

      // Viewport navigation with Alt
      if (!cmdOrCtrl && !shiftKey && altKey) {
        switch (key) {
          case 'ArrowLeft':
            preventDefault();
            const orbitLeftEvent = new CustomEvent('viewport-orbit-left');
            document.dispatchEvent(orbitLeftEvent);
            return;
          case 'ArrowRight':
            preventDefault();
            const orbitRightEvent = new CustomEvent('viewport-orbit-right');
            document.dispatchEvent(orbitRightEvent);
            return;
          case 'ArrowUp':
            preventDefault();
            const orbitUpEvent = new CustomEvent('viewport-orbit-up');
            document.dispatchEvent(orbitUpEvent);
            return;
          case 'ArrowDown':
            preventDefault();
            const orbitDownEvent = new CustomEvent('viewport-orbit-down');
            document.dispatchEvent(orbitDownEvent);
            return;
        }
      }

      // Camera presets
      if (!cmdOrCtrl && !shiftKey && !altKey) {
        switch (key) {
          case '7':
            preventDefault();
            const topViewEvent = new CustomEvent('viewport-camera-top');
            document.dispatchEvent(topViewEvent);
            return;
          case '1':
            preventDefault();
            const frontViewEvent = new CustomEvent('viewport-camera-front');
            document.dispatchEvent(frontViewEvent);
            return;
          case '3':
            preventDefault();
            const rightViewEvent = new CustomEvent('viewport-camera-right');
            document.dispatchEvent(rightViewEvent);
            return;
          case '0':
            preventDefault();
            const perspectiveEvent = new CustomEvent('viewport-camera-perspective');
            document.dispatchEvent(perspectiveEvent);
            return;
        }
      }
    }

    // Timeline shortcuts (when in timeline workspace)
    if (activeWorkspace === 'timeline') {
      if (!cmdOrCtrl && !shiftKey && !altKey) {
        switch (key) {
          case 'f':
          case 'F':
            preventDefault();
            // Fit timeline to content
            const fitEvent = new CustomEvent('timeline-fit-content');
            document.dispatchEvent(fitEvent);
            return;
          case 'i':
          case 'I':
            preventDefault();
            // Set in point
            const inPointEvent = new CustomEvent('timeline-set-in-point');
            document.dispatchEvent(inPointEvent);
            return;
          case 'o':
          case 'O':
            preventDefault();
            // Set out point  
            const outPointEvent = new CustomEvent('timeline-set-out-point');
            document.dispatchEvent(outPointEvent);
            return;
          case 'x':
          case 'X':
            preventDefault();
            // Cut/razor tool
            const cutEvent = new CustomEvent('timeline-cut-at-playhead');
            document.dispatchEvent(cutEvent);
            return;
          case 'c':
          case 'C':
            preventDefault();
            // Copy selected clips
            const copyEvent = new CustomEvent('timeline-copy-selected');
            document.dispatchEvent(copyEvent);
            return;
          case 'v':
          case 'V':
            preventDefault();
            // Paste clips
            const pasteEvent = new CustomEvent('timeline-paste');
            document.dispatchEvent(pasteEvent);
            return;
        }
      }

      // Timeline zoom
      if (!cmdOrCtrl && !shiftKey && !altKey) {
        switch (key) {
          case '=':
          case '+':
            preventDefault();
            const zoomInEvent = new CustomEvent('timeline-zoom-in');
            document.dispatchEvent(zoomInEvent);
            return;
          case '-':
          case '_':
            preventDefault();
            const zoomOutEvent = new CustomEvent('timeline-zoom-out');
            document.dispatchEvent(zoomOutEvent);
            return;
        }
      }

      // Track operations with Shift
      if (!cmdOrCtrl && shiftKey && !altKey) {
        switch (key) {
          case 'M':
          case 'm':
            preventDefault();
            // Toggle mute on selected tracks
            const muteEvent = new CustomEvent('timeline-toggle-mute-selected');
            document.dispatchEvent(muteEvent);
            return;
          case 'S':
          case 's':
            preventDefault();
            // Toggle solo on selected tracks
            const soloEvent = new CustomEvent('timeline-toggle-solo-selected');
            document.dispatchEvent(soloEvent);
            return;
          case 'L':
          case 'l':
            preventDefault();
            // Toggle lock on selected tracks
            const lockEvent = new CustomEvent('timeline-toggle-lock-selected');
            document.dispatchEvent(lockEvent);
            return;
        }
      }
    }

    // Video Scopes shortcuts (when in scopes workspace)
    if (activeWorkspace === 'scopes') {
      if (!cmdOrCtrl && !shiftKey && !altKey) {
        switch (key) {
          case 'w':
          case 'W':
            preventDefault();
            // Switch to waveform
            const waveformEvent = new CustomEvent('scopes-switch-waveform');
            document.dispatchEvent(waveformEvent);
            return;
          case 'v':
          case 'V':
            preventDefault();
            // Switch to vectorscope
            const vectorscopeEvent = new CustomEvent('scopes-switch-vectorscope');
            document.dispatchEvent(vectorscopeEvent);
            return;
          case 'h':
          case 'H':
            preventDefault();
            // Switch to histogram
            const histogramEvent = new CustomEvent('scopes-switch-histogram');
            document.dispatchEvent(histogramEvent);
            return;
          case 'r':
          case 'R':
            preventDefault();
            // Switch to RGB parade
            const rgbParadeEvent = new CustomEvent('scopes-switch-rgb-parade');
            document.dispatchEvent(rgbParadeEvent);
            return;
          case 'f':
          case 'F':
            preventDefault();
            // Freeze scopes
            const freezeEvent = new CustomEvent('scopes-toggle-freeze');
            document.dispatchEvent(freezeEvent);
            return;
        }
      }
    }

    // Python Console shortcuts (when in python workspace)
    if (activeWorkspace === 'python') {
      if (cmdOrCtrl && !shiftKey && !altKey) {
        switch (key) {
          case 'Enter':
            preventDefault();
            const executeEvent = new CustomEvent('python-execute');
            document.dispatchEvent(executeEvent);
            return;
          case 'l':
          case 'L':
            preventDefault();
            const clearEvent = new CustomEvent('python-clear');
            document.dispatchEvent(clearEvent);
            return;
        }
      }

      // Python-specific shortcuts
      if (!cmdOrCtrl && !shiftKey && !altKey) {
        switch (key) {
          case 'F5':
            preventDefault();
            const runScriptEvent = new CustomEvent('python-run-script');
            document.dispatchEvent(runScriptEvent);
            return;
        }
      }
    }

    // Panel visibility shortcuts (Nuke-style)
    if (!cmdOrCtrl && !shiftKey && altKey) {
      switch (key) {
        case '1':
          preventDefault();
          // Toggle Properties Panel
          setRightPanelVisible(prev => !prev);
          return;
        case '2':
          preventDefault();
          // Toggle Scopes Panel
          setScopesPanelVisible(prev => !prev);
          return;
        case '3':
          preventDefault();
          // Toggle Asset Browser
          if (actualDeviceType === 'mobile') {
            setMobileMenuOpen(prev => !prev);
          } else {
            setLeftPanelCollapsed(prev => !prev);
          }
          return;
      }
    }

    // Function keys for various operations
    if (!cmdOrCtrl && !shiftKey && !altKey) {
      switch (key) {
        case 'F1':
          preventDefault();
          const helpEvent = new CustomEvent('app-show-help');
          document.dispatchEvent(helpEvent);
          return;
        case 'F2':
          preventDefault();
          // Rename selected
          const renameEvent = new CustomEvent('app-rename-selected');
          document.dispatchEvent(renameEvent);
          return;
        case 'F3':
          preventDefault();
          // Find/search
          const findEvent = new CustomEvent('app-show-search');
          document.dispatchEvent(findEvent);
          return;
        case 'F9':
          preventDefault();
          // Render
          const renderEvent = new CustomEvent('app-render');
          document.dispatchEvent(renderEvent);
          return;
        case 'F11':
          preventDefault();
          // Toggle fullscreen
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
          return;
        case 'F12':
          preventDefault();
          // Toggle developer tools simulation
          const devToolsEvent = new CustomEvent('app-toggle-dev-tools');
          document.dispatchEvent(devToolsEvent);
          return;
      }
    }

    // Advanced shortcuts with Ctrl+Alt (debug/developer features)
    if (cmdOrCtrl && altKey && !shiftKey) {
      switch (key) {
        case 'k':
        case 'K':
          preventDefault();
          setShortcutsEnabled(prev => !prev);
          console.log('Keyboard shortcuts', shortcutsEnabled ? 'disabled' : 'enabled');
          return;
        case 'd':
        case 'D':
          preventDefault();
          const nextDevice: DeviceType[] = ['mobile', 'tablet', 'desktop', 'tv', 'vr'];
          const currentIndex = nextDevice.indexOf(actualDeviceType);
          const nextIndex = (currentIndex + 1) % nextDevice.length;
          setDeviceOverride(nextDevice[nextIndex]);
          console.log('Device override:', nextDevice[nextIndex]);
          return;
        case 'r':
        case 'R':
          preventDefault();
          // Reload application
          window.location.reload();
          return;
      }
    }

    // Quick node creation shortcuts (when in compositing workspace)
    if (activeWorkspace === 'compositing' && !cmdOrCtrl && !shiftKey && !altKey) {
      switch (key) {
        case 'c':
          if (event.target === document.body) { // Only if not in input
            preventDefault();
            const colorCorrectEvent = new CustomEvent('node-create-colorcorrect');
            document.dispatchEvent(colorCorrectEvent);
            return;
          }
          break;
        case 'm':
          if (event.target === document.body) {
            preventDefault();
            const mergeEvent = new CustomEvent('node-create-merge');
            document.dispatchEvent(mergeEvent);
            return;
          }
          break;
        case 'r':
          if (event.target === document.body) {
            preventDefault();
            const readEvent = new CustomEvent('node-create-read');
            document.dispatchEvent(readEvent);
            return;
          }
          break;
        case 'w':
          if (event.target === document.body) {
            preventDefault();
            const writeEvent = new CustomEvent('node-create-write');
            document.dispatchEvent(writeEvent);
            return;
          }
          break;
      }
    }
  }, [activeWorkspace, shortcutsEnabled, actualDeviceType, viewportMode]);

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Show Nuke-style shortcuts notification on first load
  useEffect(() => {
    const hasSeenShortcuts = localStorage.getItem('vfx-studio-nuke-shortcuts-seen');
    if (!hasSeenShortcuts) {
      setTimeout(() => {
        console.log('VFX Studio - Nuke-Style Keyboard Shortcuts:');
        console.log('Tab: Add Node | Delete: Delete | Ctrl+D: Duplicate');
        console.log('F: Frame Selected | H: Frame All | Space: Play/Pause');
        console.log('T/R/S: Transform modes | 1-5: Switch workspaces');
        console.log('Alt+1/2/3: Toggle Panels | F1: Show Help');
        localStorage.setItem('vfx-studio-nuke-shortcuts-seen', 'true');
      }, 2000);
    }
  }, []);

  const getLayoutClass = () => {
    switch (actualDeviceType) {
      case 'mobile': return 'mobile-layout';
      case 'tablet': return 'tablet-layout';
      case 'tv': return 'tv-layout';
      case 'vr':
      case 'xr': return 'vr-layout';
      default: return 'desktop-layout';
    }
  };

  const renderMobileLayout = () => (
    <div className="app-container">
      <div className="h-screen flex flex-col bg-background text-foreground mobile-layout overflow-hidden" style={responsiveStyles}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-3 bg-card border-b border-border shrink-0">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="touch-target">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="h-full flex flex-col">
                <div className="p-3 border-b border-border">
                  <h2 className="responsive-text-lg font-medium">VFX Studio</h2>
                </div>
                <div className="flex-1 overflow-hidden">
                  <AssetBrowser />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <h1 className="responsive-text-lg font-medium">VFX Studio</h1>
          
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="touch-target">
                  <Activity className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="h-full overflow-hidden">
                  <ScopesPanel selectedNode={selectedNode} currentTime={currentTime} />
                </div>
              </SheetContent>
            </Sheet>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="touch-target">
                  <PanelLeft className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="h-full overflow-hidden">
                  <PropertyPanel 
                    selectedNode={selectedNode} 
                    onClose={() => {}}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Toolbar */}
        <div className="shrink-0">
          <ToolBar 
            activeWorkspace={activeWorkspace}
            setActiveWorkspace={setActiveWorkspace}
            playbackState={playbackState}
            setPlaybackState={setPlaybackState}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Tabs value={activeWorkspace} onValueChange={setActiveWorkspace} className="flex-1 flex flex-col min-h-0">
            <TabsList className="bg-card border-b border-border rounded-none grid grid-cols-5 shrink-0">
              <TabsTrigger value="compositing" className="responsive-text-sm">Nodes</TabsTrigger>
              <TabsTrigger value="3d" className="responsive-text-sm">3D</TabsTrigger>
              <TabsTrigger value="scopes" className="responsive-text-sm">Scopes</TabsTrigger>
              <TabsTrigger value="timeline" className="responsive-text-sm">Timeline</TabsTrigger>
              <TabsTrigger value="python" className="responsive-text-sm">Python</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 min-h-0">
              <TabsContent value="compositing" className="h-full m-0 workspace-panel">
                <NodeEditor 
                  selectedNode={selectedNode}
                  setSelectedNode={setSelectedNode}
                />
              </TabsContent>
              <TabsContent value="3d" className="h-full m-0 workspace-panel">
                <ViewportPanel currentTime={currentTime} />
              </TabsContent>
              <TabsContent value="scopes" className="h-full m-0 workspace-panel">
                <ScopesPanel selectedNode={selectedNode} currentTime={currentTime} />
              </TabsContent>
              <TabsContent value="timeline" className="h-full m-0 workspace-panel">
                <TimelinePanel 
                  currentTime={currentTime}
                  setCurrentTime={setCurrentTime}
                  playbackState={playbackState}
                />
              </TabsContent>
              <TabsContent value="python" className="h-full m-0 workspace-panel">
                <PythonConsole />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Mobile Status Bar */}
        <div className="shrink-0">
          <StatusBar 
            currentTime={currentTime}
            playbackState={playbackState}
            leftPanelVisible={false}
            onToggleLeftPanel={() => setMobileMenuOpen(true)}
          />
        </div>
      </div>
    </div>
  );

  const renderDesktopLayout = () => (
    <div className="app-container">
      <div className={`h-screen flex flex-col bg-background text-foreground ${getLayoutClass()} overflow-hidden`} style={responsiveStyles}>
        <div className="shrink-0">
          <MenuBar 
            leftPanelVisible={true}
            rightPanelVisible={rightPanelVisible}
            scopesPanelVisible={scopesPanelVisible}
            onToggleLeftPanel={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            onToggleRightPanel={() => setRightPanelVisible(!rightPanelVisible)}
            onToggleScopesPanel={() => setScopesPanelVisible(!scopesPanelVisible)}
            deviceOverride={deviceOverride}
            detectedDevice={responsiveInfo.deviceType}
            onDeviceOverrideChange={setDeviceOverride}
          />
        </div>
        <div className="shrink-0">
          <ToolBar 
            activeWorkspace={activeWorkspace}
            setActiveWorkspace={setActiveWorkspace}
            playbackState={playbackState}
            setPlaybackState={setPlaybackState}
            scopesPanelVisible={scopesPanelVisible}
            onToggleScopesPanel={() => setScopesPanelVisible(!scopesPanelVisible)}
          />
        </div>
        
        <div className="flex-1 flex relative min-h-0 overflow-hidden">
          {/* Show Right Panel Button (when hidden) */}
          {!rightPanelVisible && (
            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-2 z-10 h-8 w-8 p-0 bg-background/95 backdrop-blur-sm border-border/50 hover:bg-accent hover:border-border"
              onClick={() => setRightPanelVisible(true)}
              title="Show Properties Panel (Alt+1)"
            >
              <PanelLeft className="w-4 h-4 rotate-180" />
            </Button>
          )}
          
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            {/* Left Panel - Asset Browser (always visible) */}
            <ResizablePanel 
              defaultSize={leftPanelCollapsed ? 3 : (actualDeviceType === 'tv' ? 18 : 15)} 
              minSize={leftPanelCollapsed ? 3 : 12}
              maxSize={leftPanelCollapsed ? 3 : 30}
              className="side-panel"
            >
              <div className="h-full border-r border-border overflow-hidden">
                <AssetBrowser 
                  collapsed={leftPanelCollapsed}
                  onToggleCollapsed={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle />

            {/* Center Panel - Main Workspace */}
            <ResizablePanel defaultSize={
              rightPanelVisible && scopesPanelVisible ? 
                (leftPanelCollapsed ? 45 : 40) :
              rightPanelVisible ? 
                (leftPanelCollapsed ? 55 : 50) :
              scopesPanelVisible ? 
                (leftPanelCollapsed ? 55 : 50) :
              (leftPanelCollapsed ? 75 : 65)
            }>
              <ResizablePanelGroup direction="vertical" className="h-full">
                {/* Top - Node Editor / Viewport */}
                <ResizablePanel defaultSize={activeWorkspace === 'timeline' || activeWorkspace === 'python' ? 100 : 75}>
                  <Tabs value={activeWorkspace} onValueChange={setActiveWorkspace} className="h-full flex flex-col">
                    <TabsList className="bg-card border-b border-border rounded-none shrink-0">
                      <TabsTrigger value="compositing" className="responsive-text-xs">Node Graph</TabsTrigger>
                      <TabsTrigger value="3d" className="responsive-text-xs">3D Viewport</TabsTrigger>
                      <TabsTrigger value="scopes" className="responsive-text-xs">Video Scopes</TabsTrigger>
                      <TabsTrigger value="timeline" className="responsive-text-xs">Timeline</TabsTrigger>
                      <TabsTrigger value="python" className="responsive-text-xs">Python Console</TabsTrigger>
                    </TabsList>
                    <div className="flex-1 min-h-0">
                      <TabsContent value="compositing" className="h-full m-0 workspace-panel">
                        <NodeEditor 
                          selectedNode={selectedNode}
                          setSelectedNode={setSelectedNode}
                        />
                      </TabsContent>
                      <TabsContent value="3d" className="h-full m-0 workspace-panel">
                        <ViewportPanel currentTime={currentTime} />
                      </TabsContent>
                      <TabsContent value="scopes" className="h-full m-0 workspace-panel">
                        <ScopesPanel selectedNode={selectedNode} currentTime={currentTime} />
                      </TabsContent>
                      <TabsContent value="timeline" className="h-full m-0 workspace-panel">
                        <TimelinePanel 
                          currentTime={currentTime}
                          setCurrentTime={setCurrentTime}
                          playbackState={playbackState}
                        />
                      </TabsContent>
                      <TabsContent value="python" className="h-full m-0 workspace-panel">
                        <PythonConsole />
                      </TabsContent>
                    </div>
                  </Tabs>
                </ResizablePanel>

                {activeWorkspace !== 'timeline' && activeWorkspace !== 'python' && (
                  <>
                    <ResizableHandle />
                    {/* Bottom - Timeline (when not active workspace) */}
                    <ResizablePanel defaultSize={25} minSize={15}>
                      <div className="h-full border-t border-border overflow-hidden">
                        <TimelinePanel 
                          currentTime={currentTime}
                          setCurrentTime={setCurrentTime}
                          playbackState={playbackState}
                          compact={true}
                        />
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>

            {/* Right Panel - Properties */}
            {rightPanelVisible && (
              <>
                <ResizableHandle />
                <ResizablePanel 
                  defaultSize={actualDeviceType === 'tv' ? 25 : 20} 
                  minSize={18}
                  className="side-panel"
                >
                  <div className="h-full border-l border-border overflow-hidden">
                    <PropertyPanel 
                      selectedNode={selectedNode} 
                      onClose={() => setRightPanelVisible(false)}
                    />
                  </div>
                </ResizablePanel>
              </>
            )}

            {/* Scopes Panel */}
            {scopesPanelVisible && (
              <>
                <ResizableHandle />
                <ResizablePanel 
                  defaultSize={actualDeviceType === 'tv' ? 25 : 20} 
                  minSize={18}
                  className="side-panel"
                >
                  <div className="h-full border-l border-border overflow-hidden">
                    <ScopesPanel 
                      selectedNode={selectedNode} 
                      currentTime={currentTime}
                      onToggleVisibility={() => setScopesPanelVisible(false)}
                    />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        <div className="shrink-0">
          <StatusBar 
            currentTime={currentTime}
            playbackState={playbackState}
            leftPanelVisible={true}
            onToggleLeftPanel={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          />
        </div>
      </div>
    </div>
  );

  const renderTabletLayout = () => (
    <div className="app-container">
      <div className={`h-screen flex flex-col bg-background text-foreground ${getLayoutClass()} overflow-hidden`} style={responsiveStyles}>
        <div className="shrink-0">
          <MenuBar 
            leftPanelVisible={false}
            rightPanelVisible={rightPanelVisible}
            scopesPanelVisible={scopesPanelVisible}
            onToggleLeftPanel={() => {}}
            onToggleRightPanel={() => setRightPanelVisible(!rightPanelVisible)}
            onToggleScopesPanel={() => setScopesPanelVisible(!scopesPanelVisible)}
            deviceOverride={deviceOverride}
            detectedDevice={responsiveInfo.deviceType}
            onDeviceOverrideChange={setDeviceOverride}
          />
        </div>
        <div className="shrink-0">
          <ToolBar 
            activeWorkspace={activeWorkspace}
            setActiveWorkspace={setActiveWorkspace}
            playbackState={playbackState}
            setPlaybackState={setPlaybackState}
            scopesPanelVisible={scopesPanelVisible}
            onToggleScopesPanel={() => setScopesPanelVisible(!scopesPanelVisible)}
          />
        </div>
        
        <div className="flex-1 flex relative min-h-0 overflow-hidden">
          {/* Show Right Panel Button (when hidden) */}
          {!rightPanelVisible && !scopesPanelVisible && (
            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-2 z-10 h-8 w-8 p-0 bg-background/95 backdrop-blur-sm border-border/50 hover:bg-accent hover:border-border"
              onClick={() => setRightPanelVisible(true)}
              title="Show Properties Panel (Alt+1)"
            >
              <PanelLeft className="w-4 h-4 rotate-180" />
            </Button>
          )}
          
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            {/* Main Workspace */}
            <ResizablePanel defaultSize={rightPanelVisible || scopesPanelVisible ? 65 : 100}>
              <ResizablePanelGroup direction="vertical" className="h-full">
                {/* Top - Node Editor / Viewport */}
                <ResizablePanel defaultSize={70}>
                  <Tabs value={activeWorkspace} onValueChange={setActiveWorkspace} className="h-full flex flex-col">
                    <TabsList className="bg-card border-b border-border rounded-none grid grid-cols-5 shrink-0">
                      <TabsTrigger value="compositing" className="responsive-text-sm">Nodes</TabsTrigger>
                      <TabsTrigger value="3d" className="responsive-text-sm">3D</TabsTrigger>
                      <TabsTrigger value="scopes" className="responsive-text-sm">Scopes</TabsTrigger>
                      <TabsTrigger value="timeline" className="responsive-text-sm">Timeline</TabsTrigger>
                      <TabsTrigger value="python" className="responsive-text-sm">Python</TabsTrigger>
                    </TabsList>
                    <div className="flex-1 min-h-0">
                      <TabsContent value="compositing" className="h-full m-0 workspace-panel">
                        <NodeEditor 
                          selectedNode={selectedNode}
                          setSelectedNode={setSelectedNode}
                        />
                      </TabsContent>
                      <TabsContent value="3d" className="h-full m-0 workspace-panel">
                        <ViewportPanel currentTime={currentTime} />
                      </TabsContent>
                      <TabsContent value="scopes" className="h-full m-0 workspace-panel">
                        <ScopesPanel selectedNode={selectedNode} currentTime={currentTime} />
                      </TabsContent>
                      <TabsContent value="timeline" className="h-full m-0 workspace-panel">
                        <TimelinePanel 
                          currentTime={currentTime}
                          setCurrentTime={setCurrentTime}
                          playbackState={playbackState}
                        />
                      </TabsContent>
                      <TabsContent value="python" className="h-full m-0 workspace-panel">
                        <PythonConsole />
                      </TabsContent>
                    </div>
                  </Tabs>
                </ResizablePanel>

                <ResizableHandle />

                {/* Bottom - Timeline */}
                <ResizablePanel defaultSize={30} minSize={20}>
                  <div className="h-full border-t border-border overflow-hidden">
                    <TimelinePanel 
                      currentTime={currentTime}
                      setCurrentTime={setCurrentTime}
                      playbackState={playbackState}
                      compact={true}
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            {/* Right Panel - Properties or Scopes */}
            {(rightPanelVisible || scopesPanelVisible) && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={35} minSize={25}>
                  <div className="h-full border-l border-border overflow-hidden">
                    <Tabs value={scopesPanelVisible ? "scopes" : "properties"} className="h-full flex flex-col">
                      <TabsList className="bg-card border-b border-border rounded-none grid grid-cols-2 shrink-0">
                        <TabsTrigger value="properties" className="responsive-text-sm" onClick={() => {setRightPanelVisible(true); setScopesPanelVisible(false);}}>Properties</TabsTrigger>
                        <TabsTrigger value="scopes" className="responsive-text-sm" onClick={() => {setScopesPanelVisible(true); setRightPanelVisible(false);}}>Scopes</TabsTrigger>
                      </TabsList>
                      <div className="flex-1 min-h-0">
                        <TabsContent value="properties" className="h-full m-0 panel-content">
                          <PropertyPanel 
                            selectedNode={selectedNode} 
                            onClose={() => setRightPanelVisible(false)}
                          />
                        </TabsContent>
                        <TabsContent value="scopes" className="h-full m-0 panel-content">
                          <ScopesPanel selectedNode={selectedNode} currentTime={currentTime} />
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        <div className="shrink-0">
          <StatusBar 
            currentTime={currentTime}
            playbackState={playbackState}
            leftPanelVisible={false}
            onToggleLeftPanel={() => {}}
          />
        </div>
      </div>
    </div>
  );

  // Render the layout directly without custom cursor wrapper
  const renderLayout = () => {
    switch (actualDeviceType) {
      case 'mobile':
        return renderMobileLayout();
      case 'tablet':
        return renderTabletLayout();
      case 'vr':
      case 'xr':
      case 'tv':
      case 'ultrawide':
      case 'desktop':
      default:
        return renderDesktopLayout();
    }
  };

  return renderLayout();
}