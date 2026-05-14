
const SBOX4 = Buffer.from(
  "Y3x3e/Jrb8UwAWcr/terdsqCyX36WUfwrdSir5ykcsC3/ZMmNj/3zDSl5fFx2DEVBMcjwxiWBZoHEoDi6yeydQmDLBobblqgUjvWsynjL4RT0QDtIPyxW2rLvjlKTFjP0O+q+0NNM4VF+QJ/UDyfqFGjQI+SnTj1vLbaIRD/89LNDBPsX5dEF8Snfj1kXRlzYIFP3CIqkIhG7rgU3l4L2+AyOgpJBiRcwtOsYpGV5HnnyDdtjdVOqWxW9Opleq4IunglLhymtMbo3XQfS72LinA+tWZIA/YOYTVXuYbBHZ7h+JgRadmOlJseh+nOVSjfjKGJDb/mQmhBmS0PsFS7FuJOVPyUwkrMYg1qRjxNi9Fe+mTLtJe+K7x3LgPTGVnBHQZBa1XwmWnqnBiuY9/nuwBzZvuWTIXkOglFqg/uEOstf/QprM+tkY14yJX5L87NCHqIOFyDKihH27jHk6QSU/+HDjE2IVhIAY43dDLK6bG3qwzXxFZCJgeYYNm2uRFA7CCMvaDJhARJI/FPUB8T3NjAnlfjw3tlOwKPPuglkuUV3f0Xqb/Umn7FOWf+dp1Dp+HQ9WjyGzRwBaOK1XmGqDDGUUsepif2NdJuJBaCX9rmdaLvLLIcn11vgApyRJtskAtbM31aUvNhofew1j98be0U4KU9IrP4id5xGq+6tYFSCWrVMDalOL9Ao56B89f7fOM5gpsv/4c0jkNExN7py1R7lDKmwiM97kyVC0L6w04ILqFmKNkksnZboklti9Elcvj2ZIZomBbUpFzMXWW2kmxwSFD97bnaXhVGV6eNnYSQ2KsAjLzTCvfkWAW4s0UG0Cwej8o/DwLBr70DAROKazqREUFPZ9zql/LPzvC05nOWrHQi5601heL5N+gcdd9uR/EacR0pxYlvt2IOqhi+G/xWPkvG0nkgmtvA/njNWvQf3agziAfHMbESEFkngOxfYFF/qRm1Sg0t5Xqfk8mc76DgO02uKvWwyOu7PINTmWEXKwR+unfWJuFpFGNVIQx9MGiZG4e5IXhQOdvhcgliPD5+Xo7xoMyjKh37ttYgxI2BZfWJy513xldDVhfUQBpNwGNs47fIZGpTqjiYDPSb7X8idq/dOgtYZ4gGwzUNAYuMwuZfAiR1k2Ye5eJU2BDOeugILBKXMqu0Jwoj3+/K2bj63DFr0a0ZSb1Rlu7kqEHa/81Vhja+YVL4uw6CSGma4EeeXARLNBV5JqfeKa6S14Tp0rpd88Wwv6Q7cURGK/zrb9X2FP58cFp9/S8YgxalkR8FlXSpwVtKhW0TB09ORbIPyRymvOxzkHvPWY+h+S3ysQCUN5/QLpxuKD+A8D3TJYq150Kzx+r3TBEzA6KsYA==",
  "base64"
);
const sb0 = SBOX4.subarray(0, 256);
const sb1 = SBOX4.subarray(256, 512);
const sb2 = SBOX4.subarray(512, 768);
const sb3 = SBOX4.subarray(768, 1024);

function xorBlock(a, b) {
  const r = new Uint8Array(16);
  for (let i = 0; i < 16; i++) r[i] = a[i] ^ b[i];
  return r;
}

function subC(y) {
  const Q = new Uint8Array(16);
  for (let i = 0; i < 16; i += 4) {
    Q[i] = sb0[y[i]]; Q[i+1] = sb1[y[i+1]]; Q[i+2] = sb2[y[i+2]]; Q[i+3] = sb3[y[i+3]];
  }
  return Q;
}

