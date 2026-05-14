import base64, struct, time
from functools import lru_cache
from curl_cffi import requests


SBOX_B64 = (
    "Y3x3e/Jrb8UwAWcr/terdsqCyX36WUfwrdSir5ykcsC3/ZMmNj/3zDSl5fFx2DEVBMcjwxiWBZoHEoDi6yeydQmDLBobblqgUjvWsynjL4RT0QD"
    "tIPyxW2rLvjlKTFjP0O+q+0NNM4VF+QJ/UDyfqFGjQI+SnTj1vLbaIRD/89LNDBPsX5dEF8Snfj1kXRlzYIFP3CIqkIhG7rgU3l4L2+AyOgpJBi"
    "RcwtOsYpGV5HnnyDdtjdVOqWxW9Opleq4IunglLhymtMbo3XQfS72LinA+tWZIA/YOYTVXuYbBHZ7h+JgRadmOlJseh+nOVSjfjKGJDb/mQmhBmS0"
    "PsFS7FuJOVPyUwkrMYg1qRjxNi9Fe+mTLtJe+K7x3LgPTGVnBHQZBa1XwmWnqnBiuY9/nuwBzZvuWTIXkOglFqg/uEOstf/QprM+tkY14yJX5L87"
    "NCHqIOFyDKihH27jHk6QSU/+HDjE2IVhIAY43dDLK6bG3qwzXxFZCJgeYYNm2uRFA7CCMvaDJhARJI/FPUB8T3NjAnlfjw3tlOwKPPuglkuUV3f0X"
    "qb/Umn7FOWf+dp1Dp+HQ9WjyGzRwBaOK1XmGqDDGUUsepif2NdJuJBaCX9rmdaLvLLIcn11vgApyRJtskAtbM31aUvNhofew1j98be0U4KU9IrP4i"
    "d5xGq+6tYFSCWrVMDalOL9Ao56B89f7fOM5gpsv/4c0jkNExN7py1R7lDKmwiM97kyVC0L6w04ILqFmKNkksnZboklti9Elcvj2ZIZomBbUpFzMXW"
    "W2kmxwSFD97bnaXhVGV6eNnYSQ2KsAjLzTCvfkWAW4s0UG0Cwej8o/DwLBr70DAROKazqREUFPZ9zql/LPzvC05nOWrHQi5601heL5N+gcdd9uR/E"
    "acR0pxYlvt2IOqhi+G/xWPkvG0nkgmtvA/njNWvQf3agziAfHMbESEFkngOxfYFF/qRm1Sg0t5Xqfk8mc76DgO02uKvWwyOu7PINTmWEXKwR+unfW"
    "JuFpFGNVIQx9MGiZG4e5IXhQOdvhcgliPD5+Xo7xoMyjKh37ttYgxI2BZfWJy513xldDVhfUQBpNwGNs47fIZGpTqjiYDPSb7X8idq/dOgtYZ4gGw"
    "zUNAYuMwuZfAiR1k2Ye5eJU2BDOeugILBKXMqu0Jwoj3+/K2bj63DFr0a0ZSb1Rlu7kqEHa/81Vhja+YVL4uw6CSGma4EeeXARLNBV5JqfeKa6S1"
    "4Tp0rpd88Wwv6Q7cURGK/zrb9X2FP58cFp9/S8YgxalkR8FlXSpwVtKhW0TB09ORbIPyRymvOxzkHvPWY+h+S3ysQCUN5/QLpxuKD+A8D3TJYq150"
    "Kzx+r3TBEzA6KsYA=="
)

TIGER_B64 = (
    "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"
)

_SBOX = bytearray(base64.b64decode(SBOX_B64))
_sb0 = _SBOX[0:256]
_sb1 = _SBOX[256:512]
_sb2 = _SBOX[512:768]
_sb3 = _SBOX[768:1024]

_D_CONST = bytes.fromhex("517cc1b727220a94fe13abe8fa9a6ee0")
_J_CONST = bytes.fromhex("6db14acc9e21c820ff28b1d5ef5de2b0")
_B_CONST = bytes.fromhex("db92371d2126e9700324977504e8c90e")

