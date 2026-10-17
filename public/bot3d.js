import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function startBot(stage, state) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas:stage.querySelector('canvas'),alpha:true,antialias:true,powerPreference:'low-power'});
  } catch { stage.classList.add('fallback'); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.6;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,40);
  camera.position.set(1.4,.9,5.6);camera.lookAt(0,-.25,0);
  scene.add(new THREE.HemisphereLight(0xeafff1,0x162b29,3));
  const key=new THREE.DirectionalLight(0xffffff,5);key.position.set(-3,5,5);scene.add(key);
  const rim=new THREE.PointLight(0x78ffd2,22);rim.position.set(3,1,-2);scene.add(rim);
  const blue=new THREE.PointLight(0x75bfff,12);blue.position.set(-3,0,-1);scene.add(blue);
  const shell=new THREE.MeshPhysicalMaterial({color:0xd3e9e1,metalness:.45,roughness:.23,clearcoat:1});
  const dark=new THREE.MeshPhysicalMaterial({color:0x081b20,metalness:.5,roughness:.16,clearcoat:1});
  const glow=new THREE.MeshStandardMaterial({color:0x98ffd3,emissive:0x52ffbd,emissiveIntensity:2.2,roughness:.3});
  const bot=new THREE.Group();scene.add(bot);
  function part(geometry,material,x,y,z,parent=bot){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
  const head=new THREE.Group();bot.add(head);
  part(new RoundedBoxGeometry(1.75,1.25,1.15,5,.28),shell,0,.1,0,head);
  part(new RoundedBoxGeometry(1.48,.91,.21,5,.22),dark,0,.06,.59,head);
  const eyes=[];
  for(const x of [-.34,.34])eyes.push(part(new THREE.CapsuleGeometry(.065,.15,5,12),glow,x,.15,.715,head));
  const smile=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.12,-.16,.72),new THREE.Vector3(0,-.25,.75),new THREE.Vector3(.12,-.16,.72));
  const mouth=part(new THREE.TubeGeometry(smile,16,.018,6,false),glow,0,0,0,head);
  for(const x of [-.96,.96]){part(new THREE.SphereGeometry(.17,20,16),shell,x,.04,0,head);part(new THREE.SphereGeometry(.09,16,12),glow,x*1.08,.04,.02,head);}
  part(new THREE.CylinderGeometry(.026,.026,.26,12),shell,0,.85,0,head);
  part(new THREE.SphereGeometry(.09,20,12),glow,0,1.02,0,head);
  const torso=part(new THREE.SphereGeometry(.5,32,24),shell,0,-.87,0);torso.scale.set(.85,.6,.85);
  part(new THREE.SphereGeometry(.075,16,12),glow,0,-.85,.41);
  for(const x of [-.66,.66]){const arm=part(new THREE.SphereGeometry(.18,20,16),shell,x,-.72,0);arm.scale.set(.7,1.25,.8);}
  const thruster=part(new THREE.TorusGeometry(.25,.028,8,40),glow,0,-1.16,0);thruster.rotation.x=Math.PI/2;
  const ringMaterial=new THREE.MeshBasicMaterial({color:0x7dffc3,transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false});
  const ring=part(new THREE.RingGeometry(.44,.48,64),ringMaterial,0,-1.53,0,scene);ring.rotation.x=-Math.PI/2;
  const shadow=part(new THREE.CircleGeometry(.54,48),new THREE.MeshBasicMaterial({color:0x162920,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false}),0,-1.57,0,scene);shadow.rotation.x=-Math.PI/2;
  let pointer=0;stage.addEventListener('pointermove',e=>{pointer=(e.offsetX/stage.clientWidth-.5)*.45;});stage.addEventListener('pointerleave',()=>{pointer=0;});
  const resize=()=>{renderer.setSize(stage.clientWidth,stage.clientHeight,false);camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(stage);resize();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame, lastFrame=0;
  function draw(time){if(time-lastFrame<(reduced.matches?100:33)){frame=requestAnimationFrame(draw);return;}lastFrame=time;const t=time/1000,active=state();bot.position.y=reduced.matches?0:Math.sin(t*1.9)*.11;bot.rotation.y=reduced.matches?0:Math.sin(t*.65)*.12+pointer;head.rotation.z=reduced.matches?0:Math.sin(t*1.2)*.035;const blink=!reduced.matches&&t%5.8>5.62?.13:1;eyes.forEach(eye=>{eye.scale.y=blink;});mouth.scale.y=active.speaking&&!reduced.matches?1+Math.sin(t*20)*.5:1;glow.emissiveIntensity=active.thinking&&!reduced.matches?1.7+Math.sin(t*5)*.7:2.2;ringMaterial.opacity=active.listening?.45:.2;ring.scale.setScalar(reduced.matches?1:1+Math.sin(t*2)*.08);renderer.render(scene,camera);frame=requestAnimationFrame(draw);}
  frame=requestAnimationFrame(draw);
  stage.querySelector('canvas').addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);stage.classList.add('fallback');});
  window.addEventListener('beforeunload',()=>{cancelAnimationFrame(frame);observer.disconnect();renderer.dispose();},{once:true});
}
