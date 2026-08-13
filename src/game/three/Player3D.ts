import * as THREE from 'three';

export class Player3D {
  public group: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3(0, 0.9, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  public moveSpeed: number = 8.5;
  public jumpForce: number = 11.5;
  public gravity: number = 28.0;
  public isGrounded: boolean = true;

  public rotationY: number = 0;
  private targetRotationY: number = 0;

  // Character Mesh Parts for Procedural Animations
  private meshContainer: THREE.Group;
  private torsoMesh: THREE.Mesh;
  private headMesh: THREE.Mesh;
  private headbandTies: THREE.Mesh[];
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;

  private animTimer: number = 0;
  public isMoving: boolean = false;

  constructor() {
    this.group = new THREE.Group();
    this.meshContainer = new THREE.Group();
    this.group.add(this.meshContainer);

    this.headbandTies = [];

    // Create 3D Geometric Martial Hero Character
    const materials = {
      skin: new THREE.MeshStandardMaterial({ color: 0xffd1b3, roughness: 0.6 }),
      giTorso: new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.4 }), // Red/crimson martial gi
      giPants: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }), // Dark blue/slate martial pants
      belt: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 }),
      headband: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, emissive: 0xb45309, emissiveIntensity: 0.2 }), // Golden headband
      eyes: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 }),
      pupils: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 }),
      wraps: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 }),
      boots: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }),
    };

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.75, 0.45);
    this.torsoMesh = new THREE.Mesh(torsoGeo, materials.giTorso);
    this.torsoMesh.position.y = 0.85;
    this.torsoMesh.castShadow = true;
    this.torsoMesh.receiveShadow = true;
    this.meshContainer.add(this.torsoMesh);

    // Belt around waist
    const beltGeo = new THREE.BoxGeometry(0.68, 0.12, 0.48);
    const beltMesh = new THREE.Mesh(beltGeo, materials.belt);
    beltMesh.position.y = 0.55;
    beltMesh.castShadow = true;
    this.meshContainer.add(beltMesh);

    // 2. Head & Face
    const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
    this.headMesh = new THREE.Mesh(headGeo, materials.skin);
    this.headMesh.position.y = 1.4;
    this.headMesh.castShadow = true;
    this.meshContainer.add(this.headMesh);

    // Martial Headband
    const headbandGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.08, 16);
    const headbandMesh = new THREE.Mesh(headbandGeo, materials.headband);
    headbandMesh.position.y = 1.46;
    this.meshContainer.add(headbandMesh);

    // Headband cloth ties at back
    for (let i = 0; i < 2; i++) {
      const tieGeo = new THREE.BoxGeometry(0.06, 0.35, 0.02);
      const tieMesh = new THREE.Mesh(tieGeo, materials.headband);
      tieMesh.position.set(i === 0 ? -0.08 : 0.08, 1.38, 0.3);
      tieMesh.rotation.x = 0.3;
      this.meshContainer.add(tieMesh);
      this.headbandTies.push(tieMesh);
    }

    // Eyes
    for (let side of [-1, 1]) {
      const eyeGeo = new THREE.BoxGeometry(0.08, 0.06, 0.02);
      const eyeMesh = new THREE.Mesh(eyeGeo, materials.eyes);
      eyeMesh.position.set(side * 0.1, 1.42, -0.26);

      const pupilGeo = new THREE.BoxGeometry(0.04, 0.04, 0.03);
      const pupilMesh = new THREE.Mesh(pupilGeo, materials.pupils);
      pupilMesh.position.set(side * 0.1, 1.42, -0.27);

      this.meshContainer.add(eyeMesh);
      this.meshContainer.add(pupilMesh);
    }

    // 3. Arms (With Pivots at Shoulder)
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.42, 1.15, 0);
    const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
    const leftArmMesh = new THREE.Mesh(armGeo, materials.giTorso);
    leftArmMesh.position.y = -0.25;
    leftArmMesh.castShadow = true;
    this.leftArmGroup.add(leftArmMesh);

    // Hand Wrap
    const handWrapGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const leftHandWrap = new THREE.Mesh(handWrapGeo, materials.wraps);
    leftHandWrap.position.y = -0.55;
    this.leftArmGroup.add(leftHandWrap);
    this.meshContainer.add(this.leftArmGroup);

    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.42, 1.15, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, materials.giTorso);
    rightArmMesh.position.y = -0.25;
    rightArmMesh.castShadow = true;
    this.rightArmGroup.add(rightArmMesh);

    const rightHandWrap = new THREE.Mesh(handWrapGeo, materials.wraps);
    rightHandWrap.position.y = -0.55;
    this.rightArmGroup.add(rightHandWrap);
    this.meshContainer.add(this.rightArmGroup);

    // 4. Legs (With Pivots at Hip)
    const legGeo = new THREE.BoxGeometry(0.24, 0.65, 0.24);

    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.2, 0.5, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, materials.giPants);
    leftLegMesh.position.y = -0.25;
    leftLegMesh.castShadow = true;
    this.leftLegGroup.add(leftLegMesh);

    const bootGeo = new THREE.BoxGeometry(0.26, 0.18, 0.32);
    const leftBoot = new THREE.Mesh(bootGeo, materials.boots);
    leftBoot.position.set(0, -0.52, -0.04);
    this.leftLegGroup.add(leftBoot);
    this.meshContainer.add(this.leftLegGroup);

    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.2, 0.5, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, materials.giPants);
    rightLegMesh.position.y = -0.25;
    rightLegMesh.castShadow = true;
    this.rightLegGroup.add(rightLegMesh);

    const rightBoot = new THREE.Mesh(bootGeo, materials.boots);
    rightBoot.position.set(0, -0.52, -0.04);
    this.rightLegGroup.add(rightBoot);
    this.meshContainer.add(this.rightLegGroup);

    this.group.position.copy(this.position);
  }

  public update(
    dt: number,
    moveInput: { x: number; z: number },
    isJumpPressed: boolean,
    cameraAngleY: number = 0
  ) {
    // 1. Calculate Horizontal Movement Direction in Camera Relative Space
    const moveLen = Math.hypot(moveInput.x, moveInput.z);
    this.isMoving = moveLen > 0.05;

    if (this.isMoving) {
      // Calculate movement direction angle in world 3D space
      const inputAngle = Math.atan2(moveInput.x, moveInput.z);
      const worldMoveAngle = inputAngle + cameraAngleY;

      const vx = Math.sin(worldMoveAngle) * this.moveSpeed * Math.min(1, moveLen);
      const vz = Math.cos(worldMoveAngle) * this.moveSpeed * Math.min(1, moveLen);

      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, vx, dt * 15);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, vz, dt * 15);

      // Target mesh rotation toward movement angle
      this.targetRotationY = worldMoveAngle;
    } else {
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, dt * 15);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, dt * 15);
    }

    // Smoothly rotate character toward movement direction
    let angleDiff = this.targetRotationY - this.rotationY;
    // Normalize angle difference to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.rotationY += angleDiff * Math.min(1, dt * 14);

    this.meshContainer.rotation.y = this.rotationY;

    // 2. Jump & Gravity Physics
    if (isJumpPressed && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
    }

    // 3. Apply Velocity to Position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // 4. Ground Collision Check
    const groundY = 0;
    if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    this.group.position.copy(this.position);

    // 5. Procedural Limb & Stance Animations
    this.animTimer += dt * (this.isMoving ? 14 : 4);

    if (!this.isGrounded) {
      // In air jump pose
      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, -0.6, dt * 10);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0.5, dt * 10);
      this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, 1.2, dt * 10);
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, -0.8, dt * 10);
    } else if (this.isMoving) {
      // Brawler jog swing
      const swing = Math.sin(this.animTimer) * 0.75;
      this.leftArmGroup.rotation.x = swing;
      this.rightArmGroup.rotation.x = -swing;
      this.leftLegGroup.rotation.x = -swing;
      this.rightLegGroup.rotation.x = swing;

      // Headband fluttering effect
      this.headbandTies.forEach((tie, idx) => {
        tie.rotation.x = 0.4 + Math.sin(this.animTimer * 1.5 + idx) * 0.3;
      });
    } else {
      // Idle breathing stance
      const breath = Math.sin(this.animTimer) * 0.06;
      this.torsoMesh.position.y = 0.85 + breath * 0.3;
      this.headMesh.position.y = 1.4 + breath * 0.4;
      this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, 0.2 + breath, dt * 8);
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, -0.2 - breath, dt * 8);
      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, 0, dt * 8);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0, dt * 8);
    }
  }

  public resetPosition(x: number, y: number = 0, z: number = 0) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
    this.group.position.copy(this.position);
  }
}
