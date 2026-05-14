
const SBOX = new Uint8Array(Buffer.from(
  "V0nRxi8zdPuVbYLqDrCoHCjQS5Jc7oWxxAp2PWP5F6+/oRll93oyIAbO5IOdW0zYQl0u6NSbDxM8iWfAcaq29aS+" +
  "/YwSAJfaeOHPazlDVSYwmMzd61Szj04W+iKldwlh1ipTN0XBbK7vcAiZix3ytOnHn0oxJf5806K9VhSIYAvN4jRQ" +
  "ntwRBSu3qUj/ZopzA3WG8WqnQMK5LNsfWJQ+7fwboAS4jeZZYpM1fsoh30cV87p/pmnITYc7nAHg3iRSewxoHoCy" +
  "Wuet1SP0Rj+RyW6EcrsNGNmW8F9BrCfF4zqBbwejefYtOBpEXrXS7MuQmjblKcNPq2RR+BDXvAJ9jmzaw+lOnQo9" +
  "uDa0OBM0DNm/dJSPt5zl3J4HSU+YLLCTEuvNs5LnQWDjISc75hnSDpERxz8qjqG8K8jFD1vzh4v79d4gxqeEzthl" +
  "Ucmk70NTJV2bMeg+DdeA/2mKugtzXG5UFWL2NTBSoxbTKDL6ql7P6u14M1gJe2PAwUYe36mZVQTEhjl3guxAGJCX" +
  "Wd2DH5o3BiRkfKVWSAiF0GEmym9+arZxoHAF0UWMIxzw7omtekvCL9taTXZnFy30y7FKqLUiRzrVEExyzAD54P3i" +
  "/q74X6vxG0KB1r5EKaZXua/y1HVmu2ifUAIBPH+NGoi9rPfkeZai/G2yawPhLn0UlR0=",
  "base64"
));
const sbox0 = SBOX.subarray(0, 256);
const sbox1 = SBOX.subarray(256, 512);

function gfMul(a, b) {
  let r = 0, p = a, m = b;
  for (let i = 0; i < 8; i++) {
    if (m & 1) r ^= p;
    const hi = p & 128;
    p = (p << 1) & 255;
    if (hi) p ^= 29;
    m >>>= 1;
  }
  return r & 255;
}

const u32 = v => v >>> 0;
const b2u = b => ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
const u2b = v => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];

function g0(rk, sw) {
  const b = u2b(u32(rk ^ sw));
  const [s0, s1, s2, s3] = [sbox0[b[0]], sbox1[b[1]], sbox0[b[2]], sbox1[b[3]]];
  return b2u([s0^gfMul(2,s1)^gfMul(4,s2)^gfMul(6,s3), gfMul(2,s0)^s1^gfMul(6,s2)^gfMul(4,s3),
              gfMul(4,s0)^gfMul(6,s1)^s2^gfMul(2,s3), gfMul(6,s0)^gfMul(4,s1)^gfMul(2,s2)^s3]);
}
function g1(rk, sw) {
  const b = u2b(u32(rk ^ sw));
  const [s0, s1, s2, s3] = [sbox1[b[0]], sbox0[b[1]], sbox1[b[2]], sbox0[b[3]]];
  return b2u([s0^gfMul(8,s1)^gfMul(2,s2)^gfMul(10,s3), gfMul(8,s0)^s1^gfMul(10,s2)^gfMul(2,s3),
              gfMul(2,s0)^gfMul(10,s1)^s2^gfMul(8,s3), gfMul(10,s0)^gfMul(2,s1)^gfMul(8,s2)^s3]);
}

function lfsrStep(v) {
  return (v & 1) ? (((v ^ 43057) >>> 1) | 32768) & 0xffff : v >>> 1;
}
function rot16(v, s) { v &= 0xffff; return ((v << s) | (v >>> (16 - s))) & 0xffff; }

function genConsts() {
  const r = []; let s = 17034;
  for (let i = 0; i < 30; i++) {
    r.push((((s ^ 47073) << 16) | rot16(~s, 1)) >>> 0);
    r.push(((((~s & 0xffff) ^ 9279) << 16) | rot16(s, 8)) >>> 0);
    s = lfsrStep(s);
  }
  return r;
}

