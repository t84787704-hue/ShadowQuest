import * as THREE from 'three';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  private currentPosition: THREE.Vector3 = new THREE.Vector3(0, 5, 10);
  private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, 1.5, 0);

  public distance: number = 7.5;
  public height: number = 3.8;
  public targetHeight: number = 1.6;
  public lerpFactor: number = 6.0;

  constructor(fov: number = 60, aspect: number = 16 / 9, near: number = 0.1, far: number = 1000) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  }

  public update(dt: number, targetPos: THREE.Vector3, targetRotationY: number) {
    // Calculate target offset behind the player based on character facing/rotation
    const offsetZ = Math.cos(targetRotationY) * this.distance;
    const offsetX = Math.sin(targetRotationY) * this.distance;

    const desiredPosition = new THREE.Vector3(
      targetPos.x - offsetX,
      targetPos.y + this.height,
      targetPos.z - offsetZ
    );

    const desiredLookAt = new THREE.Vector3(
      targetPos.x,
      targetPos.y + this.targetHeight,
      targetPos.z
    );

    // Smoothly interpolate camera position and lookAt target
    const step = Math.min(1.0, dt * this.lerpFactor);
    this.currentPosition.lerp(desiredPosition, step);
    this.currentLookAt.lerp(desiredLookAt, step);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }

  public setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public resetToTarget(targetPos: THREE.Vector3, targetRotationY: number) {
    const offsetZ = Math.cos(targetRotationY) * this.distance;
    const offsetX = Math.sin(targetRotationY) * this.distance;

    this.currentPosition.set(
      targetPos.x - offsetX,
      targetPos.y + this.height,
      targetPos.z - offsetZ
    );
    this.currentLookAt.set(targetPos.x, targetPos.y + this.targetHeight, targetPos.z);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }
}
