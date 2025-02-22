import vert from "../../shaders/vertex.wgsl?raw";
import frag from "../../shaders/fragment.wgsl?raw";
import { default as context } from "../../gpu/WebGPUContext.ts";

export default class Cube {
  private device: GPUDevice = context.device;
  private context: GPUCanvasContext = context.context;

  pipeline!: GPURenderPipeline;
  position: Float32Array;
  scale: Float32Array;

  // prettier-ignore
  vertices: Float32Array = new Float32Array([
    -1, -1, -1,
     1, -1, -1, 
     1,  1, -1, 
    -1,  1, -1, 
    -1, -1,  1, 
     1, -1,  1, 
     1,  1,  1, 
    -1,  1,  1
  ]);
  // prettier-ignore
  indices: Int32Array = new Int32Array([     
    0, 1, 3, 3, 1, 2,
    1, 5, 2, 2, 5, 6,
    5, 4, 6, 6, 4, 7,
    4, 0, 7, 7, 0, 3,
    3, 2, 7, 7, 2, 6,
    4, 5, 0, 0, 5, 1
  ]);

  constructor(
    x: number,
    y: number,
    z: number,
    scale: [number, number, number] = [1, 1, 1],
  ) {
    if (scale.length !== 3) {
      console.error("scale of cube must have length 3: (x, y, z)");
    }
    this.position = new Float32Array([x, y, z]);
    this.scale = new Float32Array(scale);
  }

  init(pass: GPURenderPassEncoder) {
    const presentationFormat = this.context.getConfiguration()?.format;
    if (presentationFormat == null) {
      console.error("presentationFormat not found");
      return;
    }
    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: this.device.createShaderModule({
          code: vert,
        }),
        buffers: [
          {
            arrayStride: 4 * 3,
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
          },
        ],
      },
      fragment: {
        module: this.device.createShaderModule({
          code: frag,
        }),
        targets: [{ format: presentationFormat }],
      },
    });

    const vertexBuffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    const indexBuffer = this.device.createBuffer({
      size: this.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(vertexBuffer, 0, this.vertices);
    this.device.queue.writeBuffer(indexBuffer, 0, this.indices);

    pass.setPipeline(this.pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer, "uint32");
  }

  draw(pass: GPURenderPassEncoder) {
    pass.drawIndexed(this.indices.length);
  }
}