const M32 = (1n << 32n) - 1n;
function exBits(p, a, b) {
  return (p >> BigInt(128 - b - 1)) & ((1n << BigInt(b - a + 1)) - 1n);
}
function permute128(st) {
  let p = 0n;
  for (const w of st) p = (p << 32n) | BigInt(w >>> 0);
  let X = exBits(p, 7, 63);
  X = (X << 7n) | exBits(p, 121, 127);
  X = (X << 7n) | exBits(p, 0, 6);
  X = (X << 57n) | exBits(p, 64, 120);
  return [Number((X>>96n)&M32)>>>0, Number((X>>64n)&M32)>>>0,
          Number((X>>32n)&M32)>>>0, Number(X&M32)>>>0];
}

function feistel(rks, n, st) {
  let [a, w, x, g] = st;
  for (let i = 0; i < n; i++) {
    w = u32(w ^ g0(rks[2*i], a));
    g = u32(g ^ g1(rks[2*i+1], x));
    [a, w, x, g] = [w, x, g, a];
  }
  return [g, a, w, x];
}

function keySchedule(key) {
  const C = genConsts();
  let st = feistel(C.slice(0, 24), 12, key);
  const sk = [];
  for (let r = 0; r <= 8; r++) {
    const t = [0,1,2,3].map(j => u32(st[j] ^ C[24 + 4*r + j]));
    st = permute128(st);
    if (r & 1) for (let j = 0; j < 4; j++) t[j] = u32(t[j] ^ key[j]);
    sk.push(...t);
  }
  return [key.slice(), sk];
}

function b2u32(bytes) {
  const r = [];
  for (let i = 0; i < bytes.length; i += 4)
    r.push(b2u([bytes[i], bytes[i+1], bytes[i+2], bytes[i+3]]));
  return r;
}
function u322b(arr) {
  const o = new Uint8Array(arr.length * 4);
  arr.forEach((v, i) => o.set(u2b(v), i * 4));
  return o;
}

function encBlock(key, block) {
  const kw = b2u32(key), bw = b2u32(block);
  const [kc, sk] = keySchedule(kw);
  const pre = [bw[0], u32(bw[1]^kc[0]), bw[2], u32(bw[3]^kc[1])];
  const res = feistel(sk, 18, pre);
  return u322b([res[0], u32(res[1]^kc[2]), res[2], u32(res[3]^kc[3])]);
}

function encrypt(key, iv, pt) {
  const pad = pt.length % 16 === 0 ? 16 : 16 - pt.length % 16;
  const padded = new Uint8Array(pt.length + pad);
  padded.set(pt); padded.fill(pad, pt.length);
  const out = new Uint8Array(padded.length);
  let prev = iv;
  for (let i = 0; i < padded.length; i += 16) {
    const blk = padded.slice(i, i + 16);
    for (let j = 0; j < 16; j++) blk[j] ^= prev[j];
    const enc = encBlock(key, blk);
    out.set(enc, i); prev = enc;
  }
  return out;
}