def _xor_block(a: bytes, b: bytes) -> bytes:
    return bytes(x ^ y for x, y in zip(a, b))

def _sub_c(y: bytes) -> bytes:
    r = bytearray(16)
    for i in range(0, 16, 4):
        r[i]=_sb0[y[i]]; r[i+1]=_sb1[y[i+1]]; r[i+2]=_sb2[y[i+2]]; r[i+3]=_sb3[y[i+3]]
    return bytes(r)

def _sub_i(y: bytes) -> bytes:
    r = bytearray(16)
    for i in range(0, 16, 4):
        r[i]=_sb2[y[i]]; r[i+1]=_sb3[y[i+1]]; r[i+2]=_sb0[y[i+2]]; r[i+3]=_sb1[y[i+3]]
    return bytes(r)

def _mix(y: bytes) -> bytes:
    return bytes([
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
        y[1]^y[2]^y[4]^y[5]^y[8]^y[10]^y[15],
    ])

def _f_round(state: bytes, rk: bytes) -> bytes:
    return _mix(_sub_c(_xor_block(state, rk)))

def _o_round(state: bytes, rk: bytes) -> bytes:
    return _mix(_sub_i(_xor_block(state, rk)))

def _compute_mask(key: bytes, offset: int) -> bytes:
    n = len(key)  # 16
    buf = bytearray(16)
    for i in range(16):
        k1 = (key[i % n] ^ ((offset + i * 41) & 255)) & 255
        k2 = (key[(i * 7 + 3) % n] + offset + i) & 255
        tmp = _sb0[k1] ^ _sb1[k2]
        k4 = (tmp + i * 17 + n) & 255
        buf[i] = tmp ^ _sb2[k4]
    return _mix(bytes(buf))

def _normalize_key(key: bytes) -> bytes:
    n = len(key)  # 16
    L1 = _compute_mask(key, 53)
    L2 = _compute_mask(key, 158)
    L3 = bytearray(n)
    for i in range(n):
        a = key[i] ^ L1[i & 15] ^ L2[(5 * i) & 15]
        b = (29 * i + 7 * n) & 255
        L3[i] = a ^ b
    return bytes(L3)

def _rot128(block: bytes, n: int) -> bytes:
    n = n & 127
    if n == 0:
        return bytes(block)
    byte_shift = n // 8
    bit_shift = n % 8
    b = block
    if bit_shift == 0:
        return bytes(b[(i + byte_shift) % 16] for i in range(16))
    r = bytearray(16)
    for i in range(16):
        lo = b[(i + byte_shift) % 16]
        hi = b[(i + byte_shift + 1) % 16]
        r[i] = ((lo << bit_shift) | (hi >> (8 - bit_shift))) & 0xff
    return bytes(r)

def _rot_y(block: bytes, n: int) -> bytes:
    return _rot128(block, 128 - (127 & n))

def _key_rounds(key_len: int) -> int:
    if key_len == 16: return 12
    if key_len == 24: return 14
    if key_len == 32: return 16
    raise ValueError(f"unsupported key length {key_len}")

def _key_schedule(key: bytes) -> dict:
    orig_key = bytes(key)
    nk = _normalize_key(orig_key)
    e = nk[:16]
    pad = nk[16:] + b'\x00' * (16 - len(nk[16:]))
    g = _xor_block(_f_round(e, _D_CONST), pad)
    d = _xor_block(_o_round(g, _J_CONST), e)
    j = _xor_block(_f_round(d, _B_CONST), g)
    round_keys = [
        _xor_block(e, _rot_y(g, 19)),
        _xor_block(g, _rot_y(d, 19)),
        _xor_block(d, _rot_y(j, 19)),
        _xor_block(_rot_y(e, 19), j),
        _xor_block(e, _rot_y(g, 31)),
        _xor_block(g, _rot_y(d, 31)),
        _xor_block(d, _rot_y(j, 31)),
        _xor_block(_rot_y(e, 31), j),
        _xor_block(e, _rot128(g, 61)),
        _xor_block(g, _rot128(d, 61)),
        _xor_block(d, _rot128(j, 61)),
        _xor_block(_rot128(e, 61), j),
        _xor_block(e, _rot128(g, 31)),
        _xor_block(g, _rot128(d, 31)),
        _xor_block(d, _rot128(j, 31)),
        _xor_block(_rot128(e, 31), j),
        _xor_block(e, _rot128(g, 19)),
    ]
    rounds = _key_rounds(len(orig_key))
    in_mask = _compute_mask(nk, 109)
    out_mask = _compute_mask(orig_key, 199)
    return {'roundKeys': round_keys, 'rounds': rounds, 'inMask': in_mask, 'outMask': out_mask}

