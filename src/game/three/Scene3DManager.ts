import * as THREE from 'three';
import { PlayerController } from './PlayerController';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { Environment3D } from './Environment3D';
import { Input3DManager } from './Input3DManager';
import { InputState } from '../../types/game';

export class Scene3DManager {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public cameraController: ThirdPersonCamera;
  public environment: Environment3D;
  public player: PlayerController;
  public input: Input3DManager;

  private container: HTMLElement | null = null;
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.cameraController = new ThirdPersonCamera(60, 16 / 9, 0.1, 1000);
    this.environment = new Environment3D(this.scene);
    this.player = new PlayerController();
    this.scene.add(this.player.group);

    this.input = new Input3DManager();

    // Reset camera onto initial player position
    this.cameraController.resetToTarget(this.player.position, this.player.rotationY);
  }

  public mount(container: HTMLElement) {
    this.container = container;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    this.renderer.setSize(width, height);
    this.cameraController.setAspect(width / height);

    if (this.renderer.domElement.parentElement !== container) {
      container.replaceChildren(this.renderer.domElement);
    }

    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';

    // Set up ResizeObserver for fluid mobile & container resizing
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const w = entry.contentRect.width;
          const h = entry.contentRect.height;
          if (w > 0 && h > 0) {
            this.resize(w, h);
          }
        }
      });
      this.resizeObserver.observe(container);
    }
  }

  public unmount() {
    this.stop();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.container = null;
  }

  public resize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    this.cameraController.setAspect(width / height);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loop = (now: number) => {
    if (!this.isRunning) return;

    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  public update(dt: number) {
    // 1. Fetch input vector
    const moveVector = this.input.getMovementVector();
    const isJump = this.input.isJumpJustPressed();

    // 2. Update 3D player physics & movement relative to camera orientation
    const cameraAngleY = Math.atan2(
      this.player.position.x - this.cameraController.camera.position.x,
      this.player.position.z - this.cameraController.camera.position.z
    );

    this.player.update(dt, moveVector, isJump, cameraAngleY);

    // 3. Update third person camera position
    this.cameraController.update(dt, this.player.position, this.player.rotationY);

    // 4. Update environment animations
    this.environment.update(dt);

    // 5. Update input history
    this.input.updatePreviousState();
  }

  public render() {
    this.renderer.render(this.scene, this.cameraController.camera);
  }

  public syncWith2DInput(inputState: InputState) {
    this.input.syncFrom2DInput(inputState);
  }

  public setTouchJoystick(x: number, z: number) {
    this.input.setTouchJoystick(x, z);
  }

  public setTouchAction(action: 'jump' | 'attack' | 'kick', active: boolean) {
    this.input.setTouchAction(action, active);
  }

  public resetPlayer(x: number = 0, y: number = 0, z: number = 0) {
    this.player.resetPosition(x, y, z);
    this.cameraController.resetToTarget(this.player.position, this.player.rotationY);
  }

  public dispose() {
    this.unmount();
    this.renderer.dispose();
  }
}
