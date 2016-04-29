///// scene setting /////

var stats = new Stats();
stats.showPanel( 0 );
document.body.appendChild( stats.dom );

var scene = new THREE.Scene();
var aspect = window.innerWidth / window.innerHeight;
var camera = new THREE.PerspectiveCamera( 120, aspect, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer({ antialias: true });
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
function eltGen(x, y, z, geom, mat, xrot = 0, yrot = 0, zrot = 0, scale = 1){
      var elt = new THREE.Mesh(geom, mat);
      elt.position.x = x;
      elt.position.y = y;
      elt.position.z = z;
      elt.rotation.x = xrot;
      elt.rotation.y = yrot;
      elt.rotation.z = zrot;
      elt.scale.set(scale, scale, scale);
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

var weapon1Geom = new THREE.CylinderGeometry( 0, 5, 20, 4 );
var weapon1Mat = new THREE.MeshLambertMaterial({color:0xff0000});
function weapon1Gen(x, y, z){
  var weapon1 = eltGen( x, y, z-1, weapon1Geom, weapon1Mat,-Math.PI / 2, 0, 0, 0.1);//-1 for vaisseau with
  weapon1.speed = 1;
  weapon1.doMove = function () {
    weapon1.position.z -= weapon1.speed;
    weapon1.rotation.y += weapon1.speed;
    weapon1.speed += 0.5;
  };
  return weapon1;
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
playerInput.firing = false;

var terra = {};
terra.horizon = {};
terra.demiwidth = 4;//width = 8
terra.demiheight = 20;//height = 20
terra.demiProf = 40;
terra.horizon.z = camera.position.z - terra.demiProf ;
terra.elements = new Set();//not collidable objects

var collisionners = new Set();

var bullets = new Set();

//lvl 1 def
var blurp1Serie1BeginZ = -70;
var blurp1Speed = 0.002;



////////// render loop /////////////////
function terraGen(){
  if(vaisseau!==null){
    //create some cubes to complete horizon
    var deltaHorizon = terra.horizon.z - (camera.position.z - terra.demiProf);
    while (deltaHorizon >= terraCubeWidth ){
      terra.elements.add(terraCubeGen(-1 * terra.demiwidth * Math.cos(0.1 * terra.horizon.z),-terra.demiheight,terra.horizon.z));
      terra.elements.add(terraCubeGen(terra.demiwidth * Math.cos(0.1 * terra.horizon.z),-terra.demiheight,terra.horizon.z));
      terra.horizon.z -= terraCubeWidth;
      deltaHorizon = terra.horizon.z - (camera.position.z - terra.demiProf);
    }
  }
}

function ennemyGen(){
  if(vaisseau!==null){
    if(collisionners.size<=1){
      collisionners.add(blurp1Gen(0, 0, camera.position.z - terra.demiProf));
      //var audio = new Audio('blurp1.wav');
      //audio.play();
    }
  }
}

function moveElts(){
  collisionners.forEach(function (aCollisionner){
    aCollisionner.doMove();
  });
  bullets.forEach(function (aBullet){
    aBullet.doMove();
  });
}

var vaisseauWidth = 2;
function collide(){
  if(vaisseau!==null){
    collisionners.forEach(function (aColl, key, theSet){
      //collision with vessel
      if(Math.abs(aColl.position.y - vaisseau.position.y) < vaisseauWidth && 
         Math.abs(aColl.position.z - vaisseau.position.z) < vaisseauWidth){
        var audio = new Audio('explode1.wav');
        audio.play();	
      }
      //collision with bullets
      bullets.forEach(function (aBullet){
        if(Math.abs(aColl.position.y - aBullet.position.y) < 1 &&
           Math.abs(aColl.position.z - aBullet.position.z) < 10){
          var audio = new Audio('explode2.wav');
          audio.play();
          scene.remove(aColl);
          theSet.delete(aColl);
        }
      });
     
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

function fire(){
  if(vaisseau!==null && playerInput.firing===true && bullets.size<10){
    bullets.add(weapon1Gen(vaisseau.position.x, vaisseau.position.y, vaisseau.position.z));
    //var audio = new Audio('pan.wav');
    //audio.play();
  } 
}

function cleanEltSet(eltSet){
  eltSet.forEach(function (elt, key, theSet){
    if(elt.position.z > camera.position.z+terra.demiProf ||
       elt.position.z < camera.position.z-terra.demiProf ){
      scene.remove(elt);
      theSet.delete(elt);
    }
  });
}

function cleanup(){
  if(vaisseau!==null){
    cleanEltSet(collisionners);
    cleanEltSet(terra.elements);
    cleanEltSet(bullets);
  }     
}

var update = function() {
  if(vaisseau!==null){
    updateCam();
    updateVaisseau();
    terraGen();
    ennemyGen();
    moveElts();
    fire();
    collide(); 
    cleanup();
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

function keyDown(event){
  if(event.keyCode=='37'){
    playerInput.left = true;
  }
  if(event.keyCode=='39'){
    playerInput.right = true; 
  }
  if(event.keyCode=='38'){
     playerInput.up = true;
  }
  if(event.keyCode=='40'){
     playerInput.down = true;
  }
  if(event.keyCode=='70'){//f
     playerInput.firing = true;
  } 
}
document.body.addEventListener("keydown", keyDown);

function keyUp(event){
  if(event.keyCode=='37'){
    playerInput.left = false;
  }
  if(event.keyCode=='39'){
    playerInput.right = false; 
  }
  if(event.keyCode=='38'){
    playerInput.up = false;
  }
  if(event.keyCode=='40'){
    playerInput.down = false;
  }
  if(event.keyCode=='70'){//f
    playerInput.firing = false;
  } 
}
document.body.addEventListener("keyup", keyUp);



