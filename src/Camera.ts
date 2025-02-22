import { Mat4, Vec3, mat4, vec3 } from "wgpu-matrix";

export default class Camera {
  matrix: Mat4 = mat4.create();
  right: Vec3;
  up: Vec3;
  forward: Vec3;
  position: Vec3;

  perspective: Mat4;
  camera: Mat4;
  view: Mat4;

  constructor(
    fov: number,
    aspect: number,
    near: number = 0.01,
    far: number = 1000,
  ) {
    this.position = vec3.create(0, 0, 0);
    this.forward = vec3.normalize(vec3.create(-1, 0, 0));
    this.right = vec3.create(1, 0, 0);
    this.up = vec3.create(0, 1, 0);

    this.perspective = mat4.perspective(fov, aspect, near, far);
    this.camera = mat4.lookAt(this.position, this.forward, this.up);
    this.view = mat4.inverse(this.camera);
  }

  update() {}
}
