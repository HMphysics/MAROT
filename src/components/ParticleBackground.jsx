import React, { useEffect, useRef } from 'react';

const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let stars = [];
    let nebulas = [];
    
    // Configuration for the cosmic effect
    const CONFIG = {
      starDensity: 11000, // Slightly more stars
      connectionDistance: 130, 
      nebulaCount: 5, // Increased from 3 to 5
      baseStarSpeed: 0.065, // Increased by ~30% (was 0.05)
    };

    const init = () => {
      // High DPI Support
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      createElements();
    };

    const createElements = () => {
      const area = window.innerWidth * window.innerHeight;
      const count = Math.floor(area / CONFIG.starDensity);
      
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push(new Star(window.innerWidth, window.innerHeight));
      }

      nebulas = [];
      for (let i = 0; i < CONFIG.nebulaCount; i++) {
        nebulas.push(new Nebula(window.innerWidth, window.innerHeight));
      }
    };

    class Nebula {
        constructor(w, h) {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.radius = Math.min(w, h) * (0.3 + Math.random() * 0.4); 
            this.color = this.getRandomColor();
            // Slow, organic drift
            this.vx = (Math.random() - 0.5) * 0.2; 
            this.vy = (Math.random() - 0.5) * 0.2;
            
            // Rotation properties
            this.angle = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.0008; // ~30-60s for full rotation if it were full circle
            
            // Pulse for subtle "breathing"
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.005 + Math.random() * 0.005;
        }

        getRandomColor() {
            // Enhanced cosmic palette: deep purples, blues, teals, soft pinks
            const colors = [
                { r: 25, g: 0, b: 70 },    // Deep Purple
                { r: 0, g: 25, b: 70 },    // Deep Blue
                { r: 0, g: 50, b: 60 },    // Deep Teal
                { r: 40, g: 0, b: 60 },    // Magenta/Purple
                { r: 10, g: 10, b: 40 }    // Dark Navy
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        update(w, h) {
            this.x += this.vx;
            this.y += this.vy;
            this.angle += this.rotationSpeed;
            this.pulsePhase += this.pulseSpeed;

            // Soft boundaries
            const margin = this.radius * 2;
            if (this.x < -margin) this.x = w + margin;
            if (this.x > w + margin) this.x = -margin;
            if (this.y < -margin) this.y = h + margin;
            if (this.y > h + margin) this.y = -margin;
        }

        draw() {
            // Scale context for rotation
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            
            // Breathing effect on radius
            const currentRadius = this.radius * (0.95 + Math.sin(this.pulsePhase) * 0.05);

            // Create elliptical gradient for more organic shape
            // We stretch it slightly to avoid perfect circles
            ctx.scale(1.2, 0.8); 

            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
            const { r, g, b } = this.color;
            
            // Adjusted opacity: 0.08 - 0.12 range max
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.12)`);
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.06)`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }

    class Star {
      constructor(w, h) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        
        const sizeRoll = Math.random();
        if (sizeRoll > 0.95) {
             this.size = 2.0; 
             this.twinkleSpeed = 0.04; // Faster twinkle
        } else if (sizeRoll > 0.7) {
             this.size = 1.2; 
             this.twinkleSpeed = 0.06;
        } else {
             this.size = 0.6; 
             this.twinkleSpeed = 0.02;
        }

        this.baseAlpha = 0.3 + Math.random() * 0.5;
        this.twinklePhase = Math.random() * Math.PI * 2;
        
        // Movement
        this.angle = Math.random() * Math.PI * 2;
        this.speed = (Math.random() * 0.5 + 0.5) * CONFIG.baseStarSpeed; // Minimum speed guaranteed
      }

      update(w, h) {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Wrap around
        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
        if (this.y < 0) this.y = h;
        if (this.y > h) this.y = 0;

        // Twinkle
        this.twinklePhase += this.twinkleSpeed;
      }

      draw() {
        // Range 0.3 to 1.0
        // Sin goes from -1 to 1. 
        // (Sin + 1) / 2 goes from 0 to 1.
        // We want 0.3 + (0.7 * normalized_sin)
        const normalizedSin = (Math.sin(this.twinklePhase) + 1) / 2;
        const currentAlpha = 0.2 + (normalizedSin * 0.8); // Min 0.2, Max 1.0
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        
        if (this.size > 1.0) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = `rgba(255, 255, 255, ${currentAlpha * 0.6})`;
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Draw Nebulas (Background)
      ctx.globalCompositeOperation = 'source-over'; // Standard blending
      nebulas.forEach(n => {
          n.update(width, height);
          n.draw();
      });

      // Update Stars
      stars.forEach(s => s.update(width, height));

      // Draw Connections
      drawConnections(stars);
      
      // Draw Stars (Foreground)
      stars.forEach(s => s.draw());
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const drawConnections = (stars) => {
      ctx.lineWidth = 0.4;
      ctx.lineCap = 'round';
      
      for (let i = 0; i < stars.length; i++) {
        const p1 = stars[i];
        
        if (p1.size < 0.8) continue; 

        for (let j = i + 1; j < stars.length; j++) {
          const p2 = stars[j];
          if (p2.size < 0.8) continue;

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          const maxDistSq = CONFIG.connectionDistance * CONFIG.connectionDistance;

          if (distSq < maxDistSq) {
             const dist = Math.sqrt(distSq);
             const opacity = 1 - (dist / CONFIG.connectionDistance);
             const smoothOpacity = opacity * opacity; 

             if (smoothOpacity > 0.05) {
               ctx.beginPath();
               ctx.strokeStyle = `rgba(255, 255, 255, ${smoothOpacity * 0.15})`; 
               ctx.moveTo(p1.x, p1.y);
               ctx.lineTo(p2.x, p2.y);
               ctx.stroke();
             }
          }
        }
      }
    };

    const handleResize = () => {
        init();
    };

    window.addEventListener('resize', handleResize);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 bg-black" 
      style={{ display: 'block' }}
    />
  );
};

export default ParticleBackground;