import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import fragment from "./animation/shader/fragment.glsl";
import vertex from "./animation/shader/vertex.glsl";
import GUI from 'lil-gui'; 
import gsap from "gsap";
import particleTexture from './animation/particle.webp'

import { HeaderComponent } from "./components/header/header.component";


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Galaxy with Three.js tutorial';
  scene: any;
  container: any;
  width: any;
  height: any;
  renderer: any;
  raycaster: any;
  pointer: any;
  point: any;
  camera: any;
  controls: any;
  time: any;
  isPlaying: any;
  materials: any;
  gui: any;
  geometry: any;
  points: any;
  dracoLoader: any;
  gltf: any;
  
  ngOnInit(): void {
    this.container = document.getElementById('canvas-box');
    this.scene = new THREE.Scene();
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
    });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.width, this.height);

    this.container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.point = new THREE.Vector3();

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.camera.position.set(0, 2, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/"
    ); // use a full url path
    this.gltf = new GLTFLoader();
    this.gltf.setDRACOLoader(this.dracoLoader);

    this.materials = [];

    this.isPlaying = true;

    let opts = [
      {
        particle_size: .02,
        particle_size_frequency: 1.188,
        particle_size_dispersion: .3,
        rotation_dispersion: .1,
        time_scale: .01,
        twist_speed: 0,
        twist_frequency: 3,
        twist_dispersion: .1,
        twist_dispersion_frequency: 2,
        twist_amplitude: 5,
        rotation_speed: 0,
        frequency: 0,
        amplitude: .346,
        offset: 0,
        opacity: 1,
        cone_shape: 0,
        color: "#f9ebb8",
        instance_count: 1e3 ,
        min_radius: 3,
        max_radius: 5.3,
      },
      {
        particle_size: .03,
        particle_size_frequency: .658,
        particle_size_dispersion: .197,
        time_scale: .098,
        twist_speed: 1.76,
        twist_dispersion: .3,
        twist_dispersion_frequency: 1.196,
        twist_frequency: .2136,
        twist_amplitude: .5,
        rotation_speed: .1,
        rotation_dispersion: .168,
        frequency: .69,
        amplitude: .092,
        offset: .6,
        opacity: .276,
        cone_shape: 1,
        color: "#f7b373",
        instance_count: 1e4,
        min_radius: .5,
        max_radius: 5,
      },
      {
        particle_size: .0184,
        particle_size_frequency: 1.62,
        particle_size_dispersion: .144,
        time_scale: .147,
        twist_speed: .12,
        twist_dispersion: 1.3,
        twist_dispersion_frequency: .72,
        twist_frequency: .183,
        twist_amplitude: 0,
        rotation_speed: .12,
        rotation_dispersion: .01,
        frequency: 1.37,
        amplitude: .188,
        offset: 2.22,
        opacity: .22,
        cone_shape: 1,
        color: "#88b3ce",
        instance_count: 2e4,
        min_radius: .5,
        max_radius: 5,
      },
    ];

    opts.forEach(op=>{
      this.addObject(op);
    });

    this.raycasterEvent();
    this.resize();
    this.render();
    this.setupResize();
  }

  raycasterEvent(){

    let mesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(10,10,10,10).rotateX(-Math.PI/2),
      new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true})
    )


    let test = new THREE.Mesh(
      new THREE.SphereBufferGeometry(0.1,10,10),
      new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true})
    )
    // this.scene.add(test)


    window.addEventListener( 'pointermove', (event)=>{
      this.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      this.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

      this.raycaster.setFromCamera( this.pointer, this.camera );

	    const intersects = this.raycaster.intersectObjects( [mesh] );
      console.log(intersects,this.pointer)
      if(intersects[0]){
        console.log(intersects[0].point)
        test.position.copy(intersects[0].point)
        this.point.copy(intersects[0].point)
      }
    
    } );
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  lerp(a,b,t){
    return a*(1-t) + b*t;
  }

  addObject(opts) {
    let that = this;
    let count = opts.instance_count;
    let min_radius = opts.min_radius;
    let max_radius = opts.max_radius;
    let particlegeo = new THREE.PlaneBufferGeometry(1,1);
    let geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', particlegeo.getAttribute('position'));
    geo.index = particlegeo.index;

    let pos = new Float32Array(count*3);

    for (let i = 0; i < count; i++) {
      let theta = Math.random()*2*Math.PI;
      let r = this.lerp(min_radius,max_radius,Math.random());
      let x = r*Math.sin(theta);
      let y = (Math.random()-0.5)*0.1;
      let z = r*Math.cos(theta);

      pos.set([
        x,y,z
      ],i*3);
    }


    geo.setAttribute('pos', new THREE.InstancedBufferAttribute(pos,3,false));

    console.log('Texture', particleTexture);


    let material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        uTexture: { value: new THREE.TextureLoader().load(particleTexture) },
        time: { value: 0 },
        uAmp: { value: opts.amp},
        uMouse: { value: new THREE.Vector3() },
        size: { value: opts.size },
        uColor: { value: new THREE.Color(opts.color) },
        resolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      transparent: true,
      depthTest: false,
      vertexShader: vertex,
      fragmentShader: fragment
    });
    this.materials.push(material);
    // this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    this.points = new THREE.Mesh(geo, material);
    this.scene.add(this.points);

    console.log('Add Object', opts, count, min_radius, max_radius);
    console.log('Add Object Objects', material);
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.materials.forEach(m=>{
      m.uniforms.time.value = this.time*0.5;
      m.uniforms.uMouse.value = this.point;
    })
    
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}
