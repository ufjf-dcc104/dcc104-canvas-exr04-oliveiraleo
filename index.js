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
	var canvas = document.getElementById("game");
	var ctx = canvas.getContext("2d");
	//texto do jogo na tela
	var texto = new Text();
	var msg = new Text("Courier", 30, "black");

	const WIDTH = canvas.offsetWidth;
	const HEIGHT = canvas.offsetHeight;
	const street = { pos: {x: 0, y: HEIGHT-20}, size: {w: WIDTH, h: 20} };

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
	//sons
	var explosao = new Audio();
	explosao.src = "sound/boom.mp3";
	var tiro = new Audio();
	tiro.src = "sound/shot.mp3";

	var musica = new Audio('sound/theme.mp3');
	var fim = new Audio('sound/gameover.mp3');

	var explode = function(){
		explosao.load();
		explosao.play();
	}

	var atira = function(){
		tiro.volume = 0.2;
		tiro.load();
		tiro.play();
	}
	//reset do jogo
	function reset() {
		if(recomeca){
			if (verificaInicio) {
				musica.pause();
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
		shots.length = 0; // limpa os tiros da tela
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
				shots.splice(i, 1);// limpa os tiros que saem da tela
		}
		//move o shooter
		shooter.move(DT, G);

		for(var i = 0; i < asteroids.length; i++) {
			for(var j = 0; j < shots.length; j++) {
				var status = asteroids[i].reached(shots[j]);
				if(status != 0) {//tiro colidiu com asteroide
					shots.splice(j, 1);//apaga o tiro da tela
					if(status == 2) {
						asteroids.splice(i, 1);// apaga o asteroide da tela
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
						builds.splice(i, 1);//apaga o predio da tela
						explode();
						break;
					}
				}
			}
		}
		for(var i = 0; i < asteroids.length; i++) {
			var status = shooter.colidiu(asteroids[i]);
			if(status != 0) {
				asteroids.splice(i, 1);//apaga asteroide que colidiu com o shooter
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
		texto.raster(ctx, "Destruidos: " + pontos, 10, 25);
		texto.raster(ctx, "Vidas:" + shooter.life, 10, 50);
		texto.raster(ctx, "Prédios:" + builds.length, 10, 75);
		texto.raster(ctx, "Disparos:" + tiros, (WIDTH/2)+252, 25);
		texto.raster(ctx, "Precisão:" + ratio + "%", (WIDTH/2)+252, 50);

		if(asteroids.length < lvl){
			asteroids = asteroids.concat(gen.asteroid(lvl));
		}
	}else if(!inicio){
		msg.raster(ctx, "Aperte ENTER para começar", WIDTH/5, HEIGHT/2 );
	}else if(pause){
		msg.raster(ctx, "Aperte P para continuar", WIDTH/4, HEIGHT/2 );
	}
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
			atira();
		}if(e.keyCode == 81 || e.keyCode == 37 || e.keyCode == 65){ //esquerda
			shooter.omega = -2;
			e.preventDefault();
		}if(e.keyCode == 69 || e.keyCode == 39 || e.keyCode == 68){ //direita
			shooter.omega = 2;
			e.preventDefault();
		}if(e.keyCode == 13){// Enter
			inicio = true;
			e.preventDefault();
		}if(e.keyCode == 80){// P
				pause = !pause;
			e.preventDefault();
			}if (e.keyCode == 82) {// R
				recomeca = true;
				e.preventDefault();
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
