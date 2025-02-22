import Renderer from "./gpu/Renderer";
import webgpuContext from "./gpu/WebGPUContext";
import Cube from "./world/objects/Cube";
import Scene from "./Scene";

const canvas = document.getElementById("GLCanvas") as HTMLCanvasElement;
await webgpuContext.init(canvas);
canvas.width = 900;
canvas.height = 600;

const renderer = new Renderer();

const scene = new Scene();

const cube = new Cube(0, 0, 0);
scene.add(cube);

let start = 0;

const render = (time: number) => {
  if (start == 0) {
    start = time;
  }
  start = time;

  renderer.render(scene);
  requestAnimationFrame(render);
};

render(start);
