import { ShaderProgram } from "./ShaderProgram";

function createTriangle() {
  const numVertices = 3;
  const vertexData = new Float32Array(4 * 4 * 3);
  const colorData = new Uint8Array(vertexData.buffer);
  vertexData.set(
    [
      0,
      1,
      0,
      1,
      -1.77 * Math.pow(10, 38),
      1,
      -1,
      0,
      1,
      2.34 * Math.pow(10, -38),
      -1,
      -1,
      0,
      0,
      9.1834 * Math.pow(10, -41),
    ],
    0
  );
  return { vertexData, numVertices, colorData };
}

export class Renderer {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private presentationFormat!: GPUTextureFormat;
  private shaderProgram!: ShaderProgram;
  private pipeline!: GPURenderPipeline;
  private renderPassDescriptor!: GPURenderPassDescriptor;
  private readonly objectList!: {
    bindgroup: GPUBindGroup;
    uniformValues: Float32Array;
    buffer: GPUBuffer;
  }[];

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.objectList = [];
  }

  public async init() {
    await this.getGPUDevice();
    this.configCanvas();
    await this.loadShaders();
    this.configurePipeline();
    this.configureUniforms();
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
      vertex: {
        module: this.shaderProgram.vertexShader,
        buffers: [
          {
            arrayStride: 4 * 4 + 4, // vec3f size 16 bytes
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" },
              { shaderLocation: 1, offset: 16, format: "unorm8x4" },
            ], // position
          },
        ],
      },
      fragment: {
        module: this.shaderProgram.fragmentShader,
        targets: [{ format: this.presentationFormat }],
      },
    });
  }

  private configureUniforms() {
    const uniformBufferSize = 4 * 4 + 3 * 4 + 4 + 16;
    const scaleBufferSize = 4 * 3 + 5;

    const uniformBuffer = this.device.createBuffer({
      label: " uniform buffer for stuff",
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const scaleBuffer = this.device.createBuffer({
      label: "scale buffer",
      size: scaleBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const uniformValues = new Float32Array(uniformBufferSize / 4);
    const scaleValues = new Float32Array(scaleBufferSize / 4);

    uniformValues.set([0, 1, 1, 1], 0);
    uniformValues.set([0, 0, 0], 4);

    this.device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

    const bindGroup = this.device.createBindGroup({
      label: "bind group for objects",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: scaleBuffer } },
      ],
    });

    this.objectList.push({
      bindgroup: bindGroup,
      uniformValues: scaleValues,
      buffer: scaleBuffer,
    });
  }

  private configureRenderPassDescriptor() {
    this.renderPassDescriptor = {
      label: "Render Pass Description",
      colorAttachments: [
        {
          clearValue: [0.15, 0.15, 0.15, 1.0],
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

    let { vertexData, numVertices } = createTriangle();

    const vertexBuffer = this.device.createBuffer({
      label: "vertex buffer vertices",
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    const encoder = this.device.createCommandEncoder({
      label: "render encoder",
    });

    const pass = encoder.beginRenderPass(this.renderPassDescriptor);
    pass.setPipeline(this.pipeline);
    pass.setVertexBuffer(0, vertexBuffer);

    const aspect = this.canvas.width / this.canvas.height;

    this.objectList[0].uniformValues.set([0.5 / aspect, 0.5, 1], 0);

    this.device.queue.writeBuffer(
      this.objectList[0].buffer,
      0,
      this.objectList[0].uniformValues
    );

    pass.setBindGroup(0, this.objectList[0].bindgroup);
    pass.draw(numVertices);
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
