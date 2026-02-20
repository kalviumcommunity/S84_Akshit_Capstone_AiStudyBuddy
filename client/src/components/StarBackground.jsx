import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import './StarBackground.css';

function StarBackground({ showMeteors = true }) {
  const { isDarkMode } = useTheme();
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Mouse tracking
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Create stars with depth layers
    const stars = [];
    const starCount = isDarkMode ? 800 : 800;

    for (let i = 0; i < starCount; i++) {
      const layer = i < 200 ? 'far' : i < 500 ? 'mid' : 'near';
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: layer === 'far' ? Math.random() * 1 + 0.5 : layer === 'mid' ? Math.random() * 2 + 1 : Math.random() * 3 + 1,
        opacity: layer === 'far' ? Math.random() * 0.3 + 0.2 : layer === 'mid' ? Math.random() * 0.5 + 0.3 : Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        velocityX: layer === 'far' ? (Math.random() - 0.5) * 0.05 : layer === 'mid' ? (Math.random() - 0.5) * 0.15 : (Math.random() - 0.5) * 0.25,
        velocityY: layer === 'far' ? (Math.random() - 0.5) * 0.05 : layer === 'mid' ? (Math.random() - 0.5) * 0.15 : (Math.random() - 0.5) * 0.25,
        layer,
      });
    }

    // Meteor system (only if showMeteors is true)
    let meteor = null;
    let meteorFragments = [];
    let blastWave = null;
    let lastMeteorTime = 0;
    const meteorInterval = 6000; // 6 seconds between meteors

    const spawnMeteor = () => {
      if (!showMeteors) return;
      if (meteor) return; // Only spawn if no meteor exists

      const navbarHeight = 80;
      const spawnSide = Math.random();
      let startX, startY, targetX, targetY;

      if (spawnSide < 0.33) {
        startX = -50;
        startY = Math.random() * (canvas.height - navbarHeight) + navbarHeight;
        targetX = canvas.width + 50;
        const minDiagonal = canvas.height * 0.3;
        const maxDiagonal = canvas.height * 0.7;
        const diagonalShift = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * (maxDiagonal - minDiagonal) + minDiagonal);
        targetY = Math.max(navbarHeight, Math.min(canvas.height, startY + diagonalShift));
      } else if (spawnSide < 0.66) {
        startX = canvas.width + 50;
        startY = Math.random() * (canvas.height - navbarHeight) + navbarHeight;
        targetX = -50;
        const minDiagonal = canvas.height * 0.3;
        const maxDiagonal = canvas.height * 0.7;
        const diagonalShift = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * (maxDiagonal - minDiagonal) + minDiagonal);
        targetY = Math.max(navbarHeight, Math.min(canvas.height, startY + diagonalShift));
      } else {
        startX = Math.random() * canvas.width;
        startY = navbarHeight - 50;
        const horizontalDistance = canvas.width * (0.5 + Math.random() * 0.5);
        targetX = Math.random() > 0.5 ? startX + horizontalDistance : startX - horizontalDistance;
        if (targetX > canvas.width) targetX = canvas.width + 50;
        if (targetX < 0) targetX = -50;
        targetY = canvas.height * (0.6 + Math.random() * 0.4);
      }

      meteor = {
        x: startX,
        y: startY,
        targetX,
        targetY,
        speed: Math.random() * 4 + 6, // Faster (was 3 + 4)
        size: Math.random() * 1.5 + 1, // Even smaller (was 2 + 1.5)
        life: 1,
        trail: [],
        curveOffset: (Math.random() - 0.5) * 60,
        curveFrequency: Math.random() * 0.002 + 0.001,
      };
    };

    const updateMeteor = (time) => {
      if (!meteor) return;

      const dx = meteor.targetX - meteor.x;
      const dy = meteor.targetY - meteor.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100 || meteor.life < 0.3) {
        createBurst(meteor.x, meteor.y);
        meteor = null;
        return;
      }

      const angle = Math.atan2(dy, dx);
      const curveInfluence = Math.sin(time * meteor.curveFrequency) * meteor.curveOffset;
      
      meteor.x += Math.cos(angle) * meteor.speed + Math.cos(angle + Math.PI / 2) * curveInfluence * 0.02;
      meteor.y += Math.sin(angle) * meteor.speed + Math.sin(angle + Math.PI / 2) * curveInfluence * 0.02;

      meteor.x += (Math.random() - 0.5) * 0.5;
      meteor.y += (Math.random() - 0.5) * 0.5;

      const mouseDistance = Math.sqrt(
        Math.pow(mouseRef.current.x - meteor.x, 2) + 
        Math.pow(mouseRef.current.y - meteor.y, 2)
      );
      if (mouseDistance < 200) {
        const bendStrength = (200 - mouseDistance) / 200;
        meteor.x += (mouseRef.current.x - meteor.x) * 0.01 * bendStrength;
        meteor.y += (mouseRef.current.y - meteor.y) * 0.01 * bendStrength;
      }

      meteor.trail.push({ x: meteor.x, y: meteor.y, alpha: 1 });
      if (meteor.trail.length > 60) meteor.trail.shift(); // Longer tail (was 30)

      if (distance < 200) {
        meteor.speed *= 0.95;
        meteor.life -= 0.02;
      }
    };

    const createBurst = (x, y) => {
      blastWave = {
        x,
        y,
        radius: 0,
        maxRadius: Math.max(canvas.width, canvas.height) * 1.5,
        opacity: 1,
        speed: 15,
      };

      const fragmentCount = 50;
      for (let i = 0; i < fragmentCount; i++) {
        const angle = (Math.PI * 2 * i) / fragmentCount + (Math.random() - 0.5) * 0.3;
        const speed = Math.random() * 6 + 3;
        meteorFragments.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          life: 1,
          decay: Math.random() * 0.012 + 0.008,
          hue: Math.random() * 30,
        });
      }
    };

    const updateFragments = () => {
      if (blastWave) {
        blastWave.radius += blastWave.speed;
        blastWave.speed *= 1.08;
        blastWave.opacity -= 0.015;
        
        if (blastWave.opacity <= 0 || blastWave.radius > blastWave.maxRadius) {
          blastWave = null;
        }
      }

      meteorFragments = meteorFragments.filter(fragment => {
        fragment.x += fragment.vx;
        fragment.y += fragment.vy;
        fragment.vx *= 0.98;
        fragment.vy *= 0.98;
        fragment.life -= fragment.decay;
        return fragment.life > 0;
      });
    };

    const drawMeteor = () => {
      if (!meteor) return;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const dx = meteor.targetX - meteor.x;
      const dy = meteor.targetY - meteor.y;
      const angle = Math.atan2(dy, dx);

      // Draw flame trail with advanced effects
      meteor.trail.forEach((point, index) => {
        const progress = index / meteor.trail.length;
        const alpha = progress * meteor.life * 0.8;
        const size = meteor.size * progress * 2;
        
        const turb1 = Math.sin(time * 0.003 + index * 0.5) * 2;
        const turb2 = Math.cos(time * 0.004 + index * 0.3) * 1.5;
        
        const perpX = Math.cos(angle + Math.PI / 2);
        const perpY = Math.sin(angle + Math.PI / 2);
        
        // Multi-layer flames
        for (let layer = 0; layer < 3; layer++) {
          const layerOffset = (layer - 1) * turb1 * 0.5;
          const layerX = point.x + perpX * layerOffset + turb2;
          const layerY = point.y + perpY * layerOffset;
          
          ctx.beginPath();
          const outerSize = size * (7 - layer);
          const grad = ctx.createRadialGradient(layerX, layerY, 0, layerX, layerY, outerSize);
          
          if (progress > 0.7) {
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
            grad.addColorStop(0.3, `rgba(255, 220, 120, ${alpha * 0.7})`);
            grad.addColorStop(0.6, `rgba(255, 150, 60, ${alpha * 0.5})`);
            grad.addColorStop(1, 'rgba(200, 60, 20, 0)');
          } else if (progress > 0.4) {
            grad.addColorStop(0, `rgba(255, 240, 180, ${alpha * 0.8})`);
            grad.addColorStop(0.4, `rgba(255, 180, 80, ${alpha * 0.6})`);
            grad.addColorStop(0.7, `rgba(255, 100, 30, ${alpha * 0.4})`);
            grad.addColorStop(1, 'rgba(180, 50, 20, 0)');
          } else {
            grad.addColorStop(0, `rgba(255, 180, 100, ${alpha * 0.6})`);
            grad.addColorStop(0.5, `rgba(220, 100, 40, ${alpha * 0.4})`);
            grad.addColorStop(1, 'rgba(150, 40, 15, 0)');
          }
          
          ctx.fillStyle = grad;
          ctx.arc(layerX, layerY, outerSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Flame licks
        if (index % 2 === 0 && progress > 0.3) {
          const lickAngle = angle + Math.PI / 2;
          const lickDist = Math.sin(time * 0.005 + index) * size * 3;
          const lickX = point.x + Math.cos(lickAngle) * lickDist;
          const lickY = point.y + Math.sin(lickAngle) * lickDist;
          
          ctx.beginPath();
          const lickGrad = ctx.createRadialGradient(lickX, lickY, 0, lickX, lickY, size * 4);
          lickGrad.addColorStop(0, `rgba(255, 220, 100, ${alpha * 0.6})`);
          lickGrad.addColorStop(0.5, `rgba(255, 150, 50, ${alpha * 0.4})`);
          lickGrad.addColorStop(1, 'rgba(200, 80, 30, 0)');
          ctx.fillStyle = lickGrad;
          ctx.arc(lickX, lickY, size * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Smoke particles
        if (index % 3 === 0 && progress < 0.5) {
          const smokeX = point.x + turb2 * 2;
          const smokeY = point.y;
          const smokeSize = size * 1.5;
          
          ctx.beginPath();
          const smokeGrad = ctx.createRadialGradient(smokeX, smokeY, 0, smokeX, smokeY, smokeSize);
          smokeGrad.addColorStop(0, `rgba(60, 30, 20, ${alpha * 0.4})`);
          smokeGrad.addColorStop(0.5, `rgba(40, 20, 15, ${alpha * 0.3})`);
          smokeGrad.addColorStop(1, 'rgba(20, 10, 5, 0)');
          ctx.fillStyle = smokeGrad;
          ctx.arc(smokeX, smokeY, smokeSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Sparks
        if (index % 4 === 0 && Math.random() > 0.7) {
          const sparkX = point.x + (Math.random() - 0.5) * size * 2;
          const sparkY = point.y + (Math.random() - 0.5) * size * 2;
          const sparkSize = Math.random() * size * 0.5 + 0.5;
          
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, ${200 + Math.random() * 55}, ${100 + Math.random() * 100}, ${alpha * 0.9})`;
          ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
          ctx.fill();
          
          const sparkGlow = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, sparkSize * 3);
          sparkGlow.addColorStop(0, `rgba(255, 240, 200, ${alpha * 0.6})`);
          sparkGlow.addColorStop(0.5, `rgba(255, 180, 100, ${alpha * 0.3})`);
          sparkGlow.addColorStop(1, 'rgba(255, 120, 50, 0)');
          ctx.fillStyle = sparkGlow;
          ctx.arc(sparkX, sparkY, sparkSize * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Meteor head with bloom
      const headSize = meteor.size * 6;
      
      // Atmospheric glow
      ctx.beginPath();
      const atmoGrad = ctx.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, headSize * 2);
      atmoGrad.addColorStop(0, `rgba(255, 255, 255, ${meteor.life * 0.3})`);
      atmoGrad.addColorStop(0.4, `rgba(255, 230, 180, ${meteor.life * 0.15})`);
      atmoGrad.addColorStop(1, 'rgba(255, 150, 100, 0)');
      ctx.fillStyle = atmoGrad;
      ctx.arc(meteor.x, meteor.y, headSize * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Bloom layers
      for (let bloom = 3; bloom > 0; bloom--) {
        ctx.beginPath();
        const bloomSize = headSize * (1 + bloom * 0.3);
        const bloomGrad = ctx.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, bloomSize);
        
        const bloomAlpha = meteor.life * (0.3 / bloom);
        bloomGrad.addColorStop(0, `rgba(255, 255, 255, ${bloomAlpha})`);
        bloomGrad.addColorStop(0.4, `rgba(255, 230, 160, ${bloomAlpha * 0.7})`);
        bloomGrad.addColorStop(0.7, `rgba(255, 180, 100, ${bloomAlpha * 0.4})`);
        bloomGrad.addColorStop(1, 'rgba(200, 60, 20, 0)');
        
        ctx.fillStyle = bloomGrad;
        ctx.arc(meteor.x, meteor.y, bloomSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // White-hot core
      ctx.beginPath();
      const coreGrad = ctx.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, headSize);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${meteor.life})`);
      coreGrad.addColorStop(0.2, `rgba(255, 250, 230, ${meteor.life * 0.9})`);
      coreGrad.addColorStop(0.5, `rgba(255, 220, 160, ${meteor.life * 0.7})`);
      coreGrad.addColorStop(0.8, `rgba(255, 150, 70, ${meteor.life * 0.4})`);
      coreGrad.addColorStop(1, 'rgba(255, 100, 40, 0)');
      ctx.fillStyle = coreGrad;
      ctx.arc(meteor.x, meteor.y, headSize, 0, Math.PI * 2);
      ctx.fill();
      
      // BLACK ROCK CORE with glowing lava cracks
      ctx.beginPath();
      const rockGrad = ctx.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, headSize * 0.7);
      rockGrad.addColorStop(0, `rgba(35, 25, 20, ${meteor.life * 0.9})`);
      rockGrad.addColorStop(0.6, `rgba(25, 18, 15, ${meteor.life * 0.95})`);
      rockGrad.addColorStop(1, `rgba(15, 10, 8, ${meteor.life * 0.85})`);
      ctx.fillStyle = rockGrad;
      ctx.arc(meteor.x, meteor.y, headSize * 0.7, 0, Math.PI * 2);
      ctx.fill();
      
      // GLOWING LAVA CRACKS - animated veins
      const crackCount = 10;
      for (let i = 0; i < crackCount; i++) {
        const crackAngle = (i / crackCount) * Math.PI * 2 + time * 0.0005;
        const crackPulse = Math.sin(time * 0.003 + i * 0.5) * 0.5 + 0.5;
        const crackLength = headSize * 0.5 * (0.6 + crackPulse * 0.4);
        
        const crackStartX = meteor.x + Math.cos(crackAngle) * headSize * 0.08;
        const crackStartY = meteor.y + Math.sin(crackAngle) * headSize * 0.08;
        const crackEndX = meteor.x + Math.cos(crackAngle) * crackLength;
        const crackEndY = meteor.y + Math.sin(crackAngle) * crackLength;
        
        // Glowing lava crack line
        ctx.beginPath();
        const crackGrad = ctx.createLinearGradient(crackStartX, crackStartY, crackEndX, crackEndY);
        crackGrad.addColorStop(0, `rgba(255, 255, 200, ${meteor.life * crackPulse * 0.9})`);
        crackGrad.addColorStop(0.3, `rgba(255, 180, 80, ${meteor.life * crackPulse * 0.8})`);
        crackGrad.addColorStop(0.6, `rgba(255, 100, 40, ${meteor.life * crackPulse * 0.6})`);
        crackGrad.addColorStop(0.85, `rgba(200, 50, 20, ${meteor.life * crackPulse * 0.3})`);
        crackGrad.addColorStop(1, 'rgba(100, 20, 10, 0)');
        
        ctx.strokeStyle = crackGrad;
        ctx.lineWidth = headSize * 0.06 * crackPulse;
        ctx.lineCap = 'round';
        ctx.moveTo(crackStartX, crackStartY);
        ctx.lineTo(crackEndX, crackEndY);
        ctx.stroke();
        
        // Lava glow at crack end
        ctx.beginPath();
        const crackGlowGrad = ctx.createRadialGradient(crackEndX, crackEndY, 0, crackEndX, crackEndY, headSize * 0.2);
        crackGlowGrad.addColorStop(0, `rgba(255, 200, 100, ${meteor.life * crackPulse * 0.7})`);
        crackGlowGrad.addColorStop(0.5, `rgba(255, 120, 50, ${meteor.life * crackPulse * 0.4})`);
        crackGlowGrad.addColorStop(1, 'rgba(200, 60, 20, 0)');
        ctx.fillStyle = crackGlowGrad;
        ctx.arc(crackEndX, crackEndY, headSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Lava bubbles popping out
        if (i % 3 === 0) {
          const bubbleX = meteor.x + Math.cos(crackAngle) * headSize * 0.35;
          const bubbleY = meteor.y + Math.sin(crackAngle) * headSize * 0.35;
          const bubbleSize = headSize * 0.12 * crackPulse;
          
          ctx.beginPath();
          const bubbleGrad = ctx.createRadialGradient(bubbleX, bubbleY, 0, bubbleX, bubbleY, bubbleSize);
          bubbleGrad.addColorStop(0, `rgba(255, 255, 220, ${meteor.life * crackPulse})`);
          bubbleGrad.addColorStop(0.4, `rgba(255, 200, 100, ${meteor.life * crackPulse * 0.8})`);
          bubbleGrad.addColorStop(0.7, `rgba(255, 120, 50, ${meteor.life * crackPulse * 0.5})`);
          bubbleGrad.addColorStop(1, 'rgba(200, 60, 20, 0)');
          ctx.fillStyle = bubbleGrad;
          ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Rocky surface texture (dark spots)
      for (let i = 0; i < 12; i++) {
        const rockAngle = (i / 12) * Math.PI * 2 + time * 0.0002;
        const rockDist = (Math.sin(time * 0.001 + i * 0.7) * 0.3 + 0.5) * headSize * 0.55;
        const rockX = meteor.x + Math.cos(rockAngle) * rockDist;
        const rockY = meteor.y + Math.sin(rockAngle) * rockDist;
        const rockSize = headSize * (0.08 + Math.random() * 0.08);
        
        ctx.beginPath();
        ctx.fillStyle = `rgba(8, 6, 4, ${meteor.life * 0.8})`;
        ctx.arc(rockX, rockY, rockSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    };

    const drawFragments = () => {
      // Draw blast wave (white in dark mode, orange in light mode)
      if (blastWave) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Multiple wave rings
        for (let i = 0; i < 3; i++) {
          const ringRadius = blastWave.radius - (i * 50);
          if (ringRadius > 0) {
            ctx.beginPath();
            const waveGrad = ctx.createRadialGradient(
              blastWave.x, blastWave.y, ringRadius * 0.8,
              blastWave.x, blastWave.y, ringRadius
            );
            
            const ringOpacity = blastWave.opacity * (1 - i * 0.3);
            
            if (isDarkMode) {
              // White blast wave for dark mode
              waveGrad.addColorStop(0, `rgba(255, 255, 255, 0)`);
              waveGrad.addColorStop(0.5, `rgba(255, 255, 255, ${ringOpacity * 0.4})`);
              waveGrad.addColorStop(0.8, `rgba(255, 240, 200, ${ringOpacity * 0.3})`);
              waveGrad.addColorStop(1, `rgba(255, 200, 150, 0)`);
            } else {
              // Orange blast wave for light mode
              waveGrad.addColorStop(0, `rgba(255, 180, 100, 0)`);
              waveGrad.addColorStop(0.5, `rgba(255, 150, 80, ${ringOpacity * 0.5})`);
              waveGrad.addColorStop(0.8, `rgba(255, 120, 50, ${ringOpacity * 0.4})`);
              waveGrad.addColorStop(1, `rgba(255, 100, 30, 0)`);
            }
            
            ctx.fillStyle = waveGrad;
            ctx.arc(blastWave.x, blastWave.y, ringRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // Bright flash at center
        ctx.beginPath();
        const flashGrad = ctx.createRadialGradient(
          blastWave.x, blastWave.y, 0,
          blastWave.x, blastWave.y, blastWave.radius * 0.3
        );
        
        if (isDarkMode) {
          // White flash for dark mode
          flashGrad.addColorStop(0, `rgba(255, 255, 255, ${blastWave.opacity * 0.8})`);
          flashGrad.addColorStop(0.4, `rgba(255, 255, 240, ${blastWave.opacity * 0.5})`);
          flashGrad.addColorStop(0.7, `rgba(255, 240, 200, ${blastWave.opacity * 0.2})`);
          flashGrad.addColorStop(1, 'rgba(255, 200, 150, 0)');
        } else {
          // Orange flash for light mode
          flashGrad.addColorStop(0, `rgba(255, 220, 150, ${blastWave.opacity * 0.9})`);
          flashGrad.addColorStop(0.4, `rgba(255, 180, 100, ${blastWave.opacity * 0.6})`);
          flashGrad.addColorStop(0.7, `rgba(255, 140, 70, ${blastWave.opacity * 0.3})`);
          flashGrad.addColorStop(1, 'rgba(255, 100, 40, 0)');
        }
        
        ctx.fillStyle = flashGrad;
        ctx.arc(blastWave.x, blastWave.y, blastWave.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }

      // Draw ember fragments
      meteorFragments.forEach(fragment => {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        ctx.beginPath();
        const grad = ctx.createRadialGradient(fragment.x, fragment.y, 0, fragment.x, fragment.y, fragment.size * 4);
        
        const orangeAmt = fragment.life;
        const redAmt = 1 - fragment.life;
        
        grad.addColorStop(0, `rgba(255, ${200 * orangeAmt + 100 * redAmt}, ${100 * orangeAmt}, ${fragment.life})`);
        grad.addColorStop(0.4, `rgba(255, ${120 * orangeAmt + 50 * redAmt}, ${50 * orangeAmt}, ${fragment.life * 0.7})`);
        grad.addColorStop(0.7, `rgba(${200 * orangeAmt + 150 * redAmt}, ${50 * orangeAmt + 20 * redAmt}, 20, ${fragment.life * 0.4})`);
        grad.addColorStop(1, 'rgba(100, 20, 10, 0)');
        
        ctx.fillStyle = grad;
        ctx.arc(fragment.x, fragment.y, fragment.size * 4, 0, Math.PI * 2);
        ctx.fill();

        fragment.size *= 0.98;
        
        ctx.restore();
      });
    };

    let animationId;
    let time = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 16;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw stars
      stars.forEach((star) => {
        star.x += star.velocityX;
        star.y += star.velocityY;

        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        const twinkle = Math.sin(time * 0.001 * star.twinkleSpeed + star.x) * 0.4 + 0.6;
        const color = isDarkMode 
          ? `rgba(255, 255, 255, ${star.opacity * twinkle})`
          : `rgba(50, 50, 80, ${star.opacity * twinkle * 0.8})`;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Meteor system (only if showMeteors is true)
      if (showMeteors) {
        if (time - lastMeteorTime > meteorInterval && !meteor) {
          spawnMeteor();
          lastMeteorTime = time;
        }

        updateMeteor(time);
        updateFragments();
        drawMeteor();
        drawFragments();
      }
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars.forEach((star) => {
        star.x = Math.random() * canvas.width;
        star.y = Math.random() * canvas.height;
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDarkMode, showMeteors]);

  return (
    <canvas
      ref={canvasRef}
      className="star-background"
    />
  );
}

export default StarBackground;
