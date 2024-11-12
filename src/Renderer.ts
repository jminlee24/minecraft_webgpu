import { ShaderProgram } from "./ShaderProgram";

export class Renderer {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private presentationFormat!: GPUTextureFormat;
  private shaderProgram!: ShaderProgram;
  private pipeline!: GPURenderPipeline;
  private renderPassDescriptor!: GPURenderPassDescriptor;

  constructor(private canvas: HTMLCanvasElement) {}

  public async init() {
    await this.getGPUDevice();
    this.configCanvas();
    await this.loadShaders();
    this.configurePipeline();
    this.configureRenderPassDescriptor();
    this.render();
    this.observeResize();
  }

  private async getGPUDevice() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
      this.fail("Browser does not support WebGPU");
      return;
    }
    this.device = device;
  }

  private configCanvas() {
    const context = this.canvas.getContext("webgpu");
    if (!context) {
      this.fail("Failed to get canvas context");
      return;
    }
    this.context = context;

    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device: this.device, format: this.presentationFormat });
  }

  private async loadShaders() {
    this.shaderProgram = new ShaderProgram(this.device);
    await this.shaderProgram.init(
      "./shaders/vertex.wgsl",
      "./shaders/fragment.wgsl"
    );
  }

  private configurePipeline() {
    this.pipeline = this.device.createRenderPipeline({
      label: "Render Pipeline",
      layout: "auto",
      vertex: { module: this.shaderProgram.vertexShader },
      fragment: {
        module: this.shaderProgram.fragmentShader,
        targets: [{ format: this.presentationFormat }],
      },
    });
  }

  private configureRenderPassDescriptor() {
    this.renderPassDescriptor = {
      label: "Render Pass Description",
      colorAttachments: [
        {
          clearValue: [0.1, 0.1, 0.1, 1.0],
          loadOp: "clear",
          storeOp: "store",
          view: this.context.getCurrentTexture().createView(),
        },
      ],
    };
  }

  public render() {
    (this.renderPassDescriptor.colorAttachments as any)[0].view = this.context
      .getCurrentTexture()
      .createView();

    const encoder = this.device.createCommandEncoder({
      label: "render encoder",
    });

    const pass = encoder.beginRenderPass(this.renderPassDescriptor);
    pass.setPipeline(this.pipeline);
    pass.draw(6);
    pass.end();

    this.device.queue.submit([encoder.finish()]);
  }

  private observeResize() {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const canvas = entry.target as HTMLCanvasElement;
        const width = entry.contentBoxSize[0].inlineSize;
        const height = entry.contentBoxSize[0].blockSize;
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        this.render();
      }
    });
    observer.observe(this.canvas);
  }

  private fail(msg: string) {
    document.body.innerHTML = `<H1>${msg}</H1>`;
  }
}
