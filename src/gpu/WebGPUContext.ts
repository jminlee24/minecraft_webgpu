class Context {
  public device!: GPUDevice;
  public presentationFormat!: GPUTextureFormat;
  public canvas!: HTMLCanvasElement;
  public context!: GPUCanvasContext;
  public windowWidth!: number;
  public windowHeight!: number;
  public aspect!: number;

  public async init(canvas?: HTMLCanvasElement) {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
      console.error("webgpu not supported on this browser");
      return;
    }
    this.device = device;
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    if (canvas) {
      this.canvas = canvas;
    } else {
      this.canvas = document.createElement("canvas");

      document.body.appendChild(this.canvas);
    }

    this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;
    this.context.configure({
      device: this.device,
      format: this.presentationFormat,
    });

    const resizeObserver = new ResizeObserver(() => {
      this.resize();
    });

    resizeObserver.observe(this.canvas);
    this.resize();
  }

  public resize() {
    const w = Math.floor(this.canvas.clientWidth);
    const h = Math.floor(this.canvas.clientHeight);

    if (w != this.windowWidth || h != this.windowHeight) {
      this.canvas.width = this.windowWidth = w;
      this.canvas.height = this.windowHeight = h;
      this.aspect = w / h;
    }
  }
}

const webgpuContext = new Context();

export default webgpuContext;
