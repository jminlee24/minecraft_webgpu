const shader_files = import.meta.glob("./shaders/*.wgsl", {
  query: "?raw",
  import: "default",
});

export class ShaderProgram {
  public vertexShader!: GPUShaderModule;
  public fragmentShader!: GPUShaderModule;
  private uniformValues: { [key: string]: Float32Array };

  constructor(private device: GPUDevice) {
    this.uniformValues = {};
  }
  public async init(vertexPath: string, fragmentPath: string) {
    const vstr = (await shader_files[vertexPath]()) as string;
    const fstr = (await shader_files[fragmentPath]()) as string;

    this.vertexShader = this.device.createShaderModule({
      label: "Vertex Shader",
      code: vstr,
    });
    this.fragmentShader = this.device.createShaderModule({
      label: "Fragment Shader",
      code: fstr,
    });
  }

  addUniformValue(name: string, value: Float32Array) {
    this.uniformValues[name] = value;
  }

  setUniformValue(name: string, value: Float32Array, offset: number = 0) {
    this.uniformValues[name].set(value, offset);
  }
}
