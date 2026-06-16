/**
 * bg-scroll-text.js
 *
 * Drop-in, self-contained background effect: a faint grid of repeating
 * text tiles the entire viewport. Moving the mouse pushes an
 * acceleration vector, which feeds into a velocity that the scroll
 * offset follows — so both speeding up and coasting to a stop take a
 * moment, instead of snapping instantly to the cursor's motion.
 *
 * Usage: just include this file on any page, no HTML or CSS required.
 *   <script src="bg-scroll-text.js" defer></script>
 *
 * It builds and styles its own <canvas>, so it can be dropped into the
 * index page or any project page without touching markup. All the
 * tunable bits are the constants right below.
 */
(function () {
    'use strict';

    // Respect reduced-motion preferences — skip the effect entirely.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ---- tunables -----------------------------------------------------
    var TEXT = 'HIRE';
    var FONT_SIZE = 14;          // px
    var LINE_HEIGHT = 34;        // px, vertical spacing between text rows
    var OPACITY = 0.06;          // 0–1, keep this low so it stays a background detail
    var TEXT_COLOR = '238, 240, 242'; // rgb triplet, matches --text in the site palette
    var FONT_FAMILY = '"IBM Plex Mono", monospace';

    var ACCEL_STRENGTH = 0.8;    // how hard each pixel of mouse movement pushes the acceleration vector
    var FRICTION = 3.2;          // higher = velocity decays (and ramps up) faster, lower = more drift/lag
    var MAX_VELOCITY = 600;      // px/sec cap, keeps a fast mouse flick from sending things flying
    var VELOCITY_EPSILON = 0.5;  // px/sec, below this we just call it "stopped" and stop redrawing
    // ---------------------------------------------------------------------

    // Build our own canvas and pin it behind everything.
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    document.body.insertBefore(canvas, document.body.firstChild);

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    var offsetX = 0, offsetY = 0;     // accumulated scroll position
    var velocityX = 0, velocityY = 0; // current scroll speed (px/sec)
    var pendingAX = 0, pendingAY = 0; // raw mouse movement collected since last frame
    var lastX = null, lastY = null;   // last known cursor position
    var lastTime = null;              // timestamp of the previous frame, for dt
    var tileWidth = 0;                // measured width of one TEXT string

    function resize() {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = FONT_SIZE + 'px ' + FONT_FAMILY;
        tileWidth = ctx.measureText(TEXT).width;
        render();
    }

    function render() {
        var w = window.innerWidth;
        var h = window.innerHeight;

        ctx.clearRect(0, 0, w, h);
        ctx.font = FONT_SIZE + 'px ' + FONT_FAMILY;
        ctx.fillStyle = 'rgba(' + TEXT_COLOR + ', ' + OPACITY + ')';
        ctx.textBaseline = 'top';

        // Wrap offsets into the tile size so the pattern loops seamlessly
        // instead of drifting into ever-larger numbers.
        var wrapX = ((offsetX % tileWidth) + tileWidth) % tileWidth;
        var wrapY = ((offsetY % LINE_HEIGHT) + LINE_HEIGHT) % LINE_HEIGHT;

        var rowCount = Math.ceil(h / LINE_HEIGHT) + 2;

        for (var r = -1; r < rowCount; r++) {
            var y = r * LINE_HEIGHT - wrapY;
            // Stagger alternating rows by half a tile so the grid reads less
            // like a uniform spreadsheet and more like organic scrolling text.
            var stagger = (r % 2 === 0) ? 0 : tileWidth / 2;
            var x = -tileWidth - wrapX + stagger;
            while (x < w) {
                ctx.fillText(TEXT, x, y);
                x += tileWidth;
            }
        }
    }

    function onMouseMove(e) {
        // Skip the very first sample after page load / re-entry so we don't
        // compute a huge bogus delta from "nowhere" to the cursor's position.
        if (lastX !== null) {
            pendingAX += e.clientX - lastX;
            pendingAY += e.clientY - lastY;
        }
        lastX = e.clientX;
        lastY = e.clientY;
    }

    function onMouseLeave() {
        lastX = null;
        lastY = null;
    }

    function tick(now) {
        if (lastTime === null) lastTime = now;
        var dt = Math.min((now - lastTime) / 1000, 0.05); // seconds, clamped against tab-switch gaps
        lastTime = now;

        // This frame's mouse movement becomes an acceleration impulse —
        // scrolling left/up is the opposite sign of the cursor's motion.
        var ax = pendingAX * ACCEL_STRENGTH;
        var ay = pendingAY * ACCEL_STRENGTH;
        pendingAX = 0;
        pendingAY = 0;

        var wasMoving = Math.abs(velocityX) > VELOCITY_EPSILON || Math.abs(velocityY) > VELOCITY_EPSILON;

        if (ax !== 0 || ay !== 0 || wasMoving) {
            // Acceleration feeds velocity — this is the "speeding up takes time" part,
            // since each frame only nudges velocity rather than setting it outright.
            velocityX += ax;
            velocityY += ay;

            // Friction continuously bleeds velocity off, frame-rate independent.
            // This is the "coasting to a stop takes time" part.
            var decay = Math.exp(-FRICTION * dt);
            velocityX *= decay;
            velocityY *= decay;

            // Cap top speed so a fast flick doesn't send the text flying off-screen.
            var speed = Math.hypot(velocityX, velocityY);
            if (speed > MAX_VELOCITY) {
                var scale = MAX_VELOCITY / speed;
                velocityX *= scale;
                velocityY *= scale;
            }

            // Fully settle once velocity is negligible, so we can stop redrawing.
            if (Math.abs(velocityX) < VELOCITY_EPSILON) velocityX = 0;
            if (Math.abs(velocityY) < VELOCITY_EPSILON) velocityY = 0;

            offsetX += velocityX * dt;
            offsetY += velocityY * dt;

            // Keep the stored offset itself wrapped into a single tile's worth
            // of range. If it's left to grow unbounded over a long session,
            // floating point precision degrades with the magnitude, and the
            // modulo math below in render() starts flickering right around
            // the wrap point — that's the jitter.
            offsetX = ((offsetX % tileWidth) + tileWidth) % tileWidth;
            offsetY = ((offsetY % LINE_HEIGHT) + LINE_HEIGHT) % LINE_HEIGHT;

            render();
        }

        requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    resize();
    requestAnimationFrame(tick);
})();