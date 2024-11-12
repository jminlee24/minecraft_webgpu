struct VSOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
};

@fragment
fn fs(vsOut : VSOutput) -> @location(0) vec4f {
  return vsOut.color;
}
