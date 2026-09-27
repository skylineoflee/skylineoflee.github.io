// ============================================================
// 大鱼吃小鱼 - AI 鱼
// AI 行为：比玩家小的逃跑，比玩家大的追击（捕食者）
// 物种系统：每种鱼有独特体态（颜色/长宽比/尾鳍）
// ============================================================
(function (global) {
  'use strict';

  function Fish(cfg, world, forcedSize) {
    this.cfg = cfg;
    this.world = world;

    this.size = forcedSize || GameUtils.randFloat(cfg.minSize, cfg.maxSize);
    this.species = GameConfig.getSpecies(this.size);
    this.x = GameUtils.randFloat(cfg.spawnMargin, world.width - cfg.spawnMargin);
    this.y = GameUtils.randFloat(cfg.spawnMargin, world.height - cfg.spawnMargin);
    this.angle = GameUtils.randAngle();
    this.speed = GameUtils.randFloat(cfg.speedMin, cfg.speedMax);

    this.turnTimer = GameUtils.randFloat(1, 3);
    this.turnInterval = GameUtils.randFloat(1, 3);

    this.isFleeing = false;
    this.isChasing = false;
  }

  Fish.prototype.update = function (dt, player) {
    var cfg = this.cfg;

    // 循环距离
    var dx = this.x - player.x;
    var dy = this.y - player.y;
    if (dx > this.world.width / 2) dx -= this.world.width;
    else if (dx < -this.world.width / 2) dx += this.world.width;
    if (dy > this.world.height / 2) dy -= this.world.height;
    else if (dy < -this.world.height / 2) dy += this.world.height;
    var d = Math.sqrt(dx * dx + dy * dy);

    var playerBigger = player.size > this.size * 0.95;
    var fishBigger = this.size > player.size * 1.05;

    if (fishBigger && d < cfg.chaseRange) {
      // 大鱼追击玩家
      this.isChasing = true;
      this.isFleeing = false;
      var chaseAngle = Math.atan2(-dy, -dx); // 朝向玩家
      this.angle = GameUtils.lerpAngle(this.angle, chaseAngle, cfg.turnRate * 1.5);
      this.speed = cfg.speedMax * cfg.chaseSpeedMul;
    } else if (playerBigger && d < cfg.fleeRange) {
      // 小鱼逃跑
      this.isFleeing = true;
      this.isChasing = false;
      var fleeAngle = Math.atan2(dy, dx);
      this.angle = GameUtils.lerpAngle(this.angle, fleeAngle, cfg.turnRate * 2);
      this.speed = cfg.speedMax * cfg.fleeSpeedMul;
    } else {
      // 闲逛
      this.isFleeing = false;
      this.isChasing = false;
      this.turnTimer -= dt;
      if (this.turnTimer <= 0) {
        this.angle += GameUtils.randFloat(-1, 1);
        this.speed = GameUtils.randFloat(cfg.speedMin, cfg.speedMax);
        this.turnTimer = this.turnInterval;
      }
    }

    this.x += Math.cos(this.angle) * this.speed * dt * 60;
    this.y += Math.sin(this.angle) * this.speed * dt * 60;

    var w = this.world.width;
    var h = this.world.height;
    if (this.x < 0) this.x += w;
    else if (this.x > w) this.x -= w;
    if (this.y < 0) this.y += h;
    else if (this.y > h) this.y -= h;
  };

  global.Fish = Fish;
})(typeof window !== 'undefined' ? window : this);