function subI(y) {
  const Q = new Uint8Array(16);
  for (let i = 0; i < 16; i += 4) {
    Q[i] = sb2[y[i]]; Q[i+1] = sb3[y[i+1]]; Q[i+2] = sb0[y[i+2]]; Q[i+3] = sb1[y[i+3]];
  }
  return Q;
}

function mix(y) {
  return new Uint8Array([
    y[3]^y[4]^y[6]^y[8]^y[9]^y[13]^y[14],
    y[2]^y[5]^y[7]^y[8]^y[9]^y[12]^y[15],
    y[1]^y[4]^y[6]^y[10]^y[11]^y[12]^y[15],
    y[0]^y[5]^y[7]^y[10]^y[11]^y[13]^y[14],
    y[0]^y[2]^y[5]^y[8]^y[11]^y[14]^y[15],
    y[1]^y[3]^y[4]^y[9]^y[10]^y[14]^y[15],
    y[0]^y[2]^y[7]^y[9]^y[10]^y[12]^y[13],
    y[1]^y[3]^y[6]^y[8]^y[11]^y[12]^y[13],
    y[0]^y[1]^y[4]^y[7]^y[10]^y[13]^y[15],
    y[0]^y[1]^y[5]^y[6]^y[11]^y[12]^y[14],
    y[2]^y[3]^y[5]^y[6]^y[8]^y[13]^y[15],
    y[2]^y[3]^y[4]^y[7]^y[9]^y[12]^y[14],
    y[1]^y[2]^y[6]^y[7]^y[9]^y[11]^y[12],
    y[0]^y[3]^y[6]^y[7]^y[8]^y[10]^y[13],
    y[0]^y[3]^y[4]^y[5]^y[9]^y[11]^y[14],
    y[1]^y[2]^y[4]^y[5]^y[8]^y[10]^y[15]
  ]);
}

function fRound(state, rk) { return mix(subC(xorBlock(state, rk))); }
function oRound(state, rk) { return mix(subI(xorBlock(state, rk))); }

function rot128(block, n) {
  const bits = n & 127;
  if (bits === 0) return new Uint8Array(block);
  const byteShift = (bits / 8) | 0;
  const bitShift = bits % 8;
  const r = new Uint8Array(16);
  if (bitShift === 0) {
    for (let i = 0; i < 16; i++) r[i] = block[(i + byteShift) % 16];
  } else {
    for (let i = 0; i < 16; i++) {
      const lo = (i + byteShift) % 16;
      const hi = (i + byteShift + 1) % 16;
      r[i] = ((block[lo] << bitShift) | (block[hi] >> (8 - bitShift))) & 0xff;
    }
  }
  return r;
}

function rotY(block, n) { return rot128(block, 128 - (127 & n)); }

const D_CONST = Buffer.from("517cc1b727220a94fe13abe8fa9a6ee0", "hex");
const J_CONST = Buffer.from("6db14acc9e21c820ff28b1d5ef5de2b0", "hex");
const B_CONST = Buffer.from("db92371d2126e9700324977504e8c90e", "hex");

function keySchedule(keyBytes) {
  const k = new Uint8Array(keyBytes);
  const e = k.slice(0, 16);
  const pad = new Uint8Array(16);
  pad.set(k.slice(16));
  const g = xorBlock(fRound(e, D_CONST), pad);
  const D = xorBlock(oRound(g, J_CONST), e);
  const J = xorBlock(fRound(D, B_CONST), g);
  return [
    xorBlock(e, rotY(g, 19)),
    xorBlock(g, rotY(D, 19)),
    xorBlock(D, rotY(J, 19)),
    xorBlock(rotY(e, 19), J),
    xorBlock(e, rotY(g, 31)),
    xorBlock(g, rotY(D, 31)),
    xorBlock(D, rotY(J, 31)),
    xorBlock(rotY(e, 31), J),
    xorBlock(e, rot128(g, 61)),
    xorBlock(g, rot128(D, 61)),
    xorBlock(D, rot128(J, 61)),
    xorBlock(rot128(e, 61), J),
    xorBlock(e, rot128(g, 31)),
    xorBlock(g, rot128(D, 31)),
    xorBlock(D, rot128(J, 31)),
    xorBlock(rot128(e, 31), J),
    xorBlock(e, rot128(g, 19)),
  ];
}

