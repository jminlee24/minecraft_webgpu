struct OurStruct {
  color : vec4f,
  offset : vec3f,
};

struct VSOutput {
  @builtin(position) position : vec4f,
  @location(0) texCoord : vec2f,
  @location(1) color : vec4f
};

@group(0) @binding(0) var<uniform> ourStruct : OurStruct;
@group(0) @binding(1) var<uniform> scale : vec3f;

@vertex fn vs(
@location(0) position : vec3f,
@location(1) vertexColor : vec4f,
@builtin(instance_index) instanceIndex : u32
) -> VSOutput {

  var vsOut : VSOutput;
  vsOut.position = vec4f(position * scale + ourStruct.offset, 1.0);
  vsOut.texCoord = vec2f(position.x, 1.0 - position.y);
  vsOut.color = vertexColor * ourStruct.color;
  return vsOut;

}
