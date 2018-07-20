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
//Regra do jogo
function start() {
	alert("A diversão vai começar!");
	var canvas = document.getElementById("game");
	var ctx = canvas.getContext("2d");
	var text = new Text();

	const WIDTH = canvas.offsetWidth;
	const HEIGHT = canvas.offsetHeight;
	const street = { pos: {x: 0, y: HEIGHT-20},
				     size: {w: WIDTH, h: 20} };

	const FPS = 60;
	const DT = 1/FPS;
	const G = -20;

	var shots = []; var shoot = false;
	var shooter = new Shooter({x: WIDTH/2, y: street.pos.y+10}, {w: 84, h: 140}, "img/cannon");
	var ball = new Shot(shooter.ballPos.x, shooter.ballPos.y, 0, -325, 12, "img/ball.png");

	var lvl = 0; var pontos = 0;
	var gen = new CollectionGenerator(WIDTH, HEIGHT);
	var builds = [];
	var asteroids = [];

	//sons
	var asteroide = new Audio('sound/fall.mp3');
	var explosao = new Audio('sound/boom.mp3');
	var musica = new Audio('sound/war.m4a');
	var fim = new Audio('sound/gameover.mp3');
	var verificaInicio = 0;
	//reset do jogo
	function reset() {
		if(verificaInicio != 0){//controla a mensagem de reset
			alert("Game Over!");
		}
		verificaInicio++;
		fim.play();
		lvl = 1; pontos = 0;
		builds = gen.build(11);//gera predios
		builds.splice(5, 1); // remove o que esta na frente do shooter
		asteroids = gen.asteroid(lvl); //reseta o gen de asteroide
		shooter.reset();//volta o shooter para pos inicial
	}; reset();

	var loop = function() {
		ctx.clearRect(0, 0, WIDTH, HEIGHT);
		//musica jogo fundo
		musica.play();
		musica.volume = 0.3;
		musica.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
    });
		//reset do jogo
		if(builds.length == 0) {
			reset();
		}

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
						if(pontos % 8 == 0) {
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
					break;
				}
			}
		}

		builds.forEach( function(build) { build.draw(ctx); } );
		asteroids.forEach( function(ast) { ast.draw(ctx, true); } );
		shots.forEach( function(shot) { shot.draw(ctx); } );
		//texto placar
		shooter.draw(ctx);
		text.raster(ctx, "Destruidos: " + pontos, 10, 25);

		if(asteroids.length < lvl){
			asteroids = asteroids.concat(gen.asteroid(lvl));
		}

	}

	setInterval(loop, 1000/FPS);
	//controle do jogo
	addEventListener("keydown", function(e){
		if(e.keyCode == 32 && !shoot) { // Space
			ball.pos = {x: shooter.ballPos.x, y: shooter.ballPos.y};
			ball.setVelocityVector(shooter.center);
			shots.push(ball);
			ball = null;
			shoot = true;
		}
		else if(e.keyCode == 81 || e.keyCode == 37 || e.keyCode == 65){
			shooter.omega = -2;
			e.preventDefault();
		}

		else if(e.keyCode == 69 || e.keyCode == 39 || e.keyCode == 68){
			shooter.omega = 2;
			e.preventDefault();
		}

	});

	addEventListener("keyup", function(e){
		if(e.keyCode == 32) { // Space
			ball = new Shot(shooter.ballPos.x, shooter.ballPos.y, 0, -325, 12, "img/ball.png");
			shoot = false;
		}
		else if(e.keyCode == 81 || e.keyCode == 37){
			shooter.omega = 0;
		}
		else if(e.keyCode == 69 || e.keyCode == 39) {
			shooter.omega = 0;
		}
	});
}