def _enc_block(ks: dict, block: bytes) -> bytes:
    rk = ks['roundKeys']
    rounds = ks['rounds']
    s = _xor_block(block, ks['inMask'])
    for i in range(rounds - 1):
        s = _f_round(s, rk[i]) if i % 2 == 0 else _o_round(s, rk[i])
    s = _xor_block(s, rk[rounds - 1])
    s = _sub_i(s)
    s = _xor_block(s, rk[rounds])
    return _xor_block(s, ks['outMask'])

def _encrypt(key: bytes, iv: bytes, pt: bytes) -> bytes:
    ks = _key_schedule(key)
    pad = 16 - (len(pt) % 16) if len(pt) % 16 != 0 else 16
    padded = pt + bytes([pad] * pad)
    out = b""
    prev = iv
    for i in range(0, len(padded), 16):
        blk = _xor_block(padded[i:i+16], prev)
        enc = _enc_block(ks, blk)
        out += enc
        prev = enc
    return out

_YT  = 2781082071
_YT2 = 1805532449

@lru_cache(maxsize=None)
def _build_tiger_tables() -> tuple:
    raw = base64.b64decode(TIGER_B64)
    u32 = [struct.unpack_from("<I", raw, i)[0] for i in range(0, len(raw), 4)]
    def tbl(idx: int) -> list:
        off = idx * 512
        t = []
        for i in range(0, 512, 2):
            hi = (u32[off+i] ^ _YT) & 0xFFFFFFFF
            lo = (u32[off+i+1] ^ _YT2) & 0xFFFFFFFF
            t.append((hi << 32) | lo)
        return t
    return tbl(0), tbl(1), tbl(2), tbl(3)

def _uN(v: int) -> int:
    return v & 0xFFFFFFFFFFFFFFFF

def _tN(h: int, l: int) -> int:
    return (((h ^ _YT) & 0xFFFFFFFF) << 32) | ((l ^ _YT2) & 0xFFFFFFFF)

def _byt(n: int, i: int) -> int:
    return (n >> (i * 8)) & 0xff

def _tE(tables: tuple, a: int, b: int, c: int, w: int, m: int) -> tuple:
    TD, TJ, TB, Ti = tables
    c = _uN(c ^ w)
    a = _uN(a - (TD[_byt(c,0)] ^ TJ[_byt(c,2)] ^ TB[_byt(c,4)] ^ Ti[_byt(c,6)]))
    b = _uN((b + (Ti[_byt(c,1)] ^ TB[_byt(c,3)] ^ TJ[_byt(c,5)] ^ TD[_byt(c,7)])) * m)
    return a, b, c

def _tH(x: list) -> list:
    YB = 0xFFFFFFFFFFFFFFFF
    YO = _tN(6706290, -834955132)
    YC = _tN(-1528777552, -499781426)
    x0,x1,x2,x3,x4,x5,x6,x7 = x
    x0=_uN(x0-(x7^YO)); x1=_uN(x1^x0); x2=_uN(x2+x1)
    x3=_uN(x3-(x2^((~x1<<19)&YB))); x4=_uN(x4^x3); x5=_uN(x5+x4)
    x6=_uN(x6-(_uN(x5^(_uN(~x4)>>23)))); x7=_uN(x7^x6); x0=_uN(x0+x7)
    x1=_uN(x1-(x0^((~x7<<19)&YB))); x2=_uN(x2^x1); x3=_uN(x3+x2)
    x4=_uN(x4-(_uN(x3^(_uN(~x2)>>23)))); x5=_uN(x5^x4); x6=_uN(x6+x5)
    x7=_uN(x7-(x6^YC))
    return [x0,x1,x2,x3,x4,x5,x6,x7]

