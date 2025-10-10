import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const UnicornBackgroundPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas not found');
      return;
    }

    console.log('Initializing Unicorn Background...');

    // Canvas-Größe setzen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log('Canvas resized to:', canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // WebGL Context erstellen
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported, using 2D fallback');
      // 2D Fallback
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      let time = 0;
      let mousePos = { x: 0.5, y: 0.5 };
      
      const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mousePos.x = e.clientX / rect.width;
        mousePos.y = e.clientY / rect.height;
      };
      
      canvas.addEventListener('mousemove', handleMouseMove);
      
      function draw2D() {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const mouseX = mousePos.x * canvas.width;
        const mouseY = mousePos.y * canvas.height;
        
        // Einfacher Beam-Effekt
        const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 200);
        gradient.addColorStop(0, 'rgba(255, 100, 50, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 150, 80, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        time++;
        requestAnimationFrame(draw2D);
      }
      
      draw2D();
      
      return () => {
        canvas.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', resizeCanvas);
      };
    }

    console.log('WebGL context created');

    // EXAKTE Unicorn Studio Shader (WebGL 1.0 kompatibel)
    const vertexShaderSource = `
      precision mediump float;
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_uv = a_position * 0.5 + 0.5;
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      varying vec2 v_uv;
      uniform vec2 u_mouse;
      uniform vec2 u_resolution;
      uniform float u_time;
      
      const float PI = 3.14159265359;
      const float TWO_PI = 2.0 * PI;
      
      // Einfache Noise-Funktion
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      
      // Rotation Matrix
      mat2 rot(float a) {
        return mat2(cos(a), -sin(a), sin(a), cos(a));
      }
      
      // Tonemap Funktion
      vec3 tonemap(vec3 x) {
        x = clamp(x, -10.0, 10.0);
        return (exp(x) - exp(-x)) / (exp(x) + exp(-x));
      }
      
      // Beam-Effekt (vereinfacht aber sichtbar)
      vec3 getBeam(vec2 uv, vec2 mouse) {
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2 centeredUv = (uv - 0.5) * aspect;
        vec2 centeredMouse = (mouse - 0.5) * aspect;
        
        // Skew und Rotation (wie im Original)
        vec2 skew = vec2(0.5, 1.0 - 0.5) * 2.0;
        centeredUv = centeredUv * rot(0.0135 * PI * 2.0) * skew;
        centeredMouse = centeredMouse * rot(0.0135 * PI * 2.0) * skew;
        
        float dist = distance(centeredUv, centeredMouse);
        float radius = 0.842 * 0.25; // uRadius = 0.842
        float brightness = radius / (dist + 0.01);
        brightness = mix(brightness, brightness * brightness, 0.5);
        
        return brightness * vec3(0.392, 0.392, 0.392);
      }
      
      // Gradient-Farben (aus Ihrem Original)
      vec3 getGradientColor(float t) {
        t = clamp(t, 0.0, 1.0);
        
        // Ihre exakten Farben
        vec3 color1 = vec3(0.0, 0.0, 0.0);           // Schwarz
        vec3 color2 = vec3(0.0, 0.0, 0.0);           // Schwarz  
        vec3 color3 = vec3(0.96, 0.0, 0.196);        // Rot
        vec3 color4 = vec3(1.0, 0.537, 0.302);       // Orange
        vec3 color5 = vec3(1.0, 0.537, 0.302);       // Orange
        
        // Stops: 0.0, 0.25, 0.5, 0.75, 1.0
        if (t <= 0.25) {
          float mixFactor = t / 0.25;
          return mix(color1, color2, mixFactor);
        } else if (t <= 0.5) {
          float mixFactor = (t - 0.25) / 0.25;
          return mix(color2, color3, mixFactor);
        } else if (t <= 0.75) {
          float mixFactor = (t - 0.5) / 0.25;
          return mix(color3, color4, mixFactor);
        } else {
          float mixFactor = (t - 0.75) / 0.25;
          return mix(color4, color5, mixFactor);
        }
      }
      
      void main() {
        vec2 uv = v_uv;
        vec2 mouse = u_mouse;
        
        // Schwarzer Hintergrund
        vec3 bg = vec3(0.0, 0.0, 0.0);
        
        // Beam-Effekt
        vec3 beam = getBeam(uv, mouse);
        beam = tonemap(beam);
        
        // Dithering
        float dither = (random(gl_FragCoord.xy) - 0.5) / 255.0;
        beam += dither;
        
        // GradientMap Animation
        float luma = dot(beam, vec3(0.299, 0.587, 0.114));
        float position = smoothstep(0.0, 1.0, luma) * 0.9; // 0.45 * 2.0
        float posOffset = 0.2 + 0.0001;
        position -= (u_time * 0.01 + posOffset);
        
        float cycle = floor(position);
        bool reverse = mod(cycle, 2.0) < 1.0;
        float animatedPos = reverse ? fract(-position) : fract(position);
        animatedPos = clamp(animatedPos, 0.0, 1.0);
        
        vec3 gradientColor = getGradientColor(animatedPos);
        float dither2 = random(gl_FragCoord.xy) * 0.005;
        gradientColor += dither2;
        
        // Finale Mischung
        vec3 result = mix(bg, beam, 1.0);
        result = mix(result, gradientColor, 1.0);
        
        // Einfacher Test - falls alles schwarz ist, zeige wenigstens etwas
        if (length(result) < 0.01) {
          result = vec3(0.1, 0.0, 0.0); // Schwaches Rot als Test
        }
        
        gl_FragColor = vec4(result, 1.0);
      }
    `;

    // Shader erstellen
    function createShader(type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      console.error('Failed to create shaders');
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return;
    }

    gl.useProgram(program);

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const mouseUniformLocation = gl.getUniformLocation(program, 'u_mouse');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    let animationFrameId: number;
    let startTime = performance.now();
    let mousePos = { x: 0.5, y: 0.5 };

    const render = (currentTime: DOMHighResTimeStamp) => {
      const time = (currentTime - startTime) / 1000; // Time in seconds

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(mouseUniformLocation, mousePos.x, mousePos.y);
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform1f(timeUniformLocation, time);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameId = requestAnimationFrame(render);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mousePos = {
        x: event.clientX / canvas.width,
        y: 1.0 - event.clientY / canvas.height, // Invert Y for WebGL
      };
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial resize
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-0">
      <canvas ref={canvasRef} className="w-full h-full block"></canvas>
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 bg-white text-black px-4 py-2 rounded-md z-10"
      >
        Zurück
      </button>
    </div>
  );
};

export default UnicornBackgroundPage;
