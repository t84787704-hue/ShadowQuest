import * as THREE from 'three';

export class Environment3D {
  public group: THREE.Group;
  public dirLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public hemiLight: THREE.HemisphereLight;

  private floatingCrystals: THREE.Mesh[] = [];
  private animTimer: number = 0;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // 1. Sky Fog
    scene.background = new THREE.Color(0x0f172a); // Deep blue night sky
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

    // 2. Lighting Setup
    this.ambientLight = new THREE.AmbientLight(0x38bdf8, 0.4); // Soft blue ambient
    scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.5);
    scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfef08a, 1.2); // Warm sunlight/moonlight
    this.dirLight.position.set(20, 35, 15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 100;
    const shadowSize = 30;
    this.dirLight.shadow.camera.left = -shadowSize;
    this.dirLight.shadow.camera.right = shadowSize;
    this.dirLight.shadow.camera.top = shadowSize;
    this.dirLight.shadow.camera.bottom = -shadowSize;
    this.dirLight.shadow.bias = -0.0005;
    scene.add(this.dirLight);

    // 3. Ground Plane with Procedural Canvas Grid Texture for Clear Movement Visualization
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Base dark slate background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 512, 512);

      // Grid tiles fill
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(16, 16, 480, 480);

      // Outer grid border lines
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, 496, 496);

      // Sub-grid checkered pattern accents
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      const step = 64;
      for (let x = 0; x <= 512; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, x);
        ctx.lineTo(512, x);
        ctx.stroke();
      }

      // Center glowing cross marker
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(240, 240, 32, 32);
    }

    const gridTexture = new THREE.CanvasTexture(canvas);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(24, 24); // Repeat texture across the 120x120 plane

    const groundGeo = new THREE.PlaneGeometry(120, 120, 60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      map: gridTexture,
      roughness: 0.6,
      metalness: 0.2,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.group.add(groundMesh);

    // Dynamic 3D Grid Overlay lines on floor
    const gridHelper = new THREE.GridHelper(120, 60, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0.02;
    this.group.add(gridHelper);

    // Center Arena Octagon Platform
    const platformGeo = new THREE.CylinderGeometry(20, 22, 0.4, 8);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.3,
    });
    const platformMesh = new THREE.Mesh(platformGeo, platformMat);
    platformMesh.position.y = 0.18;
    platformMesh.receiveShadow = true;
    this.group.add(platformMesh);

    const ringGeo = new THREE.RingGeometry(18, 19.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.39;
    this.group.add(ringMesh);

    // 4. Environment Pillars & Torches
    this.buildArenaPillars();

    // 5. Floating Energy Crystals
    this.buildFloatingCrystals();
  }

  private buildArenaPillars() {
    const radius = 22;
    const pillarCount = 8;
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Pillar base
      const pillarGeo = new THREE.CylinderGeometry(0.8, 1.2, 5, 8);
      const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
      pillarMesh.position.set(x, 2.5, z);
      pillarMesh.castShadow = true;
      pillarMesh.receiveShadow = true;
      this.group.add(pillarMesh);

      // Glowing Orb atop pillar
      const orbGeo = new THREE.SphereGeometry(0.5, 12, 12);
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      orbMesh.position.set(x, 5.4, z);
      this.group.add(orbMesh);

      // Point Light at orb
      const light = new THREE.PointLight(0x38bdf8, 1.5, 12);
      light.position.set(x, 5.4, z);
      this.group.add(light);
    }
  }

  private buildFloatingCrystals() {
    const crystalGeo = new THREE.OctahedronGeometry(0.6, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.5,
      roughness: 0.2,
    });

    for (let i = 0; i < 12; i++) {
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * 14;
      crystal.position.set(
        Math.cos(angle) * dist,
        2.5 + Math.random() * 3,
        Math.sin(angle) * dist
      );
      crystal.castShadow = true;
      this.group.add(crystal);
      this.floatingCrystals.push(crystal);
    }
  }

  public update(dt: number) {
    this.animTimer += dt;

    // Animate floating crystals
    this.floatingCrystals.forEach((crystal, idx) => {
      crystal.rotation.y += dt * 0.8;
      crystal.position.y += Math.sin(this.animTimer * 1.5 + idx) * 0.003;
    });
  }
}
