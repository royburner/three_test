var stats = new Stats();
stats.showPanel( 1 );
document.body.appendChild( stats.dom );

var scene = new THREE.Scene();
var aspect = window.innerWidth / window.innerHeight;
var camera = new THREE.PerspectiveCamera( 75, aspect, 0.1, 1000 );var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry1 = new THREE.BoxGeometry( 1, 1, 1 );
var material1 = new THREE.MeshNormalMaterial();
var cube1 = new THREE.Mesh( geometry1, material1 );
scene.add( cube1 );

var geometry2 = new THREE.BoxGeometry( 1, 1, 1 );
var material2 = new THREE.MeshNormalMaterial();
var cube2 = new THREE.Mesh( geometry2, material2 );
cube2.position.x = 2;
scene.add( cube2 );


camera.position.z = 5;

var render = function () {
  requestAnimationFrame( render );
  stats.begin();
  renderer.render( scene, camera );
  stats.end();
};

render();

var mouse = new Object();

function moveMouse(event) {
 
  var nx = ( event.clientX / window.innerWidth ) * 2 - 1;
  //negative (normalized) necessary for THREE
  var ny = - ( event.clientY / window.innerHeight ) * 2 + 1;

  mouse.dx = nx - mouse.x;
  mouse.dy = ny - mouse.y;

  mouse.x = nx;
  mouse.y = ny;

  raycaster = new THREE.Raycaster();

  vector = new THREE.Vector3( mouse.x, mouse.y, 1 ).unproject( camera );

  raycaster.set( camera.position, vector.sub( camera.position ).normalize() );

  intersects = raycaster.intersectObjects( scene.children );

  if (typeof intersects[0] != 'undefined'){
    
    document.body.style.cursor="crosshair";

    INTERSECTED = intersects[ 0 ].object;  
    if(typeof INTERSECTED != 'undefined'){
      mouse.lastIntersected = INTERSECTED; 
      INTERSECTED.rotation.y += mouse.dx;
      INTERSECTED.rotation.x -= mouse.dy; 
    }
  }else{
    if(typeof mouse.lastIntersected !='undefined'){
      mouse.lastIntersected.rotation.y += mouse.dx; 
      mouse.lastIntersected.rotation.x -= mouse.dy;  
      document.body.style.cursor="auto";
    }
  }
}
