import { default as context } from "./gpu/WebGPUContext.ts";
import Cube from "./world/objects/Cube.ts";
export default class Scene {
  private device: GPUDevice = context.device;
  private context: GPUCanvasContext = context.context;
  public objects: Cube[] = [];

  constructor() {}

  add(cube: Cube) {
    this.objects.push(cube);
  }
}
