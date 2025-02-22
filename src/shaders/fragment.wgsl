struct VSOutput {
  @builtin(position) position : vec4f,
  @location(0) texCoord : vec2f,
};

@fragment
fn fs(vsOut : VSOutput) -> @location(0) vec4f {
  return vec4f(vsOut.texCoord, 0.0, 1.0);
}
