import React, { useState, useEffect } from 'react';
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

  const responsiveInfo = useResponsive();
  const actualDeviceType = deviceOverride || responsiveInfo.deviceType;
  const responsiveStyles = getResponsiveStyles({
    ...responsiveInfo,
    deviceType: actualDeviceType
  });

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
                  <PropertyPanel selectedNode={selectedNode} />
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
              title="Show Properties Panel (Ctrl+Shift+P)"
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
                    <PropertyPanel selectedNode={selectedNode} />
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
              title="Show Properties Panel (Ctrl+Shift+P)"
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
                          <PropertyPanel selectedNode={selectedNode} />
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
