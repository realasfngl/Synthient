# x-syn

Reverse engineering of Synthient's `x-syn` anti-bot header. Includes a clean reimplementation of the custom block cipher, Tiger-192 hash, and protobuf serialization in both Python and JavaScript.

## Overview

Synthient embeds an obfuscated SDK (`synthient.js`) into sites that generates an `x-syn` header with every request. The header contains an encrypted fingerprint of the browser environment, which the server uses to detect bots.

The token format is:

```
base64( IV[16] || CBC_encrypt( protobuf_payload ) )
```

The protobuf payload contains 4 fields:

| Field | Type | Value |
|-------|------|-------|
| 1 | bool | `isBot` |
| 2 | string | `location.hostname` |
| 3 | string | `document.title` |
| 4 | string | Tiger-192 hash of `navigator.userAgent` (48-char hex) |

## Cipher

Not AES — a custom 18-round Feistel block cipher operating in CBC mode with PKCS7 padding. It uses two 256-byte S-boxes with alternating order per round, GF(2^8) mixing, and an LFSR-based key schedule with a 128-bit state permutation.

The key and IV are hardcoded and identical for all clients, just obfuscated via byte arithmetic in the source:

```
key = syn-key-4f8a91c2
iv  = syn-iv--7bd03e6a
```

Since the key is global and static, any captured token can be decrypted.

## Bot Detection

`isBot` is set to `true` if `navigator.webdriver === true` or the user-agent contains any of:

```
bot, crawl, spider, headless, phantom, selenium, puppeteer, playwright, webdriver, cypress
```

These strings are stored encrypted in the SDK and decrypted at runtime by VM function 23 using an LCG-keyed XOR cipher (seed `167`).

## The VM

All fingerprinting logic runs inside a stack-based bytecode interpreter (~2516 bytes, 24 functions, ~80 opcodes). Each opcode byte is XORed with a position-based mask derived from environment byte `g`, which is computed from a ~200ms timing loop and native function integrity checks. If a debugger is attached or natives are patched, `g` gets corrupted and the VM silently executes garbage — no errors thrown.

Other anti-tamper: FNV-1a integrity check on bytecode and string constants, verification of `Function.prototype.apply/toString` and `Reflect.construct`, and a Proxy canary for detecting property enumeration.

## Usage

**Python:**
```python
from xsyn import Xsyn
print(Xsyn().generate("1.2.3.4"))
```

**Node:**
```js
const { xsyn } = require('./xsyn');
console.log(xsyn("1.2.3.4"));
```

If you're actually using this in requests, you'll figure out where to plug it in.

## Disclaimer

This is for educational purposes only. Use responsibly.
