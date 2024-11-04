struct VertexOut {
  @builtin(position) pos : vec4f,
  @location(0) color : vec4f
};

@fragment
fn fs(in : VertexOut) -> @location(0) vec4f {
  return in.color;
}