function encBlock(keyBytes, block) {
  const rk = keySchedule(keyBytes);
  let s = new Uint8Array(block);
  s = fRound(s, rk[0]);
  s = oRound(s, rk[1]);
  s = fRound(s, rk[2]);
  s = oRound(s, rk[3]);
  s = fRound(s, rk[4]);
  s = oRound(s, rk[5]);
  s = fRound(s, rk[6]);
  s = oRound(s, rk[7]);
  s = fRound(s, rk[8]);
  s = oRound(s, rk[9]);
  s = fRound(s, rk[10]);
  s = xorBlock(s, rk[11]);
  s = subI(s);
  s = xorBlock(s, rk[12]);
  return s;
}

function encrypt(keyBytes, iv, pt) {
  const pad = pt.length % 16 === 0 ? 16 : 16 - pt.length % 16;
  const padded = new Uint8Array(pt.length + pad);
  padded.set(pt);
  padded.fill(pad, pt.length);
  const out = new Uint8Array(padded.length);
  let prev = new Uint8Array(iv);
  for (let i = 0; i < padded.length; i += 16) {
    const blk = xorBlock(padded.slice(i, i + 16), prev);
    const enc = encBlock(keyBytes, blk);
    out.set(enc, i);
    prev = enc;
  }
  return out;
}

const TIGER_B64 =
  "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";

const _yt = 2781082071, _yT = 1805532449;
const _yu = (() => {
  const raw = Buffer.from(TIGER_B64, "base64");
  const r = new Int32Array(2048);
  for (let i = 0, j = 0; i < 2048; i++, j += 4)
    r[i] = (raw[j] | (raw[j+1]<<8) | (raw[j+2]<<16) | (raw[j+3]<<24)) >>> 0;
  return r;
})();
const _tbl = (idx) => {
  const off = idx * 512, t = new Array(256);
  for (let i = 0, j = 0; i < 512; i += 2, j++)
    t[j] = (BigInt((_yu[off+i]^_yt)>>>0) << 32n) | BigInt((_yu[off+i+1]^_yT)>>>0);
  return t;
};
const [TD, TJ, TB, Ti] = [_tbl(0), _tbl(1), _tbl(2), _tbl(3)];
const uN = v => BigInt.asUintN(64, v);
const tN = (h, l) => (BigInt((h^_yt)>>>0)<<32n)|BigInt((l^_yT)>>>0);
const byt = (n, i) => Number((n >> BigInt(i*8)) & 0xffn);
const yb = uN(-1n);
const [yU, yP, yf, yO, yC] = [
  tN(-1528777552,-499781426), tN(1528777551,499781425),
  tN(1431655523,-1473454938), tN(6706290,-834955132),
  tN(-1528777552,-499781426)
];

