import * as THREE from 'three';

export class PlayerController {
  public group: THREE.Group;
  public mesh: THREE.Mesh;
  public position: THREE.Vector3 = new THREE.Vector3(0, 1.0, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  public moveSpeed: number = 9.0;
  public jumpForce: number = 12.0;
  public gravity: number = 30.0;
  public isGrounded: boolean = true;

  public rotationY: number = 0;
  private targetRotationY: number = 0;

  // Floor level
  public floorY: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // Create 3D player mesh (Cylinder with a heading direction visor/indicator)
    const playerRadius = 0.5;
    const playerHeight = 1.8;

    const geometry = new THREE.CylinderGeometry(playerRadius, playerRadius, playerHeight, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xe11d48, // Crimson Red hero color
      roughness: 0.3,
      metalness: 0.2,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = playerHeight / 2;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Heading indicator (Visor / Arrow on front of cylinder)
    const visorGeo = new THREE.BoxGeometry(0.6, 0.25, 0.3);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Cyan glowing visor
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.45, -0.4);
    this.mesh.add(visorMesh);

    // Belt ring
    const beltGeo = new THREE.CylinderGeometry(playerRadius + 0.04, playerRadius + 0.04, 0.2, 16);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const beltMesh = new THREE.Mesh(beltGeo, beltMat);
    beltMesh.position.set(0, -0.1, 0);
    this.mesh.add(beltMesh);

    this.group.add(this.mesh);
    this.group.position.copy(this.position);
  }

  /**
   * Updates player position, WASD camera-relative movement, gravity, and floor collision.
   */
  public update(
    dt: number,
    moveInput: { x: number; z: number },
    isJumpPressed: boolean,
    cameraAngleY: number = 0
  ) {
    const moveLen = Math.hypot(moveInput.x, moveInput.z);
    const isMoving = moveLen > 0.05;

    // 1. WASD / Joystick Camera-Relative Horizontal Movement
    if (isMoving) {
      const inputAngle = Math.atan2(moveInput.x, moveInput.z);
      const worldMoveAngle = inputAngle + cameraAngleY;

      const vx = Math.sin(worldMoveAngle) * this.moveSpeed * Math.min(1, moveLen);
      const vz = Math.cos(worldMoveAngle) * this.moveSpeed * Math.min(1, moveLen);

      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, vx, dt * 15);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, vz, dt * 15);

      this.targetRotationY = worldMoveAngle;
    } else {
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, dt * 15);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, dt * 15);
    }

    // Smoothly rotate mesh toward movement direction
    let angleDiff = this.targetRotationY - this.rotationY;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.rotationY += angleDiff * Math.min(1, dt * 14);

    this.mesh.rotation.y = this.rotationY;

    // 2. Apply Gravity & Airborne Acceleration
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
    }

    // Handle Jump Trigger
    if (isJumpPressed && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    // 3. Apply Velocity to Position (X, Y, Z)
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // 4. Floor Collision Check against Y=0 Plane
    const floorPlaneY = 0;
    if (this.position.y <= floorPlaneY) {
      this.position.y = floorPlaneY;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Synchronize 3D Group Position
    this.group.position.copy(this.position);
  }

  public resetPosition(x: number = 0, y: number = 0, z: number = 0) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
    this.group.position.copy(this.position);
  }
}
