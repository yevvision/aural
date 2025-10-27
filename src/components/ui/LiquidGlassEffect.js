import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '../../utils';
export const LiquidGlassEffect = ({ children, className = '', intensity = 0.0, // Deaktiviert für statischen Look
chromaticDispersion = 0.015, // Verstärkte chromatische Dispersion für bessere Brechung
mouseTracking = false, // Deaktiviert für statischen Look
borderRadius = 16, backgroundBlur = 30 // Stärkerer Blur für besseren Glaseffekt
 }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const [isHovered, setIsHovered] = useState(false);
    const animationRef = useRef(undefined);
    // Vertex shader source
    const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    
    uniform mat3 u_matrix;
    uniform vec2 u_mousePos;
    uniform float u_time;
    
    varying vec2 v_texCoord;
    varying vec2 v_mousePos;
    varying float v_time;
    
    void main() {
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
      v_texCoord = a_texCoord;
      v_mousePos = u_mousePos;
      v_time = u_time;
    }
  `;
    // Fragment shader source - erweiterte Unicorn Studio Liquid Glass mit allen Effekten
    const fragmentShaderSource = `
    precision highp float;
    
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform vec2 u_mousePos;
    uniform float u_time;
    uniform float u_intensity;
    uniform float u_chromaticDispersion;
    uniform float u_borderRadius;
    uniform float u_backgroundBlur;
    
    varying vec2 v_texCoord;
    varying vec2 v_mousePos;
    varying float v_time;
    
    const float PI = 3.14159265359;
    
    // Circle SDF function
    float sdCircle(vec2 p, float r) {
      return length(p) - r;
    }
    
    // Smooth step function
    float smoothstep(float edge0, float edge1, float x) {
      float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
      return t * t * (3.0 - 2.0 * t);
    }
    
    // Rotation matrix
    mat2 rot(float a) {
      return mat2(cos(a), -sin(a), sin(a), cos(a));
    }
    
    // Blend functions from Unicorn Studio
    vec3 blend(int blendMode, vec3 src, vec3 dst) {
      if (blendMode == 1) return src + dst; // Add
      if (blendMode == 3) return src * dst; // Multiply
      return src;
    }
    
    // Get distance field for the glass shape - exakt wie in Unicorn Studio
    float getDistance(vec2 uv) {
      return sdCircle(uv, 0.4);
    }
    
    // Get distance with mouse interaction - exakt wie in Unicorn Studio
    float getDist(vec2 uv) {
      float sd = getDistance(uv);
      
      vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
      vec2 mousePos = (u_mousePos * aspect);
      float mouseDistance = length(v_texCoord * aspect - mousePos);
      float falloff = smoothstep(0.0, 0.8, mouseDistance);
      
      float asd = 2.0;
      asd = -asd;
      float md = mix(0.02 / falloff, 0.1 / falloff, -asd * sd);
      md = md * 1.5 * 0.0000;
      md = min(-md, 0.0);
      sd -= md;
      
      return sd;
    }
    
    // Refraction function - verstärkt für besseren Glaseffekt
    vec4 refrakt(float sd, vec2 st, vec4 bg) {
      vec2 offset = mix(vec2(0), normalize(st) / sd, length(st));
      vec4 r = vec4(0, 0, 0, 1);
      
      // Verstärkte chromatische Dispersion für bessere Brechung
      float rdisp = mix(0.02, 0.015, 0.5000);
      float gdisp = mix(0.02, 0.02, 0.5000);
      float bdisp = mix(0.02, 0.025, 0.5000);
      
      // Verstärkte Brechung basierend auf Distanz
      float refractionStrength = 1.0 + (1.0 - smoothstep(0.0, 0.4, -sd)) * 3.0;
      
      vec2 uv = (v_texCoord - 0.5) / mix(1., 4., 0.0000) + 0.5;
      r.r = texture2D(u_texture, uv + offset * refractionStrength * rdisp).r;
      r.g = texture2D(u_texture, uv + offset * refractionStrength * gdisp).g;
      r.b = texture2D(u_texture, uv + offset * refractionStrength * bdisp).b;
      
      float opacity = ceil(-sd);
      float smoothness = 0.0025;
      opacity = smoothstep(0., smoothness, -sd);
      
      vec4 background = bg;
      return mix(background, r + vec4(vec3(0.7176470588235294, 0.7176470588235294, 0.7176470588235294) / (-sd * 50.), 1.) * 0.0000, opacity);
    }
    
    // Get effect - exakt wie in Unicorn Studio
    vec4 getEffect(vec2 st, vec4 bg) {
      float eps = 0.0005;
      float sd = getDist(st);
      float sd1 = getDist(st + vec2(eps, 0.0));
      float sd2 = getDist(st - vec2(eps, 0.0));
      float sd3 = getDist(st + vec2(0.0, eps));
      float sd4 = getDist(st - vec2(0.0, eps));
      
      vec4 r = refrakt(sd, st, bg);
      vec4 r1 = refrakt(sd1, st + vec2(eps, 0.0), bg);
      vec4 r2 = refrakt(sd2, st - vec2(eps, 0.0), bg);
      vec4 r3 = refrakt(sd3, st + vec2(0.0, eps), bg);
      vec4 r4 = refrakt(sd4, st - vec2(0.0, eps), bg);
      
      r = (r + r1 + r2 + r3 + r4) * 0.2;
      return r;
    }
    
    // Circle effect 1 - exakt wie in Unicorn Studio
    vec4 circleEffect1(vec2 uv, vec4 color) {
      float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      float displacement = (luma - 0.5) * 0.0000 * 0.5;
      vec2 aspectRatio = vec2(u_resolution.x / u_resolution.y, 1.0);
      vec2 skew = vec2(0.5000, 1.0 - 0.5000);
      float halfRadius = 0.2480 * 0.5;
      float innerEdge = halfRadius - 1.0000 * halfRadius * 0.5;
      float outerEdge = halfRadius + 1.0000 * halfRadius * 0.5;
      vec2 pos = vec2(0.5, 0.28200000000000003);
      pos += (u_mousePos - 0.5) * 1.0000;
      const float TWO_PI = 6.28318530718;
      vec2 scaledUV = uv * aspectRatio * rot(0.0054 * TWO_PI) * skew;
      vec2 scaledPos = pos * aspectRatio * rot(0.0054 * TWO_PI) * skew;
      float radius = distance(scaledUV, scaledPos);
      float falloff = smoothstep(innerEdge + displacement, outerEdge + displacement, radius);
      falloff = 1.0 - falloff;
      vec3 finalColor;
      vec3 blended = blend(3, vec3(0, 0, 0), color.rgb);
      finalColor = mix(color.rgb, blended, falloff * 0.2000);
      color.rgb = finalColor;
      color.a = mix(1.0 - falloff, 1.0, 1.0000);
      return color;
    }
    
    // Circle effect 2 - exakt wie in Unicorn Studio
    vec4 circleEffect2(vec2 uv, vec4 color) {
      float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      float displacement = (luma - 0.5) * 0.0000 * 0.5;
      vec2 aspectRatio = vec2(u_resolution.x / u_resolution.y, 1.0);
      vec2 skew = vec2(0.5000, 1.0 - 0.5000);
      float halfRadius = 0.2080 * 0.5;
      float innerEdge = halfRadius - 1.0000 * halfRadius * 0.5;
      float outerEdge = halfRadius + 1.0000 * halfRadius * 0.5;
      vec2 pos = vec2(0.5, 0.37);
      pos += (u_mousePos - 0.5) * 1.0000;
      const float TWO_PI = 6.28318530718;
      vec2 scaledUV = uv * aspectRatio * rot(-0.0054 * TWO_PI) * skew;
      vec2 scaledPos = pos * aspectRatio * rot(-0.0054 * TWO_PI) * skew;
      float radius = distance(scaledUV, scaledPos);
      float falloff = smoothstep(innerEdge + displacement, outerEdge + displacement, radius);
      falloff = 1.0 - falloff;
      vec3 finalColor;
      vec3 blended = blend(1, vec3(0.8156862745098039, 0.8156862745098039, 0.8156862745098039), color.rgb);
      finalColor = mix(color.rgb, blended, falloff * 0.3500);
      color.rgb = finalColor;
      color.a = mix(1.0 - falloff, 1.0, 1.0000);
      return color;
    }
    
    // Verstärkte Hintergrund-Brechung an den Kanten
    vec4 applyEdgeRefraction(vec2 uv, vec4 bg) {
      vec2 center = vec2(0.5, 0.5);
      float distance = length(uv - center);
      
      // Verstärke Brechung an den Kanten
      float edgeFactor = smoothstep(0.3, 0.5, distance);
      vec2 refractionOffset = (uv - center) * edgeFactor * 0.15;
      
      // Chromatische Dispersion an den Kanten
      vec4 refractedColor;
      refractedColor.r = texture2D(u_texture, uv + refractionOffset * 1.2).r;
      refractedColor.g = texture2D(u_texture, uv + refractionOffset * 1.0).g;
      refractedColor.b = texture2D(u_texture, uv + refractionOffset * 0.8).b;
      refractedColor.a = 1.0;
      
      return mix(bg, refractedColor, edgeFactor * 0.8);
    }
    
    void main() {
      vec2 uv = v_texCoord;
      vec4 bg = texture2D(u_texture, uv);
      
      // Wende Kanten-Brechung auf den Hintergrund an
      bg = applyEdgeRefraction(uv, bg);
      
      vec4 color = vec4(1);
      
      vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
      vec2 mousePos = mix(vec2(0), u_mousePos - 0.5, 1.0000);
      vec2 st = uv - (vec2(0.5, 0.5) + mousePos);
      st *= aspect;
      st *= 1. / (0.4920 + 0.2);
      st *= rot(-0.0027 * 2.0 * PI);
      
      color = getEffect(st, bg);
      
      // Apply circle effects
      color = circleEffect1(uv, color);
      color = circleEffect2(uv, color);
      
      // Apply mask
      vec2 maskPos = mix(vec2(0), (u_mousePos - 0.5), 0.0000);
      vec4 maskColor = texture2D(u_texture, v_texCoord - maskPos);
      color = color * (maskColor.a * maskColor.a);
      
      gl_FragColor = color;
    }
  `;
    // Create shader
    const createShader = (gl, type, source) => {
        const shader = gl.createShader(type);
        if (!shader)
            return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };
    // Create program
    const createProgram = (gl, vertexShader, fragmentShader) => {
        const program = gl.createProgram();
        if (!program)
            return null;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    };
    // Initialize WebGL
    const initWebGL = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container)
            return;
        const gl = canvas.getContext('webgl');
        if (!gl) {
            console.error('WebGL not supported');
            return;
        }
        // Create shaders
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!vertexShader || !fragmentShader)
            return;
        // Create program
        const program = createProgram(gl, vertexShader, fragmentShader);
        if (!program)
            return;
        // Get attribute and uniform locations
        const positionLocation = gl.getAttribLocation(program, 'a_position');
        const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
        const matrixLocation = gl.getUniformLocation(program, 'u_matrix');
        const mousePosLocation = gl.getUniformLocation(program, 'u_mousePos');
        const timeLocation = gl.getUniformLocation(program, 'u_time');
        const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
        const intensityLocation = gl.getUniformLocation(program, 'u_intensity');
        const chromaticDispersionLocation = gl.getUniformLocation(program, 'u_chromaticDispersion');
        const borderRadiusLocation = gl.getUniformLocation(program, 'u_borderRadius');
        const backgroundBlurLocation = gl.getUniformLocation(program, 'u_backgroundBlur');
        // Create geometry (full screen quad)
        const positions = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]);
        const texCoords = new Float32Array([
            0, 1,
            1, 1,
            0, 0,
            1, 0,
        ]);
        // Create buffers
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        // Create texture for background
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // Render function
        const render = (time) => {
            const rect = container.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            canvas.width = width * devicePixelRatio;
            canvas.height = height * devicePixelRatio;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            gl.viewport(0, 0, canvas.width, canvas.height);
            // Create matrix for orthographic projection
            const matrix = [
                2 / width, 0, 0,
                0, -2 / height, 0,
                -1, 1, 1
            ];
            gl.useProgram(program);
            // Set up attributes
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
            gl.enableVertexAttribArray(texCoordLocation);
            gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
            // Set uniforms
            gl.uniformMatrix3fv(matrixLocation, false, matrix);
            gl.uniform2f(mousePosLocation, mousePos.x, mousePos.y);
            gl.uniform1f(timeLocation, time * 0.001);
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.uniform1f(intensityLocation, intensity);
            gl.uniform1f(chromaticDispersionLocation, chromaticDispersion);
            gl.uniform1f(borderRadiusLocation, borderRadius);
            gl.uniform1f(backgroundBlurLocation, backgroundBlur);
            // Draw
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            animationRef.current = requestAnimationFrame(render);
        };
        // Start animation
        animationRef.current = requestAnimationFrame(render);
        // Cleanup
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteProgram(program);
            gl.deleteBuffer(positionBuffer);
            gl.deleteBuffer(texCoordBuffer);
            gl.deleteTexture(texture);
        };
    }, [mousePos, intensity, chromaticDispersion, borderRadius, backgroundBlur]);
    // Handle mouse movement
    const handleMouseMove = useCallback((e) => {
        if (!containerRef.current || !mouseTracking)
            return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePos({ x, y });
    }, [mouseTracking]);
    // Handle mouse enter/leave
    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);
    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        setMousePos({ x: 0.5, y: 0.5 });
    }, []);
    // Initialize WebGL on mount
    useEffect(() => {
        const cleanup = initWebGL();
        return cleanup;
    }, [initWebGL]);
    // Add mouse event listeners
    useEffect(() => {
        const container = containerRef.current;
        if (!container)
            return;
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseenter', handleMouseEnter);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [handleMouseMove, handleMouseEnter, handleMouseLeave]);
    return (_jsxs("div", { ref: containerRef, className: cn('relative overflow-hidden', 'transition-all duration-300', className), style: {
            borderRadius: `${borderRadius}px`,
            backdropFilter: `blur(${backgroundBlur}px)`,
            WebkitBackdropFilter: `blur(${backgroundBlur}px)`,
        }, children: [_jsx("canvas", { ref: canvasRef, className: "absolute inset-0 w-full h-full pointer-events-none", style: {
                    borderRadius: `${borderRadius}px`,
                } }), _jsx("div", { className: "relative z-10", children: children }), _jsx("div", { className: "absolute inset-0 pointer-events-none", style: {
                    borderRadius: `${borderRadius}px`,
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 16px rgba(0,0,0,0.1)',
                } })] }));
};
