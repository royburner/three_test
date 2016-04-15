///// scene setting /////

var stats = new Stats();
stats.showPanel( 0 );
document.body.appendChild( stats.dom );

var scene = new THREE.Scene();
var aspect = window.innerWidth / window.innerHeight;
var camera = new THREE.PerspectiveCamera( 75, aspect, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var vaisseau = null;
function initMesh() {
    var loader = new THREE.JSONLoader();
    loader.load('./vaisseau.json', function(geometry) {
        vaisseau = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color:0xaaaaff }));
	vaisseau.position.y = -2;
        vaisseau.scale.set(0.2,0.2,0.2);
        vaisseau.rotation.x += 0.5;
        scene.add(vaisseau);
    });
}
initMesh();

var terraCubeWidth = 1;
var terraCubeGeom = new THREE.BoxGeometry( terraCubeWidth, terraCubeWidth, terraCubeWidth );
var terraCubeMat = new THREE.MeshLambertMaterial({color:0x00ff00 });
function terraCubeGen(x, y, z){
      var cube1 = new THREE.Mesh( terraCubeGeom, terraCubeMat );
      cube1.position.x = x;
      cube1.position.y = y;
      cube1.position.z = z;
      scene.add( cube1 );
}

//lights
var light = new THREE.AmbientLight(0xaaaaaa);
scene.add(light);
var light2 = new THREE.DirectionalLight(0xffffff, 1);
light2.position.set( 0, 500, 100 );
scene.add(light2);

//fog
scene.fog = new THREE.Fog( 0x000000  , 1, 50);

//cam
camera.position.z = 5;

//////// game param ////////////
var speed = 0.02;
var controlSpeed = 0.2;

var playerInput = {}; 
playerInput.left = false;
playerInput.right = false;
playerInput.up = false;
playerInput.down = false;

var terra = {};
terra.horizon = {};
terra.horizon.dist = 60;
terra.horizon.z = -terra.horizon.dist;
terra.demiwidth = 4;//width = 8
terra.demiheight = 2;//height = 4

////////// render loop /////////////////
function terraGen(){
  if(vaisseau!==null){
    //create some cubes to complete horizon
    var deltaHorizon = vaisseau.position.z - terra.horizon.z;
    while (deltaHorizon <= terra.horizon.dist){
      terra.horizon.z -= terraCubeWidth;
      terraCubeGen(-4 * Math.cos(terra.horizon.z),-2,terra.horizon.z);
      terraCubeGen(4 * Math.cos(terra.horizon.z),-2,terra.horizon.z);
      deltaHorizon = vaisseau.position.z - terra.horizon.z;
    }    
  }
}

var update = function() {
  if(vaisseau!==null){
    vaisseau.position.z -= speed * (Date.now()-lastRender);
    //follow vaisseau
    camera.position.z = vaisseau.position.z + 5;
    terraGen();
    
    if(playerInput.left && vaisseau.position.x > -terra.demiwidth){
      vaisseau.position.x -= controlSpeed;
    }
    if(playerInput.right && vaisseau.position.x < terra.demiwidth){
      vaisseau.position.x += controlSpeed;
    }
    if(playerInput.up && vaisseau.position.y < terra.demiheight){
      vaisseau.position.y += controlSpeed;
    }
    if(playerInput.down && vaisseau.position.y > -terra.demiheight){
      vaisseau.position.y -= controlSpeed;
    }
  }
};

var lastRender = Date.now();
var render = function () {
  requestAnimationFrame( render );
  stats.begin();
  update();
  renderer.render( scene, camera );
  lastRender = Date.now();
  stats.end();
};
render();


////////// input ////////////////

var mouse = {};

function leftClick(event) {
  mouse.lastIntersected = null; 
}
document.body.addEventListener("click", leftClick);

function keyPress(event) {
  if(event.keyCode=='0'){
    var audio = new Audio('pan.wav');
    audio.play(); 
  }
}
document.body.addEventListener("keypress", keyPress);

function keyDown(event){
  if(event.keyCode=='37'){
    playerInput.left = true;
  }
  else if(event.keyCode=='39'){
    playerInput.right = true; 
  }
  if(event.keyCode=='38'){
     playerInput.up = true;
  }
  if(event.keyCode=='40'){
     playerInput.down = true;
  } 
}
document.body.addEventListener("keydown", keyDown);

function keyUp(event){
  if(event.keyCode=='37'){
    playerInput.left = false;
  }
  else if(event.keyCode=='39'){
    playerInput.right = false; 
  }
  if(event.keyCode=='38'){
     playerInput.up = false;
  }
  if(event.keyCode=='40'){
     playerInput.down = false;
  } 
}
document.body.addEventListener("keyup", keyUp);



