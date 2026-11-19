// Record gameplay frame by frame: the game loop is stopped and stepped manually at 30 fps,
// with a small bot doing the aiming, so the capture is smooth whatever the headless frame rate.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const OUT = process.argv[2];
const SECONDS = Number(process.argv[3] || 19);
const START_M = Number(process.argv[4] || 150);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/sdk.crazygames.com/**', (r) => r.abort());
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(3000);
  await page.evaluate(async (startM) => {
    const m = await import('/src/save.js');
    const s = m.getSave();
    Object.assign(s.owned, { shotgun: true, rifle: true, dual: true });
    s.equipped = 'revolver'; s.dynamite = 5;
    s.seenOutlaws = { hider: 1, gambler: 1, rifleman: 1, dynamite: 1, undertaker: 1, gunslinger: 1, drifter: 1 };
    s.upgrades = { damage: 4, health: 6, steady: 10 };
    window.__game.scene.start('Run', { startM });
  }, START_M);
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const game = window.__game;
    game.loop.sleep();
    window.__t = performance.now();
    window.__frame = 0;
    window.__bot = { nextShot: 0, plan: [] };
    window.__tick = () => {
      const g = game.scene.getScene('Run');
      const f = window.__frame++;
      const B = window.__bot;
      if (g && g.player) {
        g.hp = g.maxHp;
        g.shotsFired = Math.max(g.shotsFired, 1); g.setHint?.('');
        // weapon changes for variety
        if (f === 150) g.switchWeapon('dual');
        if (f === 330) g.switchWeapon('shotgun');
        if (f === 470) g.switchWeapon('rifle');
        if (g.state === 'draw' && !B.drew) { B.drew = (B.drew || 0) + 1; if (B.drawWait === undefined) B.drawWait = f + 6; }
        if (g.state === 'draw' && f >= (B.drawWait ?? 0)) { g.playerQuickShot(); B.drawWait = undefined; }
        if (g.state === 'fight' && g.player.alive) {
          const targets = g.active.filter((e) => e.alive && e.g.x < 1250 && (!e.cover || e.up));
          if (targets.length && g.clock >= B.nextShot && !g.reloading) {
            const e = targets[0];
            const h = e.g.headWorld();
            const s = g.player.shoulderWorld();
            const a = Math.atan2(h.y - s.y, h.x - s.x);
            g.player.aim(a);
            if (f > 260 && f < 300 && (window.__dyn ?? 0) === 0) { window.__dyn = 1; g.throwPlayerDynamite(); }
            else g.playerFire(a);
            B.nextShot = g.clock + 420;
          }
        }
      }
      window.__t += 1000 / 30;
      game.step(window.__t, 1000 / 30);
    };
  });
  const total = Math.round(SECONDS * 30);
  const states = [];
  for (let i = 0; i < total; i++) {
    states.push(await page.evaluate(() => { window.__tick(); return window.__game.scene.getScene('Run').state; }));
    await page.screenshot({ path: `${OUT}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  const st = await page.evaluate(() => { const g = window.__game.scene.getScene('Run'); return { meters: g.meters, kills: g.kills }; });
  require('fs').writeFileSync(OUT + '/states.json', JSON.stringify(states));
  console.log(JSON.stringify({ st, errors }));
  await browser.close();
})();