def _tR(tables: tuple, a: int, b: int, c: int, ws: list, m: int) -> tuple:
    a,b,c = _tE(tables,a,b,c,ws[0],m); b,c,a = _tE(tables,b,c,a,ws[1],m)
    c,a,b = _tE(tables,c,a,b,ws[2],m); a,b,c = _tE(tables,a,b,c,ws[3],m)
    b,c,a = _tE(tables,b,c,a,ws[4],m); c,a,b = _tE(tables,c,a,b,ws[5],m)
    a,b,c = _tE(tables,a,b,c,ws[6],m); b,c,a = _tE(tables,b,c,a,ws[7],m)
    return a, b, c

def _tpad(data: bytes) -> list:
    Q, Z, n = [], 0, 0
    for byte in data:
        Z |= byte << ((n & 7) * 8)
        n += 1
        if (n & 7) == 0:
            Q.append(Z); Z = 0
    Z |= 1 << ((n & 7) * 8)
    Q.append(Z)
    while (len(Q) & 7) != 7:
        Q.append(0)
    Q.append((n * 8) & 0xFFFFFFFFFFFFFFFF)
    return Q

def _thex(v: int) -> str:
    h = format(v & 0xFFFFFFFFFFFFFFFF, '016x')
    return ''.join(h[i:i+2] for i in range(14, -1, -2))

def _tiger(s: str) -> str:
    tables = _build_tiger_tables()
    Q = _tpad(s.encode('utf-8'))
    YU = _tN(-1528777552, -499781426)
    YP = _tN(1528777551, 499781425)
    YF = _tN(1431655523, -1473454938)
    a, b, c = YU, YP, YF
    for i in range(0, len(Q), 8):
        ws = Q[i:i+8]
        sa, sb, sc = a, b, c
        a,b,c = _tR(tables,a,b,c,ws,5)
        ws = _tH(ws)
        c,a,b = _tR(tables,c,a,b,ws,7)
        ws = _tH(ws)
        b,c,a = _tR(tables,b,c,a,ws,9)
        a=_uN(a^sa); b=_uN(b-sb); c=_uN(c+sc)
    return _thex(a) + _thex(b) + _thex(c)

def _serialize(fields: list) -> bytes:
    out = bytearray()

    def varint(v: int):
        v &= 0xFFFFFFFF
        while v >= 128:
            out.append((v & 127) | 128)
            v >>= 7
        out.append(v)

    def field(n: int, wt: int):
        varint((n << 3) | wt)

    def pb_str(n: int, s: str):
        encoded = s.encode('utf-8')
        field(n, 2); varint(len(encoded))
        out.extend(encoded)

    def varint64(v: int):
        v &= 0xFFFFFFFFFFFFFFFF
        while v >= 128:
            out.append((v & 127) | 128)
            v >>= 7
        out.append(v)

    field(1, 0); varint(1 if fields[0] else 0)
    if fields[1]: pb_str(2, fields[1])
    if fields[2]: pb_str(3, fields[2])
    if fields[3]: pb_str(4, fields[3])
    if len(fields) > 4 and fields[4] is not None:
        field(5, 0); varint64(fields[4])
    return bytes(out)


_KEY = b"syn-key-4f8a91c2"
_IV  = b"syn-iv--7bd03e6a"
_UA  = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"


class Xsyn:
    def __init__(self):
        self._ua_hash = _tiger(_UA)

    def generate(self, ip: str, csrf_token: str, ts: int = None) -> str:
        if ts is None:
            ts = int(time.time() * 1000)
        iv = bytes.fromhex(csrf_token.replace("-", "")) if csrf_token else _IV
        pt = _serialize([False, "synthient.com", f"{ip} - IP Intelligence", self._ua_hash, ts])
        ct = _encrypt(_KEY, iv, pt)
        return base64.b64encode(iv + ct).decode()


if __name__ == "__main__":

    print(Xsyn().generate("IPHERE", "CSRFTOKEN")) # apply a timestamp if you wanna regenerate, otherwise it just generates automatically
