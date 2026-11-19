// creature.mjs: a designer-toy style character. Organic forms from smooth unions, one side modelled and mirrored,
// colour regions painted per texel from position (belly, cheeks, ears, eyes), vinyl-toy roughness, cavity darkening from field AO.
export const meta = {
  name: 'creature', texture: 1024, resolution: 150, bump: 1,
  bounds: [[-0.78, -0.02, -0.95], [0.78, 1.72, 0.75]],
  params: { fur: '#e8884a', belly: '#f6e3c8', cheek: '#f0788c', ink: '#1b1620' },
};
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

export default function build({ sdf, params }) {
  const body = sdf.ellipsoid([0.42, 0.45, 0.38], [0, 0.5, 0]);
  const head = sdf.ellipsoid([0.5, 0.42, 0.44], [0, 1.0, 0.03]);
  const neck = sdf.smoothUnion(0.18, body, head);
  const ear = sdf.rotate(sdf.roundCone([0, 0, 0], [0, 0.42, 0], 0.16, 0.05), [0, 0, -22], [0, 0, 0]);
  const ears = sdf.mirrorX(sdf.translate(ear, [0.3, 1.22, -0.02]));
  const arm = sdf.mirrorX(sdf.roundCone([0.36, 0.62, 0.06], [0.56, 0.4, 0.14], 0.11, 0.085));
  const foot = sdf.mirrorX(sdf.ellipsoid([0.15, 0.09, 0.22], [0.2, 0.08, 0.1]));
  const tail = sdf.roundCone([0, 0.3, -0.34], [0, 0.55, -0.66], 0.1, 0.17);
  let f = sdf.smoothUnion(0.07, neck, ears, arm, foot, tail);
  const eyeSocket = sdf.mirrorX(sdf.sphere(0.075, [0.18, 1.04, 0.42]));
  const muzzle = sdf.smoothUnion(0.05, sdf.ellipsoid([0.15, 0.1, 0.12], [0, 0.9, 0.42]));
  f = sdf.smoothUnion(0.06, f, muzzle);
  f = sdf.smoothSubtract(0.03, f, eyeSocket);
  const eyes = sdf.mirrorX(sdf.sphere(0.07, [0.18, 1.04, 0.405]));
  const field = sdf.union(f, eyes);
  const c = { fur: hex(params.fur), belly: hex(params.belly), cheek: hex(params.cheek), ink: hex(params.ink) };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const materialAt = (ctx, out) => {
    const [x, y, z] = ctx.p; const ax = Math.abs(x);
    let col = c.fur, rough = 0.5, h = (sdf.fbm(x * 90, y * 90, z * 90, 3) - 0.5) * 0.0025;
    const belly = sdf.clamp(1 - Math.hypot(x / 0.3, (y - 0.5) / 0.34, (z - 0.3) / 0.2), 0, 1); col = mix(col, c.belly, sdf.clamp(belly * 4, 0, 1));
    const cheek = sdf.clamp(1 - Math.hypot((ax - 0.33) / 0.1, (y - 0.93) / 0.07, (z - 0.34) / 0.2), 0, 1); col = mix(col, c.cheek, sdf.clamp(cheek * 3, 0, 1));
    const earIn = sdf.clamp(1 - Math.hypot((ax - 0.36) / 0.09, (y - 1.38) / 0.17, (z - 0.12) / 0.1), 0, 1); if (y > 1.2) col = mix(col, c.cheek, sdf.clamp(earIn * 3, 0, 1));
    const eye = Math.hypot(ax - 0.18, y - 1.04, z - 0.405) < 0.0725; if (eye) { col = c.ink; rough = 0.08; h = 0; }
    const nose = Math.hypot(x / 0.05, (y - 0.93) / 0.035, (z - 0.52) / 0.04) < 1; if (nose) { col = c.ink; rough = 0.2; }
    const mouth = Math.abs(ax - 0.05 * Math.sqrt(Math.max(0, 1 - ((y - 0.88) / 0.04) ** 2))) < 0.004 && y < 0.9 && y > 0.84 && z > 0.45; if (mouth) col = c.ink;
    const dirt = (1 - ctx.ao) * 0.3; out.c[0] = col[0] * (1 - dirt); out.c[1] = col[1] * (1 - dirt); out.c[2] = col[2] * (1 - dirt);
    out.r = rough; out.m = 0; out.h = h;
  };
  return { field, materialAt };
}
