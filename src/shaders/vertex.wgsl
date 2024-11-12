struct OurStruct {
  color : vec4f,
  offset : vec3f,
  scale : vec3f,
};

struct Vertex{
  position : vec3f
};

struct VSOutput {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
};

@group(0) @binding(0) var<uniform> ourStruct : OurStruct;
@group(0) @binding(1) var<uniform> scale : vec3f;
@group(0) @binding(2) var<storage, read> pos : array<Vertex>;

@vertex fn vs(
@builtin(vertex_index) vertexIndex : u32,
@builtin(instance_index) instanceIndex : u32
) -> VSOutput {

  var vsOut : VSOutput;
  vsOut.position = vec4f(pos[vertexIndex].position * scale + ourStruct.offset, 1.0);
  vsOut.color = vec4f(pos[vertexIndex].position, 1);
  return vsOut;

}
