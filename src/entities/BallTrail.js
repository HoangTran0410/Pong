// BallTrail helper: stores recent positions and renders a retro square trail
class BallTrail {
  constructor() {
    this.points = [];
  }

  push(x, y, radius, maxLength) {
    this.points.push({ x, y, r: radius });
    if (this.points.length > maxLength) this.points.shift();
  }

  clear() {
    this.points = [];
  }

  render(ctx, color, opacity) {
    if (!this.points.length) return;
    ctx.save();
    ctx.fillStyle = color;
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const alpha = ((i + 1) / this.points.length) * opacity;
      ctx.globalAlpha = alpha;
      const size = Math.max(2, p.r * 2);
      const x = Math.round(p.x - size / 2);
      const y = Math.round(p.y - size / 2);
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();
  }
}

export default BallTrail;
