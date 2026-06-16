// Ambient Forest Matrix Background
(function drawMatrix() {
    const canvas = document.getElementById('ascii-bg');
    // Guard clause for missing canvas or users opting out of animation configurations
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    const chars = '##**++.. '; // Clean mix of organic system elements and glyphs
    const fontSize = 16;
    let columns;
    let rainDrops;

    function init() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        columns = Math.floor(canvas.width / fontSize);

        // Populate array streams matching screen density width
        rainDrops = Array(columns).fill(1);
    }

    function draw() {
        // Semi-transparent overlay mask to produce smooth trailing effect
        ctx.fillStyle = 'rgba(10, 17, 13, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = fontSize + 'px "IBM Plex Mono", monospace';

        for (let i = 0; i < rainDrops.length; i++) {
            // Select random character symbol
            const text = chars.charAt(Math.random() * chars.length);
            const x = i * fontSize;
            const y = rainDrops[i] * fontSize;

            // Generate cascading green variation layout
            const brightness = Math.random();
            if (brightness > 0.85) {
                ctx.fillStyle = '#52b788'; // Flash head glow points
            } else {
                ctx.fillStyle = 'rgba(45, 106, 79, ' + (brightness * 0.6).toFixed(2) + ')';
            }

            ctx.fillText(text, x, y);

            // Reset stream cycle condition
            if (y > canvas.height && Math.random() > 0.975) {
                rainDrops[i] = 0;
            }
            rainDrops[i]++;
        }
    }

    window.addEventListener('resize', () => {
        init();
    });

    init();
    setInterval(draw, 33); // Smooth target framerate limit execution loops ~30fps
})();