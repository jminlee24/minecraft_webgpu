import { ShaderProgram } from "./ShaderProgram";

function createTriangle() {
  const numVertices = 3;
  const vertexData = new Float32Array(4 * 4 * 3);
  vertexData.set([0, 1, 0, 1, 1, -1, 0, 1, -1, -1, 0], 0);
  return { vertexData, numVertices };
}

function createCircleVertices({
  radius = 2,
  numSubdivisions = 48,
  innerRadius = 0.25,
  startAngle = Math.PI / 2,
  endAngle = (Math.PI * 5) / 2,
} = {}) {
  // 2 triangles per subdivision, 3 verts per tri, 2 values (xy) each.
  const numVertices = numSubdivisions * 3 * 2;
  const vertexData = new Float32Array(numSubdivisions * 2 * 3 * 2);

  let offset = 0;
  const addVertex = (x, y) => {
    vertexData[offset++] = x;
    vertexData[offset++] = y;
  };

  // 2 triangles per subdivision
  //
  // 0--1 4
  // | / /|
  // |/ / |
  // 2 3--5
  for (let i = 0; i < numSubdivisions; ++i) {
    const angle1 =
      startAngle + ((i + 0) * (endAngle - startAngle)) / numSubdivisions;
    const angle2 =
      startAngle + ((i + 1) * (endAngle - startAngle)) / numSubdivisions;

    const c1 = Math.cos(angle1);
    const s1 = Math.sin(angle1);
    const c2 = Math.cos(angle2);
    const s2 = Math.sin(angle2);

    // first triangle
    addVertex(c1 * radius, s1 * radius);
    addVertex(c2 * radius, s2 * radius);
    addVertex(c1 * innerRadius, s1 * innerRadius);

    // second triangle
    addVertex(c1 * innerRadius, s1 * innerRadius);
    addVertex(c2 * radius, s2 * radius);
    addVertex(c2 * innerRadius, s2 * innerRadius);
  }

  return {
    vertexData,
    numVertices,
  };
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
    numVertices: number;
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
      vertex: { module: this.shaderProgram.vertexShader },
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

    let { vertexData, numVertices } = createTriangle();

    const vertexStorageBuffer = this.device.createBuffer({
      label: "storage buffer vertices",
      size: vertexData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(vertexStorageBuffer, 0, vertexData);

    const bindGroup = this.device.createBindGroup({
      label: "bind group for objects",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: scaleBuffer } },
        { binding: 2, resource: { buffer: vertexStorageBuffer } },
      ],
    });

    this.objectList.push({
      bindgroup: bindGroup,
      uniformValues: scaleValues,
      buffer: scaleBuffer,
      numVertices: numVertices,
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

    const encoder = this.device.createCommandEncoder({
      label: "render encoder",
    });

    const pass = encoder.beginRenderPass(this.renderPassDescriptor);
    pass.setPipeline(this.pipeline);

    const aspect = this.canvas.width / this.canvas.height;

    this.objectList[0].uniformValues.set([0.5 / aspect, 0.5, 1], 0);

    this.device.queue.writeBuffer(
      this.objectList[0].buffer,
      0,
      this.objectList[0].uniformValues
    );

    pass.setBindGroup(0, this.objectList[0].bindgroup);
    pass.draw(this.objectList[0].numVertices, 100);
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