const TIGER_B64 =
  "q0Bpp38xd5zUuoEJzZXdiTSqDtfywUtmRGrCyBtCZ50oiVposqyBuR5QsNDDFB4bvMOnFOK+tPk5z0vjUWUPb9ISb0/H0Z0a" +
  "b5iCYH1uPWNGpSTpXflA5ggFYa8tyZO3z550tduD08z0Rw9jS5ZPMfaQsbbe37E8uH2Lvz+vA3IjCAru6zqesSEXNoPmfMyD" +
  "DIhTIJd6x4ESdNvqs7EAosmHTXJqu/HCW7P1K1z8KznwmQzM4F6uXOo4xBNP+Crwof9B2MuI6GURbZ/BY+Hhm69R+xrBf61P" +
  "68Wo+iVAsPY8ewFX5zOVC4gpzcmNgcoZVtOa1MRyRc++C6S8vtCRpS9ikVj6ePvSABi6bSpdOZlFucEjbyQNauyiOgGS/QJG" +
  "u3KQNTJLC35dPq5+0Earl60bfb12MqkRHeaypketJztA+3DPFHfcH9XeKlG6GbuI0Cr60sD3gm1LRTB9JBc6h+hPlRhSEqY6" +
  "jxw54AmGLiiLzEK5oiIhemEVMy9InMG8c+ktlrikM+w9GeWZMXlX2vzh0xDYHzar5h7dsRoveGfXSKZZdYxDMpd31kUm236u" +
  "T/aNLe6eXU1C/M423AhbSKJ8oJAhFgQlGA1G5fSg2CsFi3JhbQd84CsBcW8PV6ABzWajjewCCgA1nx2YZzl9ef0C4cePWImL" +
  "YvqW+N81HSxaWCwMC59zy8FWkmaGMFrtuqnGtKVBGPdSHzx5chU8lvEhOGlX0sBHHGUxHyDvDuIilVdDVORkQXjiczE1A420" +
  "dCBko3n0vUOGD1bKOCxoW5lC6XzhO7It5C+4SPNM4uO5nLfcHwSGDu/oZ/4IDu82blfY2UVINyPOjVuURpFjEBPSr3sjAJsg" +
  "Kbjf/WzrnLu0vIR4UCi4UxS3hg9D7e2P4z9MN0HFy/9t6tXt+Kk1oefVUsZJUpAcMVQLyz1ZWGnC1OsiCuDjWJWaGYk6TdVo" +
  "Fsb+FUw0VepVsstETiFZDRBx8o50j8+A+ElRep22Xv0XOav5m86szVE9x/B3OKN3MlV8Dq5WLDTdekfklfMk2KRT9xYTYNrB" +
  "J2dlGaDlxMOyHTWBTei23vmgIqlrb2r7SiZe63vumD4t9EqAWKpQrYzY2oUSpo5VXLZqXe1pPhguA+eMkUPfX6rEUJzlJvM4" +
  "FetrnarCKHYmCgfiniv+FgpbzLvU3vkdtQ5/37fWFfhDXE4C6ERf5GBp3Cos2I9CeX8nxLAnjEx6BqHoKaUbWpJSKEnK18KE" +
  "iUMNUO+5CNfbE/BTAF9p3NEu7wbFrhzA+9GZPYURcM6QdchqkLIUp5OjtTqCZAb8ZucWDTY9usrpSxSuB/rD0II7iEAY5vTT" +
  "Ksu5uEK92QffN130/KP4jHXklKsCl9e6prS+srXMEe/lrnZLA3GfKnatnarjE/BRrGPqJUD+ax58btAIF9lIqH4AnqgOfVEn" +
  "nyhIm+niO9WAImMAX8qh1vLfEgdky+p0hW8+w6OdHzUZYc+LaEf2FGlNK2fkBgnRa/DDpX5Jl45shvTn945EjantpXSUU27F" +
  "4u67BPnyNCad2dKI3ZKIQLC+P1Q+IBeRijMv1vs3DKD1/aILcBs/qcdZIzOrisi4yMlZ/y66eUQ6k25wEWjQgj8U5ncGKRNd" +
  "p4pUwBB7MaxleDs8buqntWjB/IZi7H8/BIRVP7YBOLKYpLPxicSqmKM6qbOpa9Ehfb0E1YyTetmzYBNVM3C3BF7be/LwDN4D" +
  "jasaSko2IAo+436Ku89sAsSBED7JomGV0/VYmidnlr0kMIPsNMPyfZrdl6za422mVNAGEcJhU+4LRvZsYJv8L3EJ1JEei03l" +
  "/qjKHWFmvzA4K19cU7gSUMP3T6R8hGKTGl3XvtLwpHElgBchDE4la9ngYGQ353b+94PJ5pm/hNTa+L0SLxxBUkhMN/u8Y05X" +
  "DQeMOGWZyRU2kd5/2ZhK6FMyRBdmswd8xS39W6clLXAbzT1izvaS80dErEEiwAVzkQzxkv1q0vF38TTbRJBvF7+1Bfx4tYPI" +
  "Y0Hs09dcxb8HX5iwOUqa8puvts2Hh85WqL/iTP6JRkmETh6P1agyRd7IbZcoPCPf4ASOJnEJENt/bONfrE++KUzsqjvWHmD1" +
  "XyOFoV6wMK/zNI/eekX3itaOG4SkLlRe2LF4a4S35Xix2u2Cn6uZM5bX0ZP/jVxOavO0oJPGgMZZSnlxyHZmx+7AmzRa+4UP" +
  "N9wfLgXdqOuBcP/FzFUBnyDHEVIwbHGwjjXkMqEjTOFB+UkF9mKUDJR+iW7qlHVinKdsJIAL7mRwa3plnKeHEx/vXDBz1FZU" +
  "oKGTKZi81BJYXgmf0QX9bofOd6JZWuQJnlqH71bxcp4zJwCeudPn3QYlAzmtLYqk3DHF4YH19UuDeWInqBBJo2SXIMINfqI3" +
  "tizgHNMKtXuu1mjzPBoas2cQQBuOGIuUA5S/Xoh04EowERjO9drWBlBzHK2/KkcuTZsphxWAzbbL5a1GKx28PcysQ9rPbSnn" +
  "cjYmChbVxvS9aLxHHf8vJCyMRXbxzetsCYIldTu0FgVJGvm3BFEmxAIkMpW0hduq+ruAHsZU7IU7lgjdGcevkqXy+Fa9gqVZ" +
  "4ZIV91WhuZB7wpz1i3NlYU48Zk2m3FLJV4WK9poNs3XGpu4osVAZvv+w2bqvPiL6yhYhc2lbe+ntncDRlg/pIg6PdSyKyP8I" +
  "D2QuWoM/dJoByuhCHOn6f8D+8wMBdUJgt3YCTlua5oaNT2VDGRw/bnLTYhC5QWbfXpH/87FUlX/5OoXp9GCBUgxc8XwVqSmi" +
  "M4EprdSSi0uwV6Zy0LHZVamEOGG4sLnAUTfSerM78EYmdSh4NwbhZtMH7col1/vN2P5N75LifpsvHy4AcIciVv37jFk/Cjpl" +
  "f+z9TQi5LTdVCUx5wyGF0Ymhhmgs1c3o12sSvTY6Rb86PmORILxtzoaPJK7T9xnj7+X3uxdsWtgjZpRF2PEX+0rOEVo1IMeZ" +
  "9Sv+8ez4C+4qcNzDEheb8pYX9SJXRpGw8obhsCZuECqRjpxH24+wfcVDa+3f5I0HwKUfCstTeflo4xqmrrRPrS1bcpQ6yB1w" +
  "QdZvVPiKtI8AVmDljdZMl7rilbXkgWVhChBK3aQx8/Gv1PZ2i0nnQd6sIQK6/RRsZMmCGPHQWIFpTsk3UaN1GiIhZgd9X1wk" +
  "vBKXZYKtjGAoqB5TCq5gCZLE9JBckTZ6Rq9Hb/XhZBm32jsh/R0DWTbdBdw5EvmmelPKLg1Zurq9GAJ1B9pHckybu/8tbTcg" +
  "4fLBq9J+0gidtrhkA+X4gDTrsM/jlwWHrZflJ3k/GouhpxfChNFU+ovkV7iUkOsjTwzDyP4CHzArn+v0J/Dq3JDFS/uOeTl0" +
  "eVHvUg+T/4waFYMbu912xWz6VExEy4Y6PLqt10UkQVjQ8fjVQ6qHQsEp8uOGDXGeYkRDHZ+bmn4UYtTBTXZGFaAc4t63QHed" +
  "5veg0lJWZ0WfeJEL1c7xgyUmGPbZxT3tMC0Js0ItYidq6J+l/PvMkYp+Rc3yV0oP+6Ben0slgKQVk72Tj13IUz0Wmkb2jEIc" +
  "pPav90+DBB8uFJnWak4Buxs2/OyJtsvhhDB6FWSW31ttqdqXnGSULNxB7iCy/tg0/GrjNMSNqLiqvqPLvswADjV7WRwF9rIT" +
  "Yds2aeb5iqN4KOTiWk+P1dv8Vttsjr9qgbKs0D56MxuVJW5QaFXECk4RROtbqCfrCFAMj3TeMDvt11t9d+ixlppjN233spKz" +
  "6jtaahsq1B57ioRbHYIPxCGAkEgM/A69/63ZJrVN9jXdOBBghZ2WXOBhvKqhWE58xEo6vF7PY9PMnn4UYhXOJnTqtbkzfWHk" +
  "E8HWqBoifIm+P4AsqxGpzMa/20BH8yuVVypIxABb7dYBS+rYKnDJ4OmQeCR6w3hOx23foh6smdeuGn1ithAyYuJ8JmZ26ltQ" +
  "RYnCTslcEZhLCixxO/+C8PGMsTyKygqfdZIjBiID9f5Neok4EaE+IQJGqZqVMpdrdwMDOeG3uDz6bC2Y8H8hhh+4zJZTlP4S" +
  "1YNxY2Am3OwXbwavvQueF55djUoECaugmdWTUfkUn4Qytw8vl+NqobRaPYrWXgzzKUi/Kll45DazBhv+FHv9JcKCuech9LPU" +
  "fTUTsj0bu0q7uVGccbPP+DcPCBHi6UnJ9ye22azgw0cPZAF+QFHFiASYcMU4Fp1piJmBaxN8erduLDCjMWtotsojZyvRdX/e" +
  "MQ1zhU50U0T0YNiJENMuM2/mQBcpnmtzz+9fDe7vOPeA6aip6eY0AX4bnhPCxwd5nIjoXsYajhSowCehymalL+XcRu6H7acy" +
  "OZptcN1CvpBlc1WVVe5Z6nb4IB9UiV3/rAgAKSSiKnj4s2o9RgS3k2fniIFdwuh7y6Z8Xc9aow2Pls66gDB9hQ7gdWyWhEAR" +
  "XyRsEoNq8hBTX1PHwHIGAAm9HDHcmF/HBqpJoN4H1q4WndXGFgEkKbmjeyhhUmnZ1HHLRG9QkwQe0sY7PAyD/PPZL+Cw6+Kn" +
  "jnKY8ui/vY3asV1ftKQWrxzPQXRJKOwu7Gk+fw41mOnf2L4P6pUYSJM8XIOpSCZoIARSvsHsI0PubqVB1zycb/aN3t//d27n" +
  "/s2hwO/YArxHtauGkDZe/VAAWA6bPjv2Zh3gGa84xs/WLps/7SPe0L8ZswUcKcHD53ky6r8ebBZjlBaxoiz6caPC0EsjK+45" +
  "GMzNMChjtlSD81D8cjRW0pdoMZ5M567i6GWWDKYu9zgdL50EpbpVwvDQ14yB1LVeyMYz09pH0JSHBfqnCR/RTCfLxB6qu8B2" +
  "pvQLGuCrkKpS+aR3AhO8AwNSsjORiB7lXSJ28KCGDYoHE/nMmTkVyjtFi/l+DkvGzsq3WOuciCJW8LSA5aUgXz92ukKMmcpX" +
  "w+EijZjcrbFJNM+CMp/0SaKuitRBYoQGLKIrPlbSMQtwdwQIngDanLa0x6yjpywYsYt//X+ArKlbpMVWk/WkDBHINeQLSlfd" +
  "Ph6uhPsIRPQQ/ae0NNvld0PHBzYGaMI9tX/ATxhF6S0ZAmhcSBmgMVqH3dHzL01kVEmHpOdvSKWMq8hnc7ihyORnJb+8Z92o" +
  "c31hMs3AEmPrVectAckIdXHeopJnmnAFskCPznszUZLR7Wnma8Y1y7gzjtpKRPyaWT15yS6mcz84DnQDHxgluUJN5otuoDzb" +
  "XFQVI60Fb7USuxR7dc0oHWtM8yV8vdtAp15Cmaiv04INnDyb+j2v9UgyThZmtVK0hXT7t1+FieYF/xlXY4svKwsLDeGIxNW+" +
  "2dHRtsdDoiiYOT86afrmUaXuDlWaSxtP0oWqScXypl2rR2SObXNyZyS87AnMD1COlCDwbjBxdE2b9SoBnWXgrETDkvrOwaqy" +
  "gpUK+GVpe21YsB31K9njWs1CT51430MC41l3iKc3HD7JWNM1yCfv72ABNOhQvtfafN/pc1hMCatAMTmHL2ETwfg9XFG6zkSa" +
  "ESS87aCvbASw92BNHpVClzS6WIlC82K5nAb8f+OGZfgFlGKKR4fula4TwAT1rpD8oB0OG1Bjetul73dqttkbUtVbyRI2bWk1" +
  "J/jgccGF3lMH6z8rWLgXXtxjBTPkliyJtLBsw1OsxFwLWreE2hrvoXE//xZgwuwh5LiJVYRbrmMa+1Qo1Ke2vDcZVSp//1Za" +
  "9TE9VmZgGR3HArhJ/K3/bnlBblCwKZHQUgmTPrO1S2RUubbsyXApMyG+9gZAIc36M0rBos/7TOrS1TgsudBzFsSE8wkj1Aju" +
  "V8TuuMxPuXwVfrBOLP715Vgel/0HfpoI5aOfO58GQzEYomk1AnvCWYa8EWRG7QNfOT6ShQWbAM3d/uG2bkOw7UPI+mtFdX5v" +
  "c90HfJbBGBv0I5nN7dqd4WV1p6P6zLHAp6xeW81EIYQKSND+dSXW96IlM7CMNIuG0TwornClWWVGlk9w2Yqkc4eN23TF0205" +
  "ReCebN6/0I6bUC0jg1Ey0mZPRpF8QPk4r+zaeAt0EnRtl8tT2NYazOyVTPRVsU7JgRiRLQNBlopaOqsCrJOOr/GGx507s3LU" +
  "Y8m0A4t4pabLmNUIOOOTh0TAF2MmE9jrunZmYBkkOGDIC3qzYeURzsBASb05cjlXT94ZDj4/AqJ8ccabN9XUeGD0+PqaZ/oY" +
  "aVPCgNfP6z7Xhey+iLbgJdSpFLly5HYaQimt2hFz6Ako15oUHD3xMurYpjqY61vDmgENy23FDr2I1kHiqZKtlN/C10EgNRxU" +
  "lw/OWJTEhPHjUubmSgRFR7WPJC9zj5/YSG+sZntcyw36q4YgKBFN+X4vBFekSdkiFkUMxpujPVgbsXMmQ2kiBR+lV56RGy2W" +
  "SZs2863qYezaZQGI5xZq8t4uND0MU5cAyRFlvJ5vRlEcbWrnKolKsHhpWgB4+HcuP2Shk6cMR2zM6YvOUso/kTWmL7o8N+R+" +
  "vbWk4/Qnvp0dGtZDVM0upJjuMB1ZOrcDAc+yhz/svKVwMJSVGvRdRRRdhW4OIqEXKmJ7fi/INGn5KNyW7qKVC7YIWwH3B3Qj" +
  "ubMbDcu+9OCjQ0oF/WHt3KRCNSIwd8x1MvlLtGhaV6AQFcU8te4F2qmOLgotn7rwCRvKwIZ5qIAEAN3J/zNxg5SMChyVsueC" +
  "UyYxB4IVkh+QZ0feTmsJCjESmN+8O8HdOsGgXDFSIBMw/CVLNFeZEZ0fiI7xphXL6VeVz2+0JqyO4tGn1cOq0S9ofOndPqlD" +
  "4oBDnOkNMWdei2R1W1WJmzxYAlRICNz1/4e6Kbi8cEZyxtT4nEeBtuuykOqhxzdihP1IX/ic4rRrLRqaVvby46tgg2UBeoXC" +
  "lfAT2P7hT5LKDbUheUamJBIWO4YiWK+Yk9PpphhOfYwAVET5apprOxO96K0PpAZdO4pSeh3LxtMrSbOX+1BmMGyDbbVX4CtC" +
  "mTip8goLnhwN4xK/rsaArdky2MwGmWSuxpLnWmJMrKdZx4GUJw97W+b/+9S3nrKLQa1OMNBLM2HnBRVdF5jzquggPG3z3Hlw" +
  "sV+70MDm02vWzkCgZ9vlbXpE9x5MZWBQHsWcrNGqtcqSR7mBiTFITiQ3GHnwSupqA+Xt72zvVLUOF3YYyiOU1SCBvY+KPN0S" +
  "Xdw3e9x9m0wXf8Sk4B/SyM2gHUCmXl+fhct42ysOBNaAiarSFFnjwcFyjaUTcTBo9+FhQjPe5sbbVoI40x0qAc+dI43HfI+B" +
  "an1xdwlW0fO7rnSDoqDwL1unhB9esN8maFzIfa8Aho2onOOrZV2INO5Vm0cf91V6keb51539g9mDWQli8vBJnl/Db9m9ILhW" +
  "szNT0w2pJEjzpCaymX8eLKG2fUW+BTw9iWrr6IEQNQxL2kXhEMAl5NM5vxFELor24ervJ7L6D0CCt3Lr+eKNkNBLCLtalHx/" +
  "SrSAxDViQDcmCmv2qJFuvg/1KTIhZsB3f3Dix9KOY7+WIn9MKS+0PFHU0rGr2FIoKTSHNIXdWM+yIfCoLl9RDp98Z/GAob/0" +
  "e6/9YQD1/QbterEMjjDpGay/UHLOukFLYfKWRsS7oHEs0CBvJeiHo2ShWbeHgv7HPZmdaOKLARXOYd8V5owd/wLNKphNCgup" +
  "CN8WCzKQJ0HFBKOLpUU+q3R3/hnoLfyITGzlkO9sp339n76p24hTu0CTK/wSauGz9gNNjMaNE+L+8cPwX5c7ujZ7Ay5kJpje" +
  "/O0AZxtNDAe8qA8xY9K7xAyC3q93OcpJLlF1obsqWrJ1Xj5KQQGjxYz2C1LlqwrfwzYGOcLpgnbv537dFWgQSr/kMhdLGc6T" +
  "LU05SAiBnP4lFK/cOji9sWfZIg9dbg23d8yKn48U1YX7mhwQ9qj2KvJMaFkWQrN5j/pC1ZD5w3vgLMxEsRcWnGI7jvd9AhQ6" +
  "UHRdmXoYz+9Wc+rlwwkjcriqY9Hq0aI2wvPTE+sDfykGiDqqjd/HRPAr9MVx8WePjWZR+1y5b2ZHEK5z3x54uG8n8fVpvcgQ" +
  "GUb1P08cq+mt2+Qla3ZoT1wcLDbWK/fnI04eknQoUCeKKlbuBIAHIHYMEDfhEh8CTbvZXpc2+Pu+6M/Wk4Q6LX14ISRJ59cU" +
  "2GulwX6dL+iqDnCCqsna/YuQqGmSSCjmbtGMwrSDdddV0vLKo2T7HqZ5J/8k8ttVTm6iGnYsXD+3NXlPyNc2Kz6ej+Ds/F6Z" +
  "ngdf5D1UjA84yh92UTLFTSKRzci/t8moUpHN/nQBrE1+MIW/1GSFkXa0IQzbstIXjqAJwPZot7Ch+xig45Krpak2KSRkAI/C" +
  "XQlN9yw3Mt2EU10F3t7lMmQuzuZ38NbHrVdwYU7Zwp8PPg3rf+18kMeeNpvRCAfYVSfhruckSPfdtz6ySB1BH1k9O8lh0I7u" +
  "aNULc4b38FGPzOfEaE0fcWFdSKGDXl/QFXtgfBPx2haMDh7aii1qwY24rghqv5rDmFZlRLWiEkbFdDRxwtVAXl+OiFiy5d4O" +
  "09G/gfuCOkESUK2sXQ9PfGOXqnCkW4RdFFS+glw4v3lEaRYx1vKkz8s0M8GgH16mE03wmPq0/5TPOsZF0Fd4J8o8n1rLpid2" +
  "cKV7FS6l3JW9mxfevnYTGhtZzHStwDtJQnXXdhCAekCIZjliZgW6oMkcRe0m+dgzrioOjSU2KXU1+nNnXnztnpJhVvlWxR5K" +
  "KCyo3yHW7pjvb5NrhetHvdf+KE4jmuEPGPcPuCdS/h1cAxpBK8IYyYrBmX1D/4aiUOyY4nVivFnBRIyI34hSAw5IugMBh7W8" +
  "2u1H9oR+s/qfW72eyZmM1JD/3d3+ILGZMf0xSlI0K2EGkBGFY4ph9tTaYrMYE7Rt9RqjvLQ5+1Ip59+AmYWQvucyAz9PPLiT" +
  "stfWSFBLoP5DwBWnUaiozVQBt/Wm9C//W6h51cBhLPtW5Inc138JYD7UmqhNsTGXu4CklW9J9rOgQck0Ok5JgwxKos9AElox" +
  "LM+SNkYoG5ucg1dR9NQd9U8QRE2sWZc3ESJykdwxqR7kFfZ5fBiT15VJaXXBJo1fh9vHrY5DFd85NVQ8FJY9L56KWSfxpIlL" +
  "0HL4g2B5W9wjZOzQh1H0lpfmsTfE+5ZHg0ZJj8/kC8yCBoEBHKnsRJnC8okpL+Zyq3xq6rBfcIH4dwDwKI7DDcDhxRjSjM02" +
  "b5094wYC3ytFxiOaeMeStODxJGquYyZFMNh9AjncIsaLH4dA/Awatczquy8fum8qr70KAMbNTMv/34KcCTooHCSv5QQNm1fE" +
  "24YBGeQ7uwECnHWfM/N/twdol0MWZvkh46NM2DfvIeorlayqqM6Lh7ZPLNHpLsXgYHMfCTwDuX83ToN4NqCHaIBjKpLZXH6M" +
  "vpORX4tn6W/tB3gu2GujLcLOwlVFUzwoSI/zDbn1AOxz1o9p7UqffvvegL5pDoOhWO7eezKd8fR386XF9+A5LLNa9Hfmj4Kn" +
  "pX9QPvLsYk6n8o1JV8mR5Q0KcVsM/J1WBT/IC7u13YX0eAiHYnJlgNb89cxMBGlX1cedIAPdSrlt9PuibUWBu8SLIpZnyMxT" +
  "0oWLehmLWeFLQ1Efa5wUDBBuK6nskGQH3r9e+hWjrWP+GGxUmB7HdCFx98t+G9Rk/ct8Sz25Bdl/ydpHjIkP5C8eHPLi7lgu" +
  "3JrDitOXsp04iDfHWdPrBAOrZrSIKxd3RyPqV3LpYO+sMzLnxz0ufaOH3I5V/b3zdB217kFu6qm0BVspnKyI0us4f7FL2zOa" +
  "6dBGLba+2wYnjNQrMHrTTGKCWBFwFKE7v3DVtUpWZ6jsZ/6rj41UCIG6Pyg15j8+4gBKUn3jigV4mf3N4OfPJUq+a2z4MtXm" +
  "6BFSk/DEPjmRnxv7obMZitnrsplxTE7yZZTL/zGu0GfIDTjzD1VujzSsTk+64sB7Zgxo1Fsl50g2bHqLvUZ51T0xL4QCeFFY" +
  "hSZn/ID6m3M8BFWdU0EwPep+oA/9SBHaWsT6Oq+9d8BGCx0SjU+Vqyqwls6zENcJPy8FyHpwsJJ8pvyQX9cgrwGYlNbvrcix" +
  "cbvgr6UppylXoTpTvDBmQ3XoIB00zy0Rxm1ulGwnqjpy0//SJGVxEM2nBOASuwhsSSvQXBeDA09M3KZ/SXE4E6hY5OnOCV1Q" +
  "9+Oh09Uq9Y1esrQzKkBT8R2qLVajWnOL4YRc5d1EVmvuaxOjl1AM3mdfQMqp+ORanTslpAAipu21xTzDBA0BuvON49faBmO2" +
  "BEc178rfcolpvFo5/zV0rEAUb+zltgTbsbZPFpuqmaSkYti2VBfirhndQRR5Iw0KbqS2OC0hJGIKXry38yzj+HrKGYzFr/Ot" +
  "piQCB53RXD+a4gb9BcNo6YYS+bluGvww+TnETAe8VWrO+C5d6kJ9eC4pipfoe56jOmoMJULGFohNokK9v8zyeiACwPR2GUsA" +
  "Ihd0sInK2cUJNxR+7qHgv5atJuE7hrZp8iWEE7hzRTX8edL4EcE002x6ylALHE1Cwxt2KpKrnIL2ZbjCez9DPBcWm16UkQ7I" +
  "m5YQLCB3I+gIVe47GoRtIOXvB1kIdTXnQX0wpnMRxtFqTBJvk2BGFBazdx6ikxwLvBmcHJGnRM6w9e0XHpTvXB6pkCH5b68i" +
  "UbnpGz9pKvz6LWEwR1QQuHvg72UKuKL5TkBLhlqVbGYt+UPZnwrRcB8hs7oi2MomO1xT8fVqUBXwzeilGweYslNSbduen67r" +
  "usPBY+E+voaq2WQmp303AhyuuWCrR2tbM7WrEFjadRLYRbAGyIFCbrmJ2XLDM8njGktfIoHLdtZrIKkyDp76qokT4g6q6vj9" +
  "fZLTNR3+e46TQts9sbD3I3l2p0aat4BV5gh+CpXhpeILUYbGOOglNPEP6yPrWArwt/Ceu81sAlTRsSfolnTOyjKBrxqQ9uic" +
  "JenR5MwWy4Tf9s9uggvEG6LljkJlXQYklCiVaC8VNmUAYOZkRG3BOCbS8W230pQZuMhjZj6Y/Rg=";

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
  return buf.b.slice(0, buf.p);
}

const KEY = Buffer.from("syn-key-4f8a91c2");
const IV  = Buffer.from("syn-iv--7bd03e6a");
const UA  = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36";

function xsyn(ip) {
  const ct = encrypt(KEY, IV, serialize([false, "synthient.com", `${ip} - IP Intelligence`, tigerHash(UA)]));
  const out = new Uint8Array(16 + ct.length);
  out.set(IV); out.set(ct, 16);
  return Buffer.from(out).toString("base64");
}

console.log(xsyn("IPHERE"))
