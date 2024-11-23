import { ShaderProgram } from "./ShaderProgram";

function createTriangle() {
  const vertexData = new Float32Array(4 * 4 * 4);
  const colorData = new Uint8Array(vertexData.buffer);
  vertexData.set(
    [
      0,
      1,
      0,
      1,
      -1.77 * Math.pow(10, 38),
      1,
      0,
      0,
      1,
      2.34 * Math.pow(10, -38),
      0,
      0,
      0,
      0,
      9.1834 * Math.pow(10, -41),
      1,
      1,
      0,
      1,
      -1.77 * Math.pow(10, 38),
    ],
    0
  );
  colorData.set([255, 0, 0, 255], 16);
  colorData.set([0, 255, 0, 255], 36);
  colorData.set([0, 0, 255, 255], 56);
  colorData.set([122, 122, 122, 255], 76);

  const indexData = new Uint32Array(6);
  const numVertices = indexData.length;
  indexData.set([0, 3, 2, 2, 1, 3]);
  return { vertexData, numVertices, indexData };
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
  private readonly texture!: {
    bindgroup: GPUBindGroup | undefined;
  };

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.objectList = [];
    this.texture = { bindgroup: undefined };
  }

  public async init() {
    await this.getGPUDevice();
    this.configCanvas();
    await this.loadShaders();
    this.configurePipeline();
    await this.loadTextures();
    this.configureUniforms();
    this.configureRenderPassDescriptor();
    this.observeResize();
    requestAnimationFrame(this.render);
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

  private async loadTextures() {
    const kTextureWidth = 5;
    const kTextureHeight = 7;
    const _ = [255, 0, 0, 255]; // red
    const y = [255, 255, 0, 255]; // yellow
    const b = [0, 0, 255, 255]; // blue
    const textureData = new Uint8Array(
      [
        b,
        _,
        _,
        _,
        _,
        _,
        y,
        y,
        y,
        _,
        _,
        y,
        _,
        _,
        _,
        _,
        y,
        y,
        _,
        _,
        _,
        y,
        _,
        _,
        _,
        _,
        y,
        _,
        _,
        _,
        _,
        _,
        _,
        _,
        _,
      ].flat()
    );

    const texture = this.device.createTexture({
      size: [kTextureWidth, kTextureHeight],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    this.device.queue.writeTexture(
      { texture },
      textureData,
      {
        bytesPerRow: kTextureWidth * 4,
      },
      { width: kTextureWidth, height: kTextureHeight }
    );

    const sampler = this.device.createSampler({
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
      magFilter: "nearest",
      minFilter: "linear",
    });
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(1),
      entries: [
        { binding: 0, resource: sampler },
        { binding: 1, resource: texture.createView() },
      ],
    });

    this.texture.bindgroup = bindGroup;
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

    uniformValues.set([1, 1, 1, 1], 0);
    uniformValues.set([0.5, -0.4, 0], 4);

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

  //arrow function to retain ownership when you call the request animation frame stuff
  public render = (time: number) => {
    time *= 0.001;

    (this.renderPassDescriptor.colorAttachments as any)[0].view = this.context
      .getCurrentTexture()
      .createView();
    let { vertexData, numVertices, indexData } = createTriangle();

    const vertexBuffer = this.device.createBuffer({
      label: "vertex buffer vertices",
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    const indexBuffer = this.device.createBuffer({
      label: "index buffer vertices",
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(indexBuffer, 0, indexData);

    const encoder = this.device.createCommandEncoder({
      label: "render encoder",
    });

    const pass = encoder.beginRenderPass(this.renderPassDescriptor);
    pass.setPipeline(this.pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer, "uint32");

    const aspect = this.canvas.width / this.canvas.height;

    this.objectList[0].uniformValues.set([0.75 / aspect, 0.75, 1], 0);

    this.device.queue.writeBuffer(
      this.objectList[0].buffer,
      0,
      this.objectList[0].uniformValues
    );

    pass.setBindGroup(0, this.objectList[0].bindgroup);
    pass.setBindGroup(1, this.texture.bindgroup!);
    pass.drawIndexed(numVertices);
    pass.end();

    this.device.queue.submit([encoder.finish()]);
    requestAnimationFrame(this.render);
  };

  private observeResize() {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const canvas = entry.target as HTMLCanvasElement;
        const width = entry.contentBoxSize[0].inlineSize;
        const height = entry.contentBoxSize[0].blockSize;
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
      }
      console.log("helo");
    });
    observer.observe(this.canvas);
  }

  private fail(msg: string) {
    document.body.innerHTML = `<H1>${msg}</H1>`;
  }
}
