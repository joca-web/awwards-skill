// speaker.mjs: a smart-speaker pebble. Shows the Atelier split: soft macro shape from the field (smooth unions, real
// fillets), micro detail baked per texel (perforated fabric grille, brushed metal ring, soft-touch grain, paint wear).
export const meta = {
  name: 'speaker', texture: 1024, resolution: 150, bump: 1,
  bounds: [[-0.62, -0.02, -0.62], [0.62, 0.9, 0.62]],
  params: { body: '#25262b', ring: '#b9bcc2', led: '#5cf2c9' },
};

const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

export default function build({ sdf, params }) {
  const H = 0.82;
  // pebble: a squashed ellipsoid softly joined to a rounded base slab, cut flat at the bottom
  const pebble = sdf.ellipsoid([0.54, 0.43, 0.54], [0, 0.43, 0]);
  const base = sdf.cylinder(0.5, 0.05, [0, 0.07, 0], 0.04);
  let body = sdf.smoothUnion(0.12, pebble, base);
  body = sdf.smoothIntersect(0.03, body, sdf.plane([0, -1, 0], [0, 0, 0]));   // keep y >= 0: flat bottom with a soft edge
  // shallow groove between body and base (a shadow line)
  const groove = sdf.intersect(sdf.torus(0.5, 0.012, [0, 0.145, 0], 'y'), sdf.skin(body, 0.05));
  body = sdf.smoothSubtract(0.01, body, groove);
  // three raised top buttons (+ and - and play), mirrored
  const topY = (x) => 0.43 + 0.43 * Math.sqrt(1 - (x / 0.54) ** 2);
  const btn = (x, z) => sdf.ellipsoid([0.075, 0.026, 0.075], [x, topY(x) - 0.004, z]);
  body = sdf.smoothUnion(0.03, body, btn(0, 0), btn(-0.2, 0), btn(0.2, 0));

  const field = body;
  const c = { body: hex(params.body), ring: hex(params.ring), led: hex(params.led) };

  // texture-space detail helpers
  const hexGrid = (u, v, s) => { // 2D staggered dot grid distance (0 at a dot centre, ~1 between dots)
    const row = Math.round(v / (s * 0.866)); const off = row & 1 ? 0.5 : 0; const cu = (Math.round(u / s - off) + off) * s, cv = row * s * 0.866;
    return Math.hypot(u - cu, v - cv) / (s * 0.5);
  };
  const grain = (x, y, z, f) => sdf.fbm(x * f, y * f, z * f, 3);

  const materialAt = (ctx, out) => {
    const [x, y, z] = ctx.p, [nx, ny, nz] = ctx.n, r = Math.hypot(x, z);
    const onTop = ny > 0.55 && y > 0.5, onFront = Math.abs(Math.atan2(x, z)) < 1.15 && y > 0.2 && y < 0.7;
    // defaults: soft-touch charcoal plastic with fine orange-peel noise
    let col = c.body, rough = 0.62, metal = 0, h = (grain(x, y, z, 220) - 0.5) * 0.0016;
    const edgeWear = Math.max(0, ctx.curv - 0.9) * 0.05; // convex edges burnish a little
    if (y < 0.15) { // aluminium base ring, brushed around the axis
      col = c.ring; metal = 1; rough = 0.34 + grain(x * 40, 0, z * 40, 1) * 0.1; const a = Math.atan2(z, x);
      h = (sdf.noise3(a * 90, y * 3, r * 3) - 0.5) * 0.0012;
    } else if (onFront) { // perforated fabric grille on the front
      const au = Math.atan2(x, z) * 0.54, s = 0.034; const d = hexGrid(au, y, s);
      const edge = Math.min(1.15 - Math.abs(Math.atan2(x, z)), (y - 0.2) * 3, (0.7 - y) * 3);   // holes shrink away at the border
      const hole = (1 - sdf.clamp((d - 0.42 * sdf.clamp(edge / 0.18, 0, 1)) / 0.16, 0, 1)) * sdf.clamp(edge / 0.05, 0, 1);
      const weave = Math.sin(au * 520) * Math.sin(y * 520) * 0.0004;
      col = [c.body[0] * (1 - 0.55 * hole) * 1.25, c.body[1] * (1 - 0.55 * hole) * 1.25, c.body[2] * (1 - 0.55 * hole) * 1.25];
      rough = 0.92; h = -hole * 0.007 + weave;
    } else if (onTop) { // top plate with a thin LED ring around the buttons
      const ring = Math.abs(r - 0.3); if (ring < 0.007 && ny > 0.6) { col = c.led; rough = 0.25; h = -0.0012; }
    }
    // cavity dirt + edge wear painted from the field measurements
    const dirt = (1 - ctx.ao) * 0.25;
    out.c[0] = Math.min(1, col[0] * (1 - dirt) + edgeWear); out.c[1] = Math.min(1, col[1] * (1 - dirt) + edgeWear); out.c[2] = Math.min(1, col[2] * (1 - dirt) + edgeWear);
    out.r = Math.min(1, rough + dirt * 0.4 - edgeWear * 2); out.m = metal; out.h = h;
  };
  return { field, materialAt };
}
