/* =====================================================================
   LƯỚI DI CHUYỂN: ô nào đi được, độ cao mặt sàn, tìm đường A*
   Dùng cho sân thư viện (lưới tính sẵn từ file GLB) và từng tầng trong thư viện
   (lưới lấy mẫu từ hàm va chạm của mô hình).
   ===================================================================== */
(function () {
  'use strict';

  class Grid {
    /* x0,z0: góc lưới; cell: cạnh ô (m); walk: 1 = đi được; floor: độ cao mặt sàn (m) */
    constructor(x0, z0, cell, nx, nz, walk, floor) {
      Object.assign(this, { x0, z0, cell, nx, nz, walk, floor: floor || new Float32Array(nx * nz) });
    }
    static fromJSON(j) {
      const dec = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const walk = dec(j.walk), fb = dec(j.floor);
      const floor = new Float32Array(j.nx * j.nz), dv = new DataView(fb.buffer);
      for (let i = 0; i < floor.length; i++) floor[i] = dv.getInt16(i * 2, true) / 100;
      return new Grid(j.x0, j.z0, j.cell, j.nx, j.nz, walk, floor);
    }
    toJSON() {
      const enc = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); };
      const fb = new DataView(new ArrayBuffer(this.floor.length * 2));
      this.floor.forEach((v, i) => fb.setInt16(i * 2, Math.round(v * 100), true));
      return { x0: this.x0, z0: this.z0, cell: this.cell, nx: this.nx, nz: this.nz, walk: enc(this.walk), floor: enc(new Uint8Array(fb.buffer)) };
    }
    ci(x) { return Math.floor((x - this.x0) / this.cell); }
    cj(z) { return Math.floor((z - this.z0) / this.cell); }
    ok(i, j) { return i >= 0 && j >= 0 && i < this.nx && j < this.nz && this.walk[j * this.nx + i] === 1; }
    cx(i) { return this.x0 + (i + 0.5) * this.cell; }
    cz(j) { return this.z0 + (j + 0.5) * this.cell; }
    /* điểm (x,z) có đi được không — kiểm thêm 4 góc cách 0,22 m để nhân vật không cạ tường */
    free(x, z, r = 0.22) {
      return this.ok(this.ci(x), this.cj(z)) && this.ok(this.ci(x + r), this.cj(z)) && this.ok(this.ci(x - r), this.cj(z)) &&
        this.ok(this.ci(x), this.cj(z + r)) && this.ok(this.ci(x), this.cj(z - r));
    }
    floorAt(x, z) {
      const i = this.ci(x), j = this.cj(z);
      if (i < 0 || j < 0 || i >= this.nx || j >= this.nz) return 0;
      return this.floor[j * this.nx + i];
    }
    nearest(x, z, maxR = 12) {
      const i0 = this.ci(x), j0 = this.cj(z);
      if (this.ok(i0, j0)) return [i0, j0];
      for (let r = 1; r <= maxR / this.cell; r++)
        for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
          if (this.ok(i0 + di, j0 + dj)) return [i0 + di, j0 + dj];
        }
      return null;
    }
    /* ô nằm sát vật cản (một trong 4 ô kề không đi được) */
    edge(i, j) { return !this.ok(i + 1, j) || !this.ok(i - 1, j) || !this.ok(i, j + 1) || !this.ok(i, j - 1); }
    /* có đường thẳng đi được giữa hai ô không (để làm mượt đường) */
    line(i0, j0, i1, j1) {
      const n = Math.max(Math.abs(i1 - i0), Math.abs(j1 - j0)) * 2;
      let prev = this.floor[j0 * this.nx + i0];
      for (let k = 0; k <= n; k++) {
        const t = n ? k / n : 0, i = Math.round(i0 + (i1 - i0) * t), j = Math.round(j0 + (j1 - j0) * t);
        if (!this.ok(i, j) || this.edge(i, j)) return false;           // đường thẳng không đi sát mép vật cản
        const f = this.floor[j * this.nx + i];
        if (Math.abs(f - prev) > 0.45) return false; prev = f;
      }
      return true;
    }
    /* A* trên 8 hướng; trả mảng điểm [{x,z}] đã làm mượt, hoặc null */
    path(ax, az, bx, bz, maxNodes = 60000) {
      const s = this.nearest(ax, az, 3), g = this.nearest(bx, bz, 4);
      if (!s || !g) return null;
      const nx = this.nx, N = nx * this.nz, si = s[1] * nx + s[0], gi = g[1] * nx + g[0];
      const gs = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
      const heap = [], push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
      const hfun = i => Math.hypot(i % nx - g[0], ((i / nx) | 0) - g[1]);
      gs[si] = 0; push(hfun(si), si);
      const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
      let n = 0;
      while (heap.length && n++ < maxNodes) {
        const [, c] = pop();
        if (c === gi) break;
        if (closed[c]) continue; closed[c] = 1;
        const ci = c % nx, cj = (c / nx) | 0, fc = this.floor[c];
        for (const [di, dj, w] of D) {
          const i = ci + di, j = cj + dj;
          if (!this.ok(i, j)) continue;
          if (di && dj && (!this.ok(ci + di, cj) || !this.ok(ci, cj + dj))) continue;   // không cắt góc
          const k = j * nx + i;
          if (Math.abs(this.floor[k] - fc) > 0.45) continue;                            // bậc quá cao
          const ng = gs[c] + w + (this.edge(i, j) ? 0.8 : 0);               // tránh đi sát tường, ghế, bồn cây
          if (ng < gs[k]) { gs[k] = ng; from[k] = c; push(ng + hfun(k), k); }
        }
      }
      if (from[gi] < 0 && gi !== si) return null;
      const cells = []; for (let c = gi; c !== -1; c = from[c]) { cells.push(c); if (c === si) break; }
      cells.reverse();
      // làm mượt: bỏ các điểm giữa khi nhìn thẳng thấy nhau
      const pts = []; let a = 0;
      while (a < cells.length - 1) {
        let b = cells.length - 1;
        while (b > a + 1 && !this.line(cells[a] % nx, (cells[a] / nx) | 0, cells[b] % nx, (cells[b] / nx) | 0)) b--;
        pts.push(cells[b]); a = b;
      }
      const out = pts.map(c => ({ x: this.cx(c % nx), z: this.cz((c / nx) | 0) }));
      if (out.length) out[out.length - 1] = this.free(bx, bz) ? { x: bx, z: bz } : out[out.length - 1];
      return out;
    }
  }

  /* Lấy mẫu một lưới từ hàm "đi được không" (dùng cho các tầng trong thư viện) */
  Grid.sample = function (x0, z0, x1, z1, cell, isFree, floorY) {
    const nx = Math.ceil((x1 - x0) / cell), nz = Math.ceil((z1 - z0) / cell);
    const walk = new Uint8Array(nx * nz), floor = new Float32Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + (i + 0.5) * cell, z = z0 + (j + 0.5) * cell;
      walk[j * nx + i] = isFree(x, z) ? 1 : 0; floor[j * nx + i] = floorY || 0;
    }
    return new Grid(x0, z0, cell, nx, nz, walk, floor);
  };

  window.Grid = Grid;
})();
