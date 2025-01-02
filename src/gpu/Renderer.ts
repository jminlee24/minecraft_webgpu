import { default as context } from "./WebGPUContext";

export default class Renderer {
  device: GPUDevice = context.device;
  canvas: HTMLCanvasElement = context.canvas;
  ctx: GPUCanvasContext = context.context;

  private renderPassDescriptor: GPURenderPassDescriptor;

  constructor() {
    this.renderPassDescriptor = {
      colorAttachments: [
        {
          view: this.ctx.getCurrentTexture().createView(),
          clearValue: [0.3, 0.3, 0.3, 1],
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };
  }

  render() {
    (
      this.renderPassDescriptor
        .colorAttachments as GPURenderPassColorAttachment[]
    )[0].view = this.ctx.getCurrentTexture().createView();

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass(this.renderPassDescriptor);

    // draw all the stuff

    pass.end();

    const commandBuffer = encoder.finish();
    this.device.queue.submit([commandBuffer]);
  }
}
