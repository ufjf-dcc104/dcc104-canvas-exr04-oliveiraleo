//Texto do placar
function Text(font, size, rgb) {
	this.font = font 	|| "Courier";
	this.size = size 	|| 20;
	this.color = rgb 	|| "#000000" ;

	this.raster = function(ctx, text, x, y) {
		ctx.font = "" + this.size + "px " + this.font;
		ctx.fillStyle = this.color;
		ctx.fillText(text, x, y);
	}
}
//variaveis globais
var pause = false;
var inicio = false;

//Regra do jogo
function start() {
	//alert("A diversão vai começar!");
	var canvas = document.getElementById("game");
	var ctx = canvas.getContext("2d");
	//texto do jogo na tela
	var destruidos = new Text();
	var textoTiros = new Text();
	var canhaoVidas = new Text();
	var textoRatio = new Text();
	var textoBuilds = new Text();

	const WIDTH = canvas.offsetWidth;
	const HEIGHT = canvas.offsetHeight;
	const street = { pos: {x: 0, y: HEIGHT-20},
				     size: {w: WIDTH, h: 20} };

	const FPS = 60;
	const DT = 1/FPS;
	const G = -20;
	//variaveis globais
	var shots = []; var shoot = false;
	var shooter = new Shooter({x: WIDTH/2, y: street.pos.y+10}, {w: 84, h: 140}, "img/cannon");
	var ball = new Shot(shooter.ballPos.x, shooter.ballPos.y, 0, -325, 12, "img/ball.png");

	var lvl = 0;
	var pontos = 0;
	var gen = new CollectionGenerator(WIDTH, HEIGHT);
	var builds = [];
	var asteroids = [];
	var tiros = 0;
	var ratio = 0;
	var recomeca = true;
	var verificaInicio = false;
	//var predios = 0;
	//sons
	var explosao = new Audio('sound/boom.mp3');
	var musica = new Audio('sound/theme.mp3');
	var fim = new Audio('sound/gameover.mp3');
	//reset do jogo
	function reset() {
		if(recomeca){
			var msg = new Text("Courier", 30, "black");
			if (verificaInicio) {
			msg.raster(ctx, "Aperte R para continuar", WIDTH/4, HEIGHT/2 );
			}
		}
		verificaInicio = true;
		musica.currentTime = 0; //recomeca a musica de fundo
		lvl = 1;
		pontos = 0;
		builds = gen.build(11);//gera predios
		builds.splice(5, 1); // remove o que esta na frente do shooter
		asteroids = gen.asteroid(lvl); //reseta o gen de asteroide
		shooter.reset();//volta o shooter para posicao inicial
		tiros = 0;
		ratio = 0;
		//shoot.length = 0;
	}; reset();
	//regra do jogo
	var loop = function() {
		if(inicio && !pause && recomeca){
		ctx.clearRect(0, 0, WIDTH, HEIGHT);
		//musica jogo fundo
		musica.play();
		musica.volume = 0.3;
		musica.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
    });
		//reseta o jogo, predios destruidos
		if(builds.length == 0) {
			fim.play();
			reset();
			recomeca = false;
		}
		//calcula a Precisão
		ratio = Math.round((3*pontos/tiros)*100);
		for(var i = 0; i < asteroids.length; i++) {
			var ast = asteroids[i]; ast.move(DT, G);
			if(ast.center.y > HEIGHT + ast.radius || ast.center.x < -ast.radius || ast.center.x > WIDTH + ast.radius)
				asteroids.splice(i, 1);
		}
		for(var i = 0; i < shots.length; i++) {
			shots[i].move(DT, G);
			if(shots[i].pos.y < 0 || shots[i].pos.x < 0 || shots[i].pos.x > WIDTH)
				shots.splice(i, 1);
		}
		shooter.move(DT, G);

		for(var i = 0; i < asteroids.length; i++) {
			for(var j = 0; j < shots.length; j++) {
				var status = asteroids[i].reached(shots[j]);
				if(status != 0) {
					shots.splice(j, 1);
					if(status == 2) {
						asteroids.splice(i, 1);
						pontos++;
						//controle de nivel
						if(pontos % 3 == 0) {
							lvl++;
						}
						break;
					}
				}
			}
		}
		for(var i = 0; i < builds.length; i++) {
			for(var j = 0; j < asteroids.length; j++) {
				var status = builds[i].colidiu(asteroids[j]);
				if(status != 0) {
					asteroids.splice(j, 1);
					if(status == 2) {
						builds.splice(i, 1);
						break;
					}
				}
			}
		}
		for(var i = 0; i < asteroids.length; i++) {
			var status = shooter.colidiu(asteroids[i]);
			if(status != 0) {
				asteroids.splice(i, 1);
				if(status == 2) {
					reset();
					fim.play();
					recomeca = false;
					break;
				}
			}
		}
		//desenha os objetos no canvas
		builds.forEach( function(build) { build.draw(ctx); } );
		asteroids.forEach( function(ast) { ast.draw(ctx, true); } );
		shots.forEach( function(shot) { shot.draw(ctx); } );
		shooter.draw(ctx);
		//texto placar
		destruidos.raster(ctx, "Destruidos: " + pontos, 10, 25);
		canhaoVidas.raster(ctx, "Vidas: " + shooter.life, 10, 50);
		textoBuilds.raster(ctx, "Prédios: " + builds.length, 10, 75);
		textoTiros.raster(ctx, "Disparos: " + tiros, (WIDTH/2)+252, 25);
		textoRatio.raster(ctx, "Precisão: " + ratio + "%", (WIDTH/2)+252, 50);

		if(asteroids.length < lvl){
			asteroids = asteroids.concat(gen.asteroid(lvl));
		}
	}else if(!inicio){
		var msg = new Text("Courier", 30, "black");
		msg.raster(ctx, "Aperte ENTER para começar", WIDTH/5, HEIGHT/2 );
	}else if(pause){
		var msg = new Text("Courier", 30, "black");
		msg.raster(ctx, "Aperte P para continuar", WIDTH/4, HEIGHT/2 );
	}//else

}

	setInterval(loop, 1000/FPS);
	//controle do jogo
	addEventListener("keydown", function(e){
		if(e.keyCode == 32 && !shoot) { // Espaco
			ball.pos = {x: shooter.ballPos.x, y: shooter.ballPos.y};
			ball.setVelocityVector(shooter.center);
			shots.push(ball);
			ball = null;
			shoot = true;
			tiros++;
		}if(e.keyCode == 81 || e.keyCode == 37 || e.keyCode == 65){ //esquerda
			shooter.omega = -2;
			e.preventDefault();
		}else if(e.keyCode == 69 || e.keyCode == 39 || e.keyCode == 68){ //direita
			shooter.omega = 2;
			e.preventDefault();
		}if(e.keyCode == 13){// Enter
			inicio = true;
			e.preventDefault();
		}if(e.keyCode == 80){// P
				pause = !pause;
				//e.preventDefault();
			}if (e.keyCode == 82) {// R
				recomeca = true;
			}
	});

	addEventListener("keyup", function(e){
		if(e.keyCode == 32) { // Espaco
			ball = new Shot(shooter.ballPos.x, shooter.ballPos.y, 0, -325, 12, "img/ball.png");
			shoot = false;
		}
		if(e.keyCode == 37 || e.keyCode == 65){ //esquerda
			shooter.omega = 0;
		}
		if(e.keyCode == 39 || e.keyCode == 68) { //direita
			shooter.omega = 0;
		}
	});
}
