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
function initVaisseau() {
    var loader = new THREE.JSONLoader();
    loader.load('./vaisseau.json', function(geometry) {
        vaisseau = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color:0xaaaaff }));
	vaisseau.position.y = -2;
        vaisseau.scale.set(0.2,0.2,0.2);
        vaisseau.rotation.x += 0.5;
        scene.add(vaisseau);
    });
}
initVaisseau();

//game elements
function eltGen(x, y, z, geom, mat){
      var elt = new THREE.Mesh(geom, mat);
      elt.position.x = x;
      elt.position.y = y;
      elt.position.z = z;
      scene.add( elt );
      return elt;     
}

var blurp1Geom = null;
function initBlurp1Geom() {
    var loader = new THREE.JSONLoader();
    loader.load('./blurp1.json', function(geometry) {
         blurp1Geom = geometry;
    });
}
initBlurp1Geom();
var blurp1Mat = new THREE.MeshLambertMaterial({color:0x0000ff });
function blurp1Gen(x, y, z){
    return eltGen(x, y, z, blurp1Geom, blurp1Mat);
}

var terraCubeWidth = 1;
var terraCubeGeom = new THREE.BoxGeometry( terraCubeWidth, terraCubeWidth, terraCubeWidth );
var terraCubeMat = new THREE.MeshLambertMaterial({color:0x00ff00 });
function terraCubeGen(x, y, z){
      return eltGen( x, y, z, terraCubeGeom, terraCubeMat );
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
var cameraZDecal = 5;
camera.position.z = cameraZDecal;

//////// game param ////////////
var dateDebut = Date.now();

var speed = 0.01;
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

//lvl 1 def
var blurp1Serie1BeginZ = 70;
var blurp1Speed = 0.002;

////////// render loop /////////////////
function terraGen(){
  if(vaisseau!==null){
    //create some cubes to complete horizon
    var deltaHorizon = vaisseau.position.z - terra.horizon.z;
    while (deltaHorizon <= terra.horizon.dist){
      terra.horizon.z -= terraCubeWidth;
      terraCubeGen(-1 * terra.demiwidth * Math.cos(0.1 * terra.horizon.z),-2,terra.horizon.z);
      terraCubeGen(terra.demiwidth * Math.cos(0.1 * terra.horizon.z),-2,terra.horizon.z);
      deltaHorizon = vaisseau.position.z - terra.horizon.z;
    }    
  }
}

var blurp1Serie1 = null;
function ennemyGen(){
  if(vaisseau!==null){
    if(terra.horizon.z <= -blurp1Serie1BeginZ){
      if(blurp1Serie1===null){
        blurp1Serie1 = blurp1Gen(0, 0, vaisseau.position.z-blurp1Serie1BeginZ);
        blurp1Serie1.rotation.y = Math.PI/2;
        blurp1Serie1.scale.set(0.2,0.2,0.2);
        var audio = new Audio('blurp1.wav');
        audio.play();
      }
      if(vaisseau.position.z+cameraZDecal >= blurp1Serie1.position.z){
        blurp1Serie1.position.x = terra.demiwidth* Math.cos(blurp1Speed * (Date.now()-dateDebut));
      }else if(vaisseau.position.z+cameraZDecal < blurp1Serie1.position.z){
        scene.remove(blurp1Serie1);
        blurp1Serie1 = null;
      }
    }
  }
}

var update = function() {
  if(vaisseau!==null){
    vaisseau.position.z -= speed * (Date.now()-lastRender);
    //follow vaisseau
    camera.position.z = vaisseau.position.z + cameraZDecal;
    terraGen();
    ennemyGen(); 
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



