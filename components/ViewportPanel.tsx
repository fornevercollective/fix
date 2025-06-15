import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { 
  RotateCcw, 
  Move3D, 
  RotateCw, 
  Maximize, 
  Grid3X3,
  Eye,
  Sun,
  Camera
} from 'lucide-react';

interface ViewportPanelProps {
  currentTime: number;
}

// Prevent multiple Three.js imports
let threeJSCache: any = null;

export function ViewportPanel({ currentTime }: ViewportPanelProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState('perspective');
  const [renderMode, setRenderMode] = useState('solid');
  const [isInitialized, setIsInitialized] = useState(false);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const animationIdRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current || isInitialized) return;

    const initThreeJS = async () => {
      try {
        // Use cached Three.js to prevent multiple imports
        if (!threeJSCache) {
          threeJSCache = await import('three');
        }
        const THREE = threeJSCache;
        
        const width = mountRef.current?.clientWidth || 800;
        const height = mountRef.current?.clientHeight || 600;

        // Scene with white background for pure theme
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0xffffff); // White background
        rendererRef.current = renderer;

        // Clear any existing content
        if (mountRef.current) {
          mountRef.current.innerHTML = '';
          mountRef.current.appendChild(renderer.domElement);
        }

        // Grid with black lines on white background
        const gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        // Axes helper with black colors
        const axesHelper = new THREE.AxesHelper(5);
        // Override axes colors to be more visible on white background
        axesHelper.setColors(0xff0000, 0x00ff00, 0x0000ff); // Red, Green, Blue for X, Y, Z
        scene.add(axesHelper);

        // Default objects with black and white materials
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshPhongMaterial({ 
          color: 0x000000,
          shininess: 30
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0.5, 0);
        cube.castShadow = true;
        scene.add(cube);

        // Sphere with white material
        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xffffff,
          shininess: 50
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(2, 0.5, 0);
        sphere.castShadow = true;
        scene.add(sphere);

        // Ground plane with checkerboard pattern
        const planeGeometry = new THREE.PlaneGeometry(20, 20);
        
        // Create checkerboard texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        if (context) {
          const squareSize = 32;
          for (let x = 0; x < canvas.width; x += squareSize) {
            for (let y = 0; y < canvas.height; y += squareSize) {
              const isEven = ((x / squareSize) + (y / squareSize)) % 2 === 0;
              context.fillStyle = isEven ? '#ffffff' : '#000000';
              context.fillRect(x, y, squareSize, squareSize);
            }
          }
        }
        const checkerboardTexture = new THREE.CanvasTexture(canvas);
        checkerboardTexture.wrapS = THREE.RepeatWrapping;
        checkerboardTexture.wrapT = THREE.RepeatWrapping;
        checkerboardTexture.repeat.set(4, 4);

        const planeMaterial = new THREE.MeshPhongMaterial({ 
          map: checkerboardTexture,
          transparent: true,
          opacity: 0.8
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        scene.add(plane);

        // Lighting optimized for black/white theme
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        scene.add(directionalLight);

        // Animation loop
        const animate = () => {
          animationIdRef.current = requestAnimationFrame(animate);
          
          // Rotate objects based on time
          cube.rotation.x = currentTime * 0.01;
          cube.rotation.y = currentTime * 0.01;
          sphere.position.y = 0.5 + Math.sin(currentTime * 0.02) * 0.5;
          
          renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
          if (!mountRef.current || !camera || !renderer) return;
          
          const newWidth = mountRef.current.clientWidth;
          const newHeight = mountRef.current.clientHeight;
          
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        };

        window.addEventListener('resize', handleResize);
        setIsInitialized(true);
        
        return () => {
          window.removeEventListener('resize', handleResize);
          if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
          }
          if (mountRef.current && renderer.domElement) {
            mountRef.current.removeChild(renderer.domElement);
          }
          renderer.dispose();
        };
      } catch (error) {
        console.error('Failed to initialize Three.js:', error);
        // Fallback content with black/white theme
        if (mountRef.current) {
          mountRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full bg-background text-foreground border border-border">
              <div class="text-center">
                <div class="text-2xl mb-2">🎬</div>
                <div class="font-medium">3D Viewport</div>
                <div class="text-sm text-muted-foreground">Three.js Scene</div>
              </div>
            </div>
          `;
        }
      }
    };

    initThreeJS();

    // Cleanup on unmount
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  // Update animation based on currentTime changes
  useEffect(() => {
    if (isInitialized && sceneRef.current && rendererRef.current && cameraRef.current) {
      const scene = sceneRef.current;
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      
      // Find the cube and sphere to update their positions
      const cube = scene.children.find((child: any) => child.geometry?.type === 'BoxGeometry');
      const sphere = scene.children.find((child: any) => child.geometry?.type === 'SphereGeometry');
      
      if (cube) {
        cube.rotation.x = currentTime * 0.01;
        cube.rotation.y = currentTime * 0.01;
      }
      
      if (sphere) {
        sphere.position.y = 0.5 + Math.sin(currentTime * 0.02) * 0.5;
      }
      
      renderer.render(scene, camera);
    }
  }, [currentTime, isInitialized]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Viewport Controls */}
      <div className="flex items-center justify-between p-2 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value)}
            className="border border-border rounded"
          >
            <ToggleGroupItem value="perspective" size="sm" className="text-xs">
              <Camera className="w-4 h-4 mr-1" />
              Persp
            </ToggleGroupItem>
            <ToggleGroupItem value="top" size="sm" className="text-xs">
              Top
            </ToggleGroupItem>
            <ToggleGroupItem value="front" size="sm" className="text-xs">
              Front
            </ToggleGroupItem>
            <ToggleGroupItem value="side" size="sm" className="text-xs">
              Side
            </ToggleGroupItem>
          </ToggleGroup>

          <Separator orientation="vertical" className="h-4 bg-border" />

          <ToggleGroup 
            type="single" 
            value={renderMode} 
            onValueChange={(value) => value && setRenderMode(value)}
            className="border border-border rounded"
          >
            <ToggleGroupItem value="wireframe" size="sm" className="text-xs">
              Wire
            </ToggleGroupItem>
            <ToggleGroupItem value="solid" size="sm" className="text-xs">
              Solid
            </ToggleGroupItem>
            <ToggleGroupItem value="textured" size="sm" className="text-xs">
              Textured
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Toggle Grid">
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Lighting">
            <Sun className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Camera View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Maximize">
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 3D Viewport */}
      <div ref={mountRef} className="flex-1 relative bg-background viewport-3d">
        <div className="absolute top-2 left-2 z-10">
          <Card className="p-2 bg-background/90 border border-border backdrop-blur-sm">
            <div className="text-xs text-foreground space-y-1">
              <div>Frame: {currentTime}</div>
              <div>Objects: 3</div>
              <div>Vertices: 1,024</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Transform Controls */}
      <div className="flex items-center gap-2 p-2 bg-card border-t border-border shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Move Tool">
            <Move3D className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Rotate Tool">
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Scale Tool">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-4 bg-border" />
        
        <div className="text-xs text-muted-foreground">
          Transform: X: 0.00 Y: 0.00 Z: 0.00
        </div>
      </div>
    </div>
  );
}