"use client";
import { useEffect, useRef, useState } from "react";
import { atmospheres, type IrisValue } from "./atmospheres";
const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=position;gl_Position=vec4(position,0.,1.);}`;
// Each rib refracts one shared light field. No video or perpetual render loop.
const fragment = `precision highp float;
varying vec2 uv; uniform vec2 light; uniform float intensity;
uniform vec3 colorA; uniform vec3 colorB; uniform vec3 colorC;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 p=uv; p.y*=1.045; float r=length(p);
  float inside=smoothstep(.312,.32,r)*(1.-smoothstep(.853,.861,r));
  if(inside<.001){gl_FragColor=vec4(0.);return;}
  float a=atan(p.y,p.x); float section=(r-.586)/.269;
  float z=sqrt(max(0.,1.-section*section)); float fold=a*116.+r*18.;
  float rib=sin(fold); float ridge=pow(.5+.5*cos(fold),5.);
  vec2 radial=normalize(p); vec2 tangent=vec2(-radial.y,radial.x);
  vec3 n=normalize(vec3(radial*section+tangent*rib*.38,z*.87));
  vec3 l=normalize(vec3(light.x*.7-.4,light.y*.6+.75,1.5));
  vec3 reflected=reflect(vec3(0.,0.,-1.),n);
  float sweep=dot(reflected.xy,normalize(vec2(.65,.85)+light*.3));
  vec3 metal=mix(colorA,colorB,smoothstep(-.65,.7,sweep));
  metal=mix(metal,colorC,smoothstep(.0,.8,-reflected.y)*.67);
  float window=pow(max(0.,1.-abs(reflected.x*.72+reflected.y*.62-.17+light.x*.17)),18.);
  float darkBand=pow(max(0.,1.-abs(reflected.x*.7-reflected.y*.5+.18)),7.);
  float diffuse=max(dot(n,l),0.);
  float spec=pow(max(dot(reflect(-l,n),vec3(0.,0.,1.)),0.),55.);
  float fresnel=pow(1.-max(n.z,0.),2.7);
  vec3 col=metal*(.38+diffuse*.68); col*=1.-darkBand*.75;
  col+=vec3(.92,.94,1.)*window*.82; col+=vec3(1.,.95,.87)*spec*.85;
  col+=mix(colorA,vec3(.94),.6)*fresnel*.38; col+=ridge*.065;
  col+=vec3(.82,.85,.96)*(exp(-abs(r-.850)*650.)*.7+exp(-abs(r-.324)*420.)*.42);
  col*=.51+intensity*.62; col+=vec3((hash(gl_FragCoord.xy)-.5)*.012);
  gl_FragColor=vec4(pow(max(col,vec3(0.)),vec3(.88)),inside);
}`;
export function IrisLens({ value }: { value: IrisValue }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    host = useRef<HTMLDivElement>(null);
  const target = useRef(value),
    requestRender = useRef<() => void>(() => {});
  const [available, setAvailable] = useState(false);
  const [generation, setGeneration] = useState(0);
  target.current = value;
  useEffect(() => {
    requestRender.current();
  }, [value]);
  useEffect(() => {
    const element = canvas.current,
      surface = host.current;
    if (!element || !surface) return;
    const gl = element.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      shaders.push(s);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw Error("Optical shader failed");
      return s;
    };
    const program = gl.createProgram()!;
    try {
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw Error("Optical program failed");
    } catch {
      shaders.forEach((s) => gl.deleteShader(s));
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uniforms = Object.fromEntries(
      ["light", "intensity", "colorA", "colorB", "colorC"].map((k) => [
        k,
        gl.getUniformLocation(program, k),
      ]),
    );
    const initial = atmospheres.find(
      (a) => a.id === target.current.atmosphere,
    )!;
    const current = {
      x: -0.12,
      y: 0.1,
      intensity: target.current.intensity / 100,
      colors: initial.colors.map((c) => [...c] as number[]),
    };
    const pointer = { x: -0.12, y: 0.1 };
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      visible = true,
      disposed = false,
      contextLost = false,
      previousTime = 0;
    const draw = (time: number) => {
      frame = 0;
      if (disposed || contextLost || !visible || document.hidden) return;
      const dt = Math.min((time - previousTime) / 1000 || 0.016, 0.05);
      previousTime = time;
      const blend = motion.matches ? 1 : 1 - Math.exp(-dt * 7.5);
      const theme = atmospheres.find(
        (a) => a.id === target.current.atmosphere,
      )!;
      let delta = 0;
      const approach = (a: number, b: number) => {
        delta += Math.abs(a - b);
        return a + (b - a) * blend;
      };
      current.x = approach(current.x, pointer.x);
      current.y = approach(current.y, pointer.y);
      current.intensity = approach(
        current.intensity,
        target.current.intensity / 100,
      );
      current.colors = current.colors.map((c, i) =>
        c.map((v, j) => approach(v, theme.colors[i][j])),
      );
      gl.uniform2f(uniforms.light, current.x, current.y);
      gl.uniform1f(uniforms.intensity, current.intensity);
      ["colorA", "colorB", "colorC"].forEach((k, i) =>
        gl.uniform3fv(uniforms[k], current.colors[i]),
      );
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (delta > 0.002 && !motion.matches) frame = requestAnimationFrame(draw);
    };
    const schedule = () => {
      if (!frame && visible && !disposed && !contextLost && !document.hidden)
        frame = requestAnimationFrame(draw);
    };
    requestRender.current = schedule;
    const resize = () => {
      const size = Math.round(
        surface.clientWidth * Math.min(devicePixelRatio, 1.75),
      );
      element.width = size;
      element.height = size;
      gl.viewport(0, 0, size, size);
      schedule();
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || motion.matches) return;
      const b = surface.getBoundingClientRect();
      pointer.x = ((e.clientX - b.left) / b.width) * 2 - 1;
      pointer.y = 1 - ((e.clientY - b.top) / b.height) * 2;
      schedule();
    };
    const leave = () => {
      pointer.x = -0.12;
      pointer.y = 0.1;
      schedule();
    };
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    };
    const lost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frame);
      frame = 0;
      setAvailable(false);
    };
    const restored = () => setGeneration((v) => v + 1);
    const observer = new ResizeObserver(resize),
      intersection = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) schedule();
        else {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      });
    observer.observe(surface);
    intersection.observe(surface);
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", schedule);
    element.addEventListener("webglcontextlost", lost);
    element.addEventListener("webglcontextrestored", restored);
    resize();
    setAvailable(true);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      requestRender.current = () => {};
      observer.disconnect();
      intersection.disconnect();
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", schedule);
      element.removeEventListener("webglcontextlost", lost);
      element.removeEventListener("webglcontextrestored", restored);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      shaders.forEach((s) => gl.deleteShader(s));
    };
  }, [generation]);
  return (
    <div className="iris-lens" ref={host} aria-hidden="true">
      <div className="lens-shadow" />
      {!available && <div className="lens-fallback" />}
      <canvas ref={canvas} className={available ? "is-ready" : ""} />
    </div>
  );
}
