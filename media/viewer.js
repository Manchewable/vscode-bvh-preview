class Viewer {

  constructor() {
    // Three JS instances
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45.0, window.innerWidth / window.innerHeight, 0.1, 500000.0
    );
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.planeHelper = null;
    this.gui = new dat.GUI();

    this.motionDuration = 0.0;
    this.clock = new THREE.Clock();

    // Parameters
    this.params = JSON.parse(
      document.getElementById('vscode-bvhviewer-data').getAttribute('data-settings')
    );
    this.params.motionDt = 0.0;
    this.params.playBackSpeed = 1.0;
    this.params.pause = false;

    this.initRenderer();
    this.initScene();
    this.addBVH(this.params.fileToLoad);

    // add DOM
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(this.stats.domElement);
    window.addEventListener('resize', this.onWindowResize.bind(this), false);

    window.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        this.pause.setValue(!this.pause.getValue());
        this.pause.updateDisplay();
      }
    });
  }

  initGui() {
    // set gui
    this.motionDt = this.gui.add(this.params, 'motionDt')
      .min(0).max(this.motionDuration).step(0.00001)
      .name('Time');
    this.playBackSpeed = this.gui.add(this.params, 'playBackSpeed')
      .min(0).max(2).step(0.1)
      .name('Playback Speed');
    this.pause = this.gui.add(this.params, 'pause')
      .name('pause');

    this.motionDt.onChange(() => this.mixer.setTime(this.params.motionDt));

    if (this.params.hideControlsOnStart) {
      this.gui.close();
    }
  }

  initRenderer() {
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  initScene() {
    this.scene.background = new THREE.Color(this.params.backgroundColor);
  }

  initCamera() {
    const camTarget = new THREE.Vector3(0, 0, 0);
    const camPos = new THREE.Vector3(200, 200, 0);

    this.camera.position.copy(camPos);
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target = camTarget;
    this.controls.rotateSpeed = 0.5;
  }

  initHelpers() {
    // Remove current helpers
    if (this.planeHelper !== null) {
      this.scene.remove(this.planeHelper);
      this.planeHelper.dispose();
    }

    // Plane helper
    if (this.planeHelper === null) {
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
      this.planeHelper = new THREE.PlaneHelper(plane, 1000, "0x888888");
      this.planeHelper.name = 'planeHelper';
    }

    this.scene.add(this.planeHelper);
  }

  updateGui() {
    this.initScene();
    this.initHelpers();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    this.stats.begin();
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update();

    const delta = this.clock.getDelta();
    if (!this.params.pause) {
      this.mixer.update(delta * this.playBackSpeed.getValue());

      // Need to update this.params.motionDt directly
      // since .setValue() will fire a isModified event
      // this.motionDt.onChange(this.mixer.time % this.motionDuration);
      this.params.motionDt = this.mixer.time % this.motionDuration;

      this.motionDt.updateDisplay();
    }

    this.renderer.render(this.scene, this.camera);
    this.stats.end();
  }

  addBVH(fileToLoad){
    const self = this;
    const loader = new THREE.BVHLoader();

    let mixer;

    loader.load(fileToLoad, function (result) {
      this.motionDuration = result.clip.duration;

      const skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );

      self.scene.add( result.skeleton.bones[ 0 ] );
      self.scene.add( skeletonHelper );

      // play animation
      this.mixer = new THREE.AnimationMixer( result.skeleton.bones[ 0 ] );
      this.mixer.clipAction( result.clip ).play();

      self.initCamera();
      self.initGui();
      self.initHelpers();
      self.animate();
    }.bind(self));
  }
}

viewer = new Viewer();
