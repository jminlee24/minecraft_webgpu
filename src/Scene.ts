import { default as context } from "./gpu/WebGPUContext.ts";
export default class Scene {
  private device: GPUDevice = context.device;
  private contex: GPUCanvasContext = context.context;
  public objects = [];

  constructor() {}

  add() {}
}
