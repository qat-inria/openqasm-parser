# Lexer and parser generated from OpenQASM specification.

This package contains a lexer and a parser generated from
[OpenQASM specification](https://github.com/openqasm/openqasm).

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
