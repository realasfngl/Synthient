from __future__ import annotations
import base64
import struct


class XSyn:
    SBOX_B64 = (
        "V0nRxi8zdPuVbYLqDrCoHCjQS5Jc7oWxxAp2PWP5F6+/oRll93oyIAbO5IOdW0zYQl0u6NSbDxM8iWfAcaq29aS+"
        "/YwSAJfaeOHPazlDVSYwmMzd61Szj04W+iKldwlh1ipTN0XBbK7vcAiZix3ytOnHn0oxJf5806K9VhSIYAvN4jRQ"
        "ntwRBSu3qUj/ZopzA3WG8WqnQMK5LNsfWJQ+7fwboAS4jeZZYpM1fsoh30cV87p/pmnITYc7nAHg3iRSewxoHoCy"
        "Wuet1SP0Rj+RyW6EcrsNGNmW8F9BrCfF4zqBbwejefYtOBpEXrXS7MuQmjblKcNPq2RR+BDXvAJ9jmzaw+lOnQo9"
        "uDa0OBM0DNm/dJSPt5zl3J4HSU+YLLCTEuvNs5LnQWDjISc75hnSDpERxz8qjqG8K8jFD1vzh4v79d4gxqeEzthl"
        "Ucmk70NTJV2bMeg+DdeA/2mKugtzXG5UFWL2NTBSoxbTKDL6ql7P6u14M1gJe2PAwUYe36mZVQTEhjl3guxAGJCX"
        "Wd2DH5o3BiRkfKVWSAiF0GEmym9+arZxoHAF0UWMIxzw7omtekvCL9taTXZnFy30y7FKqLUiRzrVEExyzAD54P3i"
        "/q74X6vxG0KB1r5EKaZXua/y1HVmu2ifUAIBPH+NGoi9rPfkeZai/G2yawPhLn0UlR0="
    )

    TIGER_B64 = (
        "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"
    )

    KEY = b"syn-key-4f8a91c2"
    IV = b"syn-iv--7bd03e6a"
    UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"

    MASK32 = 0xFFFFFFFF
    MASK64 = 0xFFFFFFFFFFFFFFFF
    YT = 2781082071
    YTC = 1805532449

    def __init__(self):
        sbox = base64.b64decode(self.SBOX_B64)
        self.sbox0 = sbox[:256]
        self.sbox1 = sbox[256:512]
        self._init_tiger_tables()
        self.yU = self._tn(-1528777552, -499781426)
        self.yP = self._tn(1528777551, 499781425)
        self.yf = self._tn(1431655523, -1473454938)
        self.yO = self._tn(6706290, -834955132)
        self.yC = self._tn(-1528777552, -499781426)

    def _init_tiger_tables(self):
        raw = base64.b64decode(self.TIGER_B64)
        words = list(struct.unpack("<2048I", raw))

        def build(idx):
            off = idx * 512
            t = [0] * 256
            for i in range(0, 512, 2):
                hi = (words[off + i] ^ self.YT) & self.MASK32
                lo = (words[off + i + 1] ^ self.YTC) & self.MASK32
                t[i >> 1] = (hi << 32) | lo
            return t

        self.TD = build(0)
        self.TJ = build(1)
        self.TB = build(2)
        self.Ti = build(3)

    def _tn(self, hi, lo):
        return (((hi ^ self.YT) & self.MASK32) << 32) | ((lo ^ self.YTC) & self.MASK32)

    @staticmethod
    def _gf_mul(a, b):
        r = 0
        p = a & 0xFF
        m = b & 0xFF
        for _ in range(8):
            if m & 1:
                r ^= p
            hi = p & 0x80
            p = (p << 1) & 0xFF
            if hi:
                p ^= 0x1D
            m >>= 1
        return r & 0xFF

    @staticmethod
    def _u2b(v):
        v &= 0xFFFFFFFF
        return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]

    @staticmethod
    def _b2u(b0, b1, b2, b3):
        return ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) & 0xFFFFFFFF

    def _g0(self, rk, sw):
        b = self._u2b((rk ^ sw) & self.MASK32)
        s0 = self.sbox0[b[0]]
        s1 = self.sbox1[b[1]]
        s2 = self.sbox0[b[2]]
        s3 = self.sbox1[b[3]]
        gm = self._gf_mul
        return self._b2u(
            s0 ^ gm(2, s1) ^ gm(4, s2) ^ gm(6, s3),
            gm(2, s0) ^ s1 ^ gm(6, s2) ^ gm(4, s3),
            gm(4, s0) ^ gm(6, s1) ^ s2 ^ gm(2, s3),
            gm(6, s0) ^ gm(4, s1) ^ gm(2, s2) ^ s3,
        )

    def _g1(self, rk, sw):
        b = self._u2b((rk ^ sw) & self.MASK32)
        s0 = self.sbox1[b[0]]
        s1 = self.sbox0[b[1]]
        s2 = self.sbox1[b[2]]
        s3 = self.sbox0[b[3]]
        gm = self._gf_mul
        return self._b2u(
            s0 ^ gm(8, s1) ^ gm(2, s2) ^ gm(10, s3),
            gm(8, s0) ^ s1 ^ gm(10, s2) ^ gm(2, s3),
            gm(2, s0) ^ gm(10, s1) ^ s2 ^ gm(8, s3),
            gm(10, s0) ^ gm(2, s1) ^ gm(8, s2) ^ s3,
        )

    @staticmethod
    def _lfsr_step(v):
        v &= 0xFFFF
        if v & 1:
            return ((((v ^ 0xA831) >> 1) | 0x8000)) & 0xFFFF
        return (v >> 1) & 0xFFFF

    @staticmethod
    def _rot16(v, s):
        v &= 0xFFFF
        return ((v << s) | (v >> (16 - s))) & 0xFFFF

    def _gen_consts(self):
        r = []
        s = 17034
        for _ in range(30):
            r.append((((s ^ 47073) & 0xFFFF) << 16) | self._rot16(~s, 1))
            r.append(((((~s) & 0xFFFF) ^ 9279) << 16) | self._rot16(s, 8))
            s = self._lfsr_step(s)
        return r

    @staticmethod
    def _ex_bits(p, a, b):
        return (p >> (128 - b - 1)) & ((1 << (b - a + 1)) - 1)

    def _permute128(self, st):
        p = 0
        for w in st:
            p = (p << 32) | (w & self.MASK32)
        x = self._ex_bits(p, 7, 63)
        x = (x << 7) | self._ex_bits(p, 121, 127)
        x = (x << 7) | self._ex_bits(p, 0, 6)
        x = (x << 57) | self._ex_bits(p, 64, 120)
        return [
            (x >> 96) & self.MASK32,
            (x >> 64) & self.MASK32,
            (x >> 32) & self.MASK32,
            x & self.MASK32,
        ]

    def _feistel(self, rks, n, st):
        a, w, x, g = st
        for i in range(n):
            w = (w ^ self._g0(rks[2 * i], a)) & self.MASK32
            g = (g ^ self._g1(rks[2 * i + 1], x)) & self.MASK32
            a, w, x, g = w, x, g, a
        return [g, a, w, x]

    def _key_schedule(self, key):
        C = self._gen_consts()
        st = self._feistel(C[:24], 12, key)
        sk = []
        for r in range(9):
            t = [(st[j] ^ C[24 + 4 * r + j]) & self.MASK32 for j in range(4)]
            st = self._permute128(st)
            if r & 1:
                for j in range(4):
                    t[j] = (t[j] ^ key[j]) & self.MASK32
            sk.extend(t)
        return key[:], sk

    @staticmethod
    def _bytes_to_words(b):
        return [int.from_bytes(b[i:i + 4], "big") for i in range(0, len(b), 4)]

    @staticmethod
    def _words_to_bytes(arr):
        return b"".join(v.to_bytes(4, "big") for v in arr)

    def _enc_block(self, key, block):
        kw = self._bytes_to_words(key)
        bw = self._bytes_to_words(block)
        kc, sk = self._key_schedule(kw)
        pre = [bw[0], (bw[1] ^ kc[0]) & self.MASK32, bw[2], (bw[3] ^ kc[1]) & self.MASK32]
        res = self._feistel(sk, 18, pre)
        return self._words_to_bytes([
            res[0],
            (res[1] ^ kc[2]) & self.MASK32,
            res[2],
            (res[3] ^ kc[3]) & self.MASK32,
        ])

    def encrypt_cbc(self, key, iv, pt):
        pad = 16 if len(pt) % 16 == 0 else 16 - len(pt) % 16
        padded = pt + bytes([pad] * pad)
        out = bytearray()
        prev = iv
        for i in range(0, len(padded), 16):
            blk = bytes(padded[i + j] ^ prev[j] for j in range(16))
            enc = self._enc_block(key, blk)
            out.extend(enc)
            prev = enc
        return bytes(out)

    @staticmethod
    def _byt(n, i):
        return (n >> (i * 8)) & 0xFF

    def _t_e(self, a, b, c, w, m):
        c = (c ^ w) & self.MASK64
        a = (a - (self.TD[self._byt(c, 0)] ^ self.TJ[self._byt(c, 2)]
                  ^ self.TB[self._byt(c, 4)] ^ self.Ti[self._byt(c, 6)])) & self.MASK64
        b = ((b + (self.Ti[self._byt(c, 1)] ^ self.TB[self._byt(c, 3)]
                   ^ self.TJ[self._byt(c, 5)] ^ self.TD[self._byt(c, 7)])) * m) & self.MASK64
        return a, b, c

    def _t_h(self, x0, x1, x2, x3, x4, x5, x6, x7):
        M = self.MASK64
        x0 = (x0 - (x7 ^ self.yO)) & M
        x1 = (x1 ^ x0) & M
        x2 = (x2 + x1) & M
        x3 = (x3 - (x2 ^ ((~x1 << 19) & M))) & M
        x4 = (x4 ^ x3) & M
        x5 = (x5 + x4) & M
        x6 = (x6 - (x5 ^ ((~x4 & M) >> 23))) & M
        x7 = (x7 ^ x6) & M
        x0 = (x0 + x7) & M
        x1 = (x1 - (x0 ^ ((~x7 & M) << 19) & M)) & M
        x2 = (x2 ^ x1) & M
        x3 = (x3 + x2) & M
        x4 = (x4 - (x3 ^ ((~x2 & M) >> 23))) & M
        x5 = (x5 ^ x4) & M
        x6 = (x6 + x5) & M
        x7 = (x7 - (x6 ^ self.yC)) & M
        return x0, x1, x2, x3, x4, x5, x6, x7

    def _t_r(self, a, b, c, ws, m):
        a, b, c = self._t_e(a, b, c, ws[0], m)
        b, c, a = self._t_e(b, c, a, ws[1], m)
        c, a, b = self._t_e(c, a, b, ws[2], m)
        a, b, c = self._t_e(a, b, c, ws[3], m)
        b, c, a = self._t_e(b, c, a, ws[4], m)
        c, a, b = self._t_e(c, a, b, ws[5], m)
        a, b, c = self._t_e(a, b, c, ws[6], m)
        b, c, a = self._t_e(b, c, a, ws[7], m)
        return a, b, c

    @staticmethod
    def _t_pad(data):
        Q = []
        Z = 0
        n = 0
        for ch in data:
            Z |= ch << ((7 & n) << 3)
            n += 1
            if (7 & n) == 0:
                Q.append(Z)
                Z = 0
        Z |= 0x01 << ((7 & n) << 3)
        Q.append(Z)
        while (len(Q) & 7) != 7:
            Q.append(0)
        Q.append((n << 3) & 0xFFFFFFFFFFFFFFFF)
        return Q

    @staticmethod
    def _t_hex(v):
        h = f"{v:016x}"
        r = ""
        for i in range(14, -1, -2):
            r += h[i:i + 2]
        return r

    def tiger_hash(self, s):
        Q = self._t_pad(s.encode("utf-8"))
        a, b, c = self.yU, self.yP, self.yf
        for i in range(0, len(Q), 8):
            w0, w1, w2, w3, w4, w5, w6, w7 = Q[i:i + 8]
            sa, sb, sc = a, b, c
            a, b, c = self._t_r(a, b, c, [w0, w1, w2, w3, w4, w5, w6, w7], 5)
            w0, w1, w2, w3, w4, w5, w6, w7 = self._t_h(w0, w1, w2, w3, w4, w5, w6, w7)
            c, a, b = self._t_r(c, a, b, [w0, w1, w2, w3, w4, w5, w6, w7], 7)
            w0, w1, w2, w3, w4, w5, w6, w7 = self._t_h(w0, w1, w2, w3, w4, w5, w6, w7)
            b, c, a = self._t_r(b, c, a, [w0, w1, w2, w3, w4, w5, w6, w7], 9)
            a = (a ^ sa) & self.MASK64
            b = (b - sb) & self.MASK64
            c = (c + sc) & self.MASK64
        return self._t_hex(a) + self._t_hex(b) + self._t_hex(c)

    @staticmethod
    def _serialize(flag, *strs):
        buf = bytearray()

        def varint(v):
            v &= 0xFFFFFFFF
            while v >= 128:
                buf.append((v & 0x7F) | 0x80)
                v >>= 7
            buf.append(v)

        def field(n, wt):
            varint((n << 3) | wt)

        def write_str(n, s):
            data = s.encode("utf-8")
            field(n, 2)
            varint(len(data))
            buf.extend(data)

        field(1, 0)
        varint(1 if flag else 0)
        for i, s in enumerate(strs, start=2):
            if s:
                write_str(i, s)
        return bytes(buf)

    def generate(self, ip):
        payload = self._serialize(
            False,
            "synthient.com",
            f"{ip} - IP Intelligence",
            self.tiger_hash(self.UA),
        )
        ct = self.encrypt_cbc(self.KEY, self.IV, payload)
        return base64.b64encode(self.IV + ct).decode("ascii")


if __name__ == "__main__":
    print(XSyn().generate("IPHERE"))