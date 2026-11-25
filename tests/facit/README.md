# Facit files

Each file holds the fingerprints of everything the library decodes from one ROM. Files are named after the first 10 characters of the ROM's SHA-1, so your ROM files can be named anything.

| Facit file | ROM |
|---|---|
| `b18c4e2cc9.txt` | Cactus Canyon, cc_g11.1_2 |
| `adaf6b07d2.txt` | Cactus Canyon, cc_g11.1_3 |
| `b33baabf4f.txt` | Cirqus Voltaire, cirq_14 |
| `37c01f8c6e.txt` | cpu-u6l2 |
| `ab323980b9.txt` | Fish Tales, fshtl_5 |
| `68f08120fb.txt` | Dirty Harry, harr_lx2 |
| `733740645f.txt` | Junk Yard, jy_cpu.03 |
| `fbd8b37c12.txt` | Junk Yard, jy_g11.1_2 |
| `57952f3184.txt` | Attack from Mars, mars1_1 |
| `e24d801ed9.txt` | Monster Bash, mb_g11.1_0 |
| `3922df00e7.txt` | Medieval Madness, mm_g11.1_0 |

## When a test fails

The diff shows which line changed: a font (`font 3 …`) or a full frame image (`17: …`).

- If the change was **not** intended, the code change broke something.
- If the change **was** intended (for example a bug fix), run `npm run test:update`, check the diff in git, and explain the change in the pull request and in `CHANGELOG.md`.

A ROM without a facit file gets one written the first time the tests run.
