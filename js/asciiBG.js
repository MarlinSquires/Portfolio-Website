// Ambient ASCII-grid background
(function drawASCII() {
    var canvas = document.getElementById('ascii-bg');
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ctx = canvas.getContext('2d');
    var chars = ' .:-=+*#%@';
    var fontSize = 48;
    var cols, rows, t = 0;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        cols = Math.ceil(canvas.width / fontSize);
        rows = Math.ceil(canvas.height / fontSize);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = fontSize + 'px "IBM Plex Mono", monospace';
        ctx.textBaseline = 'top';

        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var n = Math.sin(x * 0.18 + t) + Math.cos(y * 0.22 + t * 0.7);
                var v = (n + 2) / 4; // normalize 0..1
                if (v < 0.15) continue; // sparse field
                var idx = Math.floor(v * (chars.length - 1));
                var alpha = (v - 0.55) * 0.5;
                ctx.fillStyle = 'rgba(255, 138, 61, ' + alpha.toFixed(3) + ')';
                ctx.fillText(chars[idx], x * fontSize, y * fontSize);
            }
        }

        t += 0.012;
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
})();