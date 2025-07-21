class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.speed = 200;
        this.health = 100;
        this.maxHealth = 100;
        this.lastShot = 0;
        this.shootCooldown = 200;
    }

    update(deltaTime, keys, canvasWidth, canvasHeight) {

        let dx = 0;
        let dy = 0;

        if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) dx += 1;


        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }


        this.x += dx * this.speed * (deltaTime / 1000);
        this.y += dy * this.speed * (deltaTime / 1000);


        this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));


        this.lastShot += deltaTime;
    }

    shoot(targetX, targetY, bullets) {
        if (this.lastShot < this.shootCooldown) return;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const angle = Math.atan2(dy, dx);

        bullets.push(new Bullet(this.x, this.y, angle));
        this.lastShot = 0;
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }

    render(ctx) {

        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();


        const barWidth = 30;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 10;

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#00ff00';
        const healthPercent = this.health / this.maxHealth;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}


class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 400;
        this.radius = 3;
        this.damage = 25;
    }

    update(deltaTime) {
        this.x += Math.cos(this.angle) * this.speed * (deltaTime / 1000);
        this.y += Math.sin(this.angle) * this.speed * (deltaTime / 1000);
    }

    isOffScreen(width, height) {
        return this.x < -10 || this.x > width + 10 ||
            this.y < -10 || this.y > height + 10;
    }

    render(ctx) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}


class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.speed = 50;
        this.health = 50;
        this.maxHealth = 50;
        this.damage = 20;
    }

    update(deltaTime, player) {

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.x += (dx / distance) * this.speed * (deltaTime / 1000);
            this.y += (dy / distance) * this.speed * (deltaTime / 1000);
        }
    }

    takeDamage(damage) {
        this.health -= damage;
    }

    render(ctx) {

        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();


        const barWidth = 20;
        const barHeight = 3;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 8;

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#00ff00';
        const healthPercent = this.health / this.maxHealth;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}


class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;


        this.isRunning = false;
        this.score = 0;
        this.wave = 1;


        this.player = null;
        this.bullets = [];
        this.enemies = [];


        this.keys = {};
        this.mouse = { x: 0, y: 0 };


        this.lastTime = 0;
        this.enemySpawnTimer = 0;
        this.waveTimer = 0;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.player = new Player(this.width / 2, this.height / 2);
        this.start();
    }

    setupEventListeners() {

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });


        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.isRunning) {
                this.player.shoot(this.mouse.x, this.mouse.y, this.bullets);
            }
        });
    }

    start() {
        this.isRunning = true;
        this.gameLoop();
    }

    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {

        this.player.update(deltaTime, this.keys, this.width, this.height);


        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(deltaTime);
            if (this.bullets[i].isOffScreen(this.width, this.height)) {
                this.bullets.splice(i, 1);
            }
        }


        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update(deltaTime, this.player);
            if (this.enemies[i].health <= 0) {
                this.enemies.splice(i, 1);
                this.score += 10;
            }
        }


        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer > 1000) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }


        this.checkCollisions();


        this.updateUI();


        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    render() {

        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.width, this.height);


        this.player.render(this.ctx);

        this.bullets.forEach(bullet => bullet.render(this.ctx));
        this.enemies.forEach(enemy => enemy.render(this.ctx));
    }

    spawnEnemy() {

        let x, y;
        const side = Math.floor(Math.random() * 4);

        switch (side) {
            case 0:
                x = Math.random() * this.width;
                y = -20;
                break;
            case 1:
                x = this.width + 20;
                y = Math.random() * this.height;
                break;
            case 2:
                x = Math.random() * this.width;
                y = this.height + 20;
                break;
            case 3:
                x = -20;
                y = Math.random() * this.height;
                break;
        }

        this.enemies.push(new Enemy(x, y));
    }

    checkCollisions() {

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (this.isColliding(this.bullets[i], this.enemies[j])) {
                    this.enemies[j].takeDamage(this.bullets[i].damage);
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }


        this.enemies.forEach(enemy => {
            if (this.isColliding(this.player, enemy)) {
                this.player.takeDamage(enemy.damage);
                enemy.health = 0;
            }
        });
    }

    isColliding(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.radius + obj2.radius);
    }

    updateUI() {
        document.getElementById('health').textContent = this.player.health;
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
    }

    gameOver() {
        this.isRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
    }

    restart() {

        this.score = 0;
        this.wave = 1;
        this.bullets = [];
        this.enemies = [];
        this.player = new Player(this.width / 2, this.height / 2);
        this.enemySpawnTimer = 0;
        this.waveTimer = 0;


        document.getElementById('gameOver').style.display = 'none';


        this.start();
    }
}


let game;


function restartGame() {
    game.restart();
}


window.addEventListener('load', () => {
    game = new Game();
});