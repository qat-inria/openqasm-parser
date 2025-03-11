# Parsers generated from OpenQASM specification

This repository generates parsers from [OpenQASM specification](https://github.com/openqasm/openqasm).

Generated parsers are available as assets in
[releases](https://github.com/qat-inria/openqasm-parser/releases), and
ready-to-use JavaScript parsers are hosted on
[GitHub Pages](https://qat-inria.github.io/openqasm-parser/).

To use the generated parsers in a web page, include the following snippet:
```html
<script type="importmap">
    {
        "imports": {
            "antlr4": "https://unpkg.com/antlr4@4.13.2/dist/antlr4.web.mjs",
            "qasm3Lexer": "https://qat-inria.github.io/openqasm-parser/openqasm-javascript-parser-v3.1.0/qasm3Lexer.js",
            "qasm3Parser": "https://qat-inria.github.io/openqasm-parser/openqasm-javascript-parser-v3.1.0/qasm3Parser.js"
        }
    }
</script>
```

For a usage example, see [examples/qasm_viewer.html](examples/qasm_viewer.html) ([source](examples/qasm_viewer.html)|[result](https://qat-inria.github.io/openqasm-parser/examples/qasm_viewer.html)).
