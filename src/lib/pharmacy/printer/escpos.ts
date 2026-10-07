// ESC/POS command builder for thermal receipt printers
// Reference: Epson ESC/POS Command Reference
// Supports: Bluetooth, USB-Serial, Network (:9100)
// Item 12 — Tshastho Pharmacy

const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

export class EscPosBuilder {
  private chunks: Uint8Array[] = [];

  private push(...bytes: number[]): this {
    this.chunks.push(new Uint8Array(bytes));
    return this;
  }

  private pushBytes(b: Uint8Array): this {
    this.chunks.push(b);
    return this;
  }

  // ===== Init / control =====
  init(): this { return this.push(ESC, 0x40); }

  newline(count = 1): this {
    for (let i = 0; i < count; i++) this.push(LF);
    return this;
  }

  feed(lines = 1): this { return this.newline(lines); }

  cut(partial = true): this {
    // GS V m — m=0 full, m=1 partial
    return this.push(GS, 0x56, partial ? 0x01 : 0x00);
  }

  // ===== Alignment =====
  alignLeft():   this { return this.push(ESC, 0x61, 0x00); }
  alignCenter(): this { return this.push(ESC, 0x61, 0x01); }
  alignRight():  this { return this.push(ESC, 0x61, 0x02); }

  // ===== Style =====
  bold(on = true):      this { return this.push(ESC, 0x45, on ? 1 : 0); }
  underline(on = true): this { return this.push(ESC, 0x2d, on ? 1 : 0); }
  invert(on = false):   this { return this.push(GS,  0x42, on ? 1 : 0); }

  /** GS ! n — char width/height multiplier (1-8x each) */
  charSize(width = 1, height = 1): this {
    const w = Math.min(8, Math.max(1, width)) - 1;
    const h = Math.min(8, Math.max(1, height)) - 1;
    return this.push(GS, 0x21, ((w << 4) | h) & 0xff);
  }
  resetCharSize(): this { return this.charSize(1, 1); }

  // ===== Text output (Latin-1 / CP437 compatible) =====
  // Bengali & other non-Latin1 → fallback to '?' (use raster mode later)
  text(s: string): this {
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      bytes[i] = c < 256 ? c : 0x3f; // '?'
    }
    return this.pushBytes(bytes);
  }

  line(s = ''): this {
    this.text(s);
    return this.newline();
  }

  /** Two-column: left ...dots... right */
  row(left: string, right: string, width: number): this {
    const dots = Math.max(2, width - left.length - right.length - 2);
    return this.line(`${left} ${'.'.repeat(dots)} ${right}`);
  }

  hr(width: number, ch = '-'): this {
    return this.line(ch.repeat(width));
  }

  // ===== Barcode (CODE128) =====
  barcodeCode128(data: string, heightDots = 60): this {
    this.push(GS, 0x68, heightDots);        // GS h n — height
    this.push(GS, 0x77, 0x02);              // GS w n — module width
    this.push(GS, 0x48, 0x02);              // GS H n — HRI below
    this.push(GS, 0x6b, 0x49, data.length); // GS k m d1..dk (m=73 CODE128)
    this.text(data);
    return this.newline();
  }

  // ===== QR code (Model 2) =====
  qrCode(data: string, moduleSize = 6): this {
    // Model
    this.push(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // Module size
    this.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, moduleSize);
    // Error correction M
    this.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);
    // Store data
    const db = new TextEncoder().encode(data);
    const len = db.length + 3;
    this.push(GS, 0x28, 0x6b, len & 0xff, (len >> 8) & 0xff, 0x31, 0x50, 0x30);
    this.pushBytes(db);
    // Print
    this.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    return this.newline();
  }

  // ===== Cash drawer kick (pin 2) =====
  openCashDrawer(): this {
    return this.push(ESC, 0x70, 0x00, 0x19, 0xfa);
  }

  // ===== Build =====
  build(): Uint8Array {
    const total = this.chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of this.chunks) { out.set(c, off); off += c.length; }
    return out;
  }

  size(): number {
    return this.chunks.reduce((n, c) => n + c.length, 0);
  }
}
