export class ShaderProgram {
  public vertexShader!: GPUShaderModule;
  public fragmentShader!: GPUShaderModule;
  private uniformValues: { [key: string]: Float32Array };

  constructor(private device: GPUDevice) {
    this.uniformValues = {};
  }
  public async init(vertexPath: string, fragPath: string) {
    this.vertexShader = this.device.createShaderModule({
      label: "Vertex Shader",
      code: (await import(vertexPath + "?raw")).default,
    });
    this.fragmentShader = this.device.createShaderModule({
      label: "Fragment Shader",
      code: (await import(fragPath + "?raw")).default,
    });
  }

  addUniformValue(name: string, value: Float32Array) {
    this.uniformValues[name] = value;
  }

  setUniformValue(name: string, value: Float32Array, offset: number = 0) {
    this.uniformValues[name].set(value, offset);
  }
}
