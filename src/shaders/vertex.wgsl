struct Uniforms {
  matrix: mat4x4f,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VSOutput {
  @builtin(position) position : vec4f,
  @location(0) texCoord : vec2f,
};

@vertex fn vs(
  @location(0) position : vec3f,
  @builtin(instance_index) instanceIndex : u32
) -> VSOutput {

  var vsOut : VSOutput;
  vsOut.position = vec4f(position + vec3f(0.5, 0.5, -0.5), 1.0);
  vsOut.texCoord = vec2f(position.x / 2 + 1, position.y / 2 + 1);
  return vsOut;

}
