// public/js/animated-background.js

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('pulse-background');
    if (!canvas) {
        console.error('Pulse Background: Canvas element not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    // --- CONFIGURATION ---
    const config = {
        mainLine: {
            color: 'rgba(117, 45, 199, 0.6)', // var(--primary-color) with opacity
            width: 2,
            amplitude: 100, // How high/low the waves are
            frequency: 0.005, // How close the waves are
            speed: 0.0001, // How fast the waves move
        },
        secondaryLine: {
            color: 'rgba(255, 195, 0, 0.4)', // var(--accent-color) with opacity
            width: 1,
            amplitude: 50,
            frequency: 0.01,
            speed: 0.0003,
        },
        pings: {
            maxCount: 10,
            chance: 0.01, // 1% chance to spawn a ping each frame
            radius: 3,
            life: 100, // Frames
            colors: ['rgba(85, 239, 196, 0.8)', 'rgba(255, 118, 117, 0.8)'] // Glow Green, Glow Red
        }
    };

    let pings = [];
    let time = 0;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function drawLine(lineConfig) {
        ctx.beginPath();
        ctx.lineWidth = lineConfig.width;
        ctx.strokeStyle = lineConfig.color;

        const yOffset = canvas.height / 2;
        const speedFactor = time * lineConfig.speed * 1000;

        for (let x = 0; x < canvas.width; x++) {
            const y = yOffset + Math.sin((x * lineConfig.frequency) + speedFactor) * lineConfig.amplitude * Math.sin(speedFactor * 0.1);
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    function updatePings() {
        // Spawn new pings
        if (pings.length < config.pings.maxCount && Math.random() < config.pings.chance) {
            pings.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                life: config.pings.life,
                maxLife: config.pings.life,
                color: config.pings.colors[Math.floor(Math.random() * 2)]
            });
        }

        // Update and draw existing pings
        for (let i = pings.length - 1; i >= 0; i--) {
            const ping = pings[i];
            ping.life--;

            if (ping.life <= 0) {
                pings.splice(i, 1);
                continue;
            }
            
            ctx.beginPath();
            const opacity = ping.life / ping.maxLife;
            ctx.fillStyle = ping.color.replace('0.8', opacity.toFixed(2));
            ctx.shadowColor = ping.color;
            ctx.shadowBlur = 10;
            ctx.arc(ping.x, ping.y, config.pings.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow
        }
    }


    function animate() {
        time = Date.now();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawLine(config.mainLine);
        drawLine(config.secondaryLine);
        updatePings();
        
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resizeCanvas);
    
    // Initial setup and launch
    resizeCanvas();
    animate();
});