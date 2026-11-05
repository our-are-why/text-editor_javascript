# Escapes for line separators

When Claude writes the escapes `\u2028` or `\u2029` into a file, with Write,
Edit or a heredoc, they can land as the raw LINE SEPARATOR and PARAGRAPH
SEPARATOR characters instead of the six-character escapes. A raw one inside a
regex literal ends it: Bun reports a Syntax Error, though `tsc` accepts it,
and VS Code warns of unusual line terminators.

After writing either escape:

- check: `grep -rlP '[\x{2028}\x{2029}]' <files>`
- fix: `perl -CSD -pi -e 's/\x{2028}/\\u2028/g; s/\x{2029}/\\u2029/g' <file>`
- run `bun test`, not only `bun run check`, which misses it.

To change a line that already holds the escapes, move or edit it with perl
rather than retyping them.
