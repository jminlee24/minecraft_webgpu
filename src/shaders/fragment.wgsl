struct VSOutput {
  @builtin(position) position : vec4f,
  @location(0) texCoord : vec2f,
  @location(1) color : vec4f
};

@group(1) @binding(0) var ourSampler : sampler;
@group(1) @binding(1) var ourTexture : texture_2d<f32>;

@fragment
fn fs(vsOut : VSOutput) -> @location(0) vec4f {
  return mix(textureSample(ourTexture, ourSampler, vsOut.texCoord), vsOut.color, .5);
}