function tE(a, b, c, w, m) {
  c = uN(c ^ w);
  a = uN(a - (TD[byt(c,0)]^TJ[byt(c,2)]^TB[byt(c,4)]^Ti[byt(c,6)]));
  b = uN((b + (Ti[byt(c,1)]^TB[byt(c,3)]^TJ[byt(c,5)]^TD[byt(c,7)])) * m);
  return [a, b, c];
}
function tH(x0,x1,x2,x3,x4,x5,x6,x7) {
  x0=uN(x0-(x7^yO)); x1=uN(x1^x0); x2=uN(x2+x1);
  x3=uN(x3-(x2^((~x1<<19n)&yb))); x4=uN(x4^x3); x5=uN(x5+x4);
  x6=uN(x6-(x5^(uN(~x4)>>23n))); x7=uN(x7^x6); x0=uN(x0+x7);
  x1=uN(x1-(x0^(~x7<<19n))); x2=uN(x2^x1); x3=uN(x3+x2);
  x4=uN(x4-(x3^(uN(~x2)>>23n))); x5=uN(x5^x4); x6=uN(x6+x5);
  x7=uN(x7-(x6^yC));
  return [x0,x1,x2,x3,x4,x5,x6,x7];
}
function tR(a, b, c, ws, m) {
  [a,b,c]=tE(a,b,c,ws[0],m); [b,c,a]=tE(b,c,a,ws[1],m);
  [c,a,b]=tE(c,a,b,ws[2],m); [a,b,c]=tE(a,b,c,ws[3],m);
  [b,c,a]=tE(b,c,a,ws[4],m); [c,a,b]=tE(c,a,b,ws[5],m);
  [a,b,c]=tE(a,b,c,ws[6],m); [b,c,a]=tE(b,c,a,ws[7],m);
  return [a,b,c];
}
function tPad(bytes) {
  const Q = []; let Z = 0n, n = 0n;
  for (const c of bytes) {
    Z |= BigInt(c) << ((7n & n) << 3n); n++;
    if (0n === (7n & n)) { Q.push(Z); Z = 0n; }
  }
  Z |= 0x01n << ((7n & n) << 3n); Q.push(Z);
  while (7 & ~Q.length) Q.push(0n);
  Q.push((n << 3n) & yb);
  return Q;
}
function tHex(v) {
  const h = v.toString(16).padStart(16, "0");
  let r = "";
  for (let i = 14; i >= 0; i -= 2) r += h.slice(i, i+2);
  return r;
}
function tigerHash(str) {
  const Q = tPad(new TextEncoder().encode(str));
  let a = yU, b = yP, c = yf;
  for (let i = 0; i < Q.length; i += 8) {
    let [w0,w1,w2,w3,w4,w5,w6,w7] = Q.slice(i, i+8);
    const [sa,sb,sc] = [a,b,c];
    [a,b,c] = tR(a,b,c,[w0,w1,w2,w3,w4,w5,w6,w7],5n);
    [w0,w1,w2,w3,w4,w5,w6,w7] = tH(w0,w1,w2,w3,w4,w5,w6,w7);
    [c,a,b] = tR(c,a,b,[w0,w1,w2,w3,w4,w5,w6,w7],7n);
    [w0,w1,w2,w3,w4,w5,w6,w7] = tH(w0,w1,w2,w3,w4,w5,w6,w7);
    [b,c,a] = tR(b,c,a,[w0,w1,w2,w3,w4,w5,w6,w7],9n);
    a=uN(a^sa); b=uN(b-sb); c=uN(c+sc);
  }
  return tHex(a) + tHex(b) + tHex(c);
}

function serialize(data) {
  const enc = new TextEncoder();
  const buf = { b: new Uint8Array(256), p: 0 };
  const varint = (v) => {
    v >>>= 0;
    while (v >= 128) { buf.b[buf.p++] = (v & 127) | 128; v >>>= 7; }
    buf.b[buf.p++] = v;
  };
  const varint64 = (v) => {
    let n = BigInt(v);
    while (n >= 128n) { buf.b[buf.p++] = Number(n & 127n) | 128; n >>= 7n; }
    buf.b[buf.p++] = Number(n);
  };
  const field = (n, wt) => varint((n << 3) | wt);
  const str = (n, s) => {
    const bytes = enc.encode(s);
    field(n, 2); varint(bytes.length);
    if (buf.p + bytes.length > buf.b.length) {
      const nb = new Uint8Array(buf.b.length * 2); nb.set(buf.b); buf.b = nb;
    }
    buf.b.set(bytes, buf.p); buf.p += bytes.length;
  };
  field(1, 0); varint(data[0] ? 1 : 0);
  if (data[1]) str(2, data[1]);
  if (data[2]) str(3, data[2]);
  if (data[3]) str(4, data[3]);
  if (data[4] != null) { field(5, 0); varint64(data[4]); }
  return buf.b.slice(0, buf.p);
}

const KEY = Buffer.from("syn-key-4f8a91c2");
const IV  = Buffer.from("syn-iv--7bd03e6a");
const UA  = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36";

function xsyn(ip, ts = Date.now()) {
  const ct = encrypt(KEY, IV, serialize([false, "synthient.com", `${ip} - IP Intelligence`, tigerHash(UA), ts]));
  const out = new Uint8Array(16 + ct.length);
  out.set(IV); out.set(ct, 16);
  return Buffer.from(out).toString("base64");
}


console.log(xsyn("IPHERE")) // apply a timestamp if you wanna regenerate, otherwise it just generates automatically
