///// scene setting /////

var stats = new Stats();
stats.showPanel( 0 );
document.body.appendChild( stats.dom );

var scene = new THREE.Scene();
var aspect = window.innerWidth / window.innerHeight;
var camera = new THREE.PerspectiveCamera( 120, aspect, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

//vaisseau
var vaisseau = null;
function initVaisseau() {
    var loader = new THREE.JSONLoader();
    loader.load('./vaisseau.json', function(geometry) {
        vaisseau = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color:0xaaaaff }));
	vaisseau.position.y = -2;
        vaisseau.scale.set(0.7,0.7,0.7);
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
    var blurp1 = eltGen(x, y, z, blurp1Geom, blurp1Mat);
    blurp1.doMove = function () {
      blurp1.position.y = terra.demiheight* Math.cos(blurp1Speed * (Date.now()-dateDebut));
    };
    return blurp1;
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
//scene.fog = new THREE.Fog( 0x000000  , 1, 50);

//cam
var cameraZDecal = -25;
var cameraYDecal = 0;
var cameraXDecal = 20;
camera.position.x = cameraXDecal;
camera.position.y = cameraYDecal;
camera.rotation.y = Math.PI /2;

//////// game param ////////////
var dateDebut = Date.now();

var speed = 0.01;
var controlSpeed = 1;

var playerInput = {}; 
playerInput.left = false;
playerInput.right = false;
playerInput.up = false;
playerInput.down = false;

var terra = {};
terra.horizon = {};
terra.demiwidth = 4;//width = 8
terra.demiheight = 20;//height = 20
terra.demiProf = 40;
terra.horizon.dist = terra.demiProf +10;
terra.horizon.z = -terra.horizon.dist;
terra.elements = new Set();//not collidable objects

var collisionners = new Set();

//lvl 1 def
var blurp1Serie1BeginZ = 70;
var blurp1Speed = 0.002;



////////// render loop /////////////////
function terraGen(){
  if(vaisseau!==null){
    //create some cubes to complete horizon
    var deltaHorizon = camera.position.z - terra.horizon.z;
    while (deltaHorizon <= terra.horizon.dist){
      terra.horizon.z -= terraCubeWidth;
      terra.elements.add(terraCubeGen(-1 * terra.demiwidth * Math.cos(0.1 * terra.horizon.z),-terra.demiheight,terra.horizon.z));
      terra.elements.add(terraCubeGen(terra.demiwidth * Math.cos(0.1 * terra.horizon.z),-terra.demiheight,terra.horizon.z));
      deltaHorizon = camera.position.z - terra.horizon.z;
    }
    //destroy elements going out;
    terra.elements.forEach(function(elt, key, eltSet){
      if(elt.position.z > camera.position.z+terra.demiProf){
        scene.remove(elt);
        eltSet.delete(elt);
      }
    });    
  }
}

function ennemyGen(){
  if(vaisseau!==null){
    if(terra.horizon.z <= -blurp1Serie1BeginZ){
      if(collisionners.size===0){
        collisionners.add(blurp1Gen(0, 0, vaisseau.position.z-blurp1Serie1BeginZ));
        var audio = new Audio('blurp1.wav');
        audio.play();
      }else{
        //delete collisionners who are going out of the screen
        collisionners.forEach(function (aColl, key, theCollSet){
          if(aColl.position.z > camera.position.z+terra.demiProf){
            scene.remove(aColl);
            theCollSet.delete(aColl);
          }
	});
      }
    }
  }
}

function moveCollisionners(){
  collisionners.forEach(function (aCollisionner){
    aCollisionner.doMove();
  });
}

var vaisseauWidth = 2;
function collide(){
  if(vaisseau!==null){
    collisionners.forEach(function (aColl){
      if(Math.abs(aColl.position.y - vaisseau.position.y) < vaisseauWidth && 
         Math.abs(aColl.position.z - vaisseau.position.z) < vaisseauWidth){
        var audio = new Audio('explode1.wav');
        audio.play();	
      }
    });
  }
}

function updateCam(){
  if(vaisseau!==null){
    camera.position.z -= speed * (Date.now()-lastRender); 
  }
}

function updateVaisseau(){
  if(vaisseau!==null){
    vaisseau.position.z -= speed * (Date.now()-lastRender);
    if(playerInput.left ){
      vaisseau.position.z += controlSpeed;
    }
    if(playerInput.right){
      vaisseau.position.z -= controlSpeed;
    }
    if(playerInput.up && vaisseau.position.y < terra.demiheight){
      vaisseau.position.y += controlSpeed;
    }
    if(playerInput.down && vaisseau.position.y > -terra.demiheight){
      vaisseau.position.y -= controlSpeed;
    }
    //vaisseau should stay in the view of the cam
    vaisseau.position.z = Math.min(vaisseau.position.z, camera.position.z + terra.demiProf);
    vaisseau.position.z = Math.max(vaisseau.position.z, camera.position.z - terra.demiProf);
  } 
}

var update = function() {
  if(vaisseau!==null){
    updateCam();
    updateVaisseau();
    terraGen();
    ennemyGen();
    moveCollisionners();
    collide(); 
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



