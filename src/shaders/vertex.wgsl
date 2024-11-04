struct VertexOut {
  @builtin(position) pos : vec4f,
  @location(0) color : vec4f
};


@vertex
fn vs(@builtin(vertex_index) vertexIndex : u32) -> VertexOut{
  let pos = array(
  vec2f(0, 0.8),
  vec2f(-0.8, -0.8),
  vec2f(0.8, -0.8),
  );

  let color = array(
  vec4f(1.0, .0, .0, 1.0),
  vec4f(0.0, 1.0, .0, 1.0),
  vec4f(0.0, .0, 1.0, 1.0),
  );

  var out : VertexOut;
  out.pos = vec4f(pos[vertexIndex], 0.0, 1.0);
  out.color = color[vertexIndex];

  return out;
}
