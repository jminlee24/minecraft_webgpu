import Renderer from "./gpu/Renderer";
import webgpuContext from "./gpu/WebGPUContext";

const canvas = document.getElementById("GLCanvas") as HTMLCanvasElement;
await webgpuContext.init(canvas);

const renderer = new Renderer();

let start = 0;

const render = (time: number) => {
  if (start == 0) {
    start = time;
  }
  const _deltaTime = time - start;
  start = time;

  renderer.render();
  requestAnimationFrame(render);
};

render(start);
