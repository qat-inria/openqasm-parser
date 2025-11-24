# Lexer and parser generated from OpenQASM specification.

This package contains a lexer and a parser generated from
[OpenQASM specification](https://github.com/openqasm/openqasm).

It exposes three classes: `qasm3Lexer`, `qasm3Parser`, and `qasm3ParserVisitor`.

Instances of `qasm3Lexer` should be initialized with an `antlr4.InputStream`.

## Example: Parsing an OpenQASM program from a string

```python
from antlr4 import CommonTokenStream, InputStream
from openqasm_parser import qasm3Lexer, qasm3Parser

def test_parser() -> None:
    input_text = """
OPENQASM 2.0;
include "qelib1.inc";
qreg q1[8];
creg c0[1];
rz(5*pi/4) q1[0];
rx(3*pi/4) q1[0];
c0 = measure q1[0];
"""
    lexer = qasm3Lexer(InputStream(input_text))
    stream = CommonTokenStream(lexer)
    parser = qasm3Parser(stream)
    tree = parser.program()
    assert isinstance(tree, qasm3Parser.ProgramContext)
```

To parse an OpenQASM file, we can use `antlr4.FileStream(filename)`, which is a subclass of `InputStream`.

The `tree` returned by the parser conforms to the
[OpenQASM grammar](https://github.com/openqasm/openqasm/blob/main/source/grammar/qasm3Parser.g4).

## Using a Visitor to Traverse the Parse Tree

You can derive from `qasm3ParserVisitor` to visit specific nodes in the parse tree. For example, the following visitor collects the identifiers of all measured qubits:

```python
from openqasm_parser import qasm3ParserVisitor

class MeasureVisitor(qasm3ParserVisitor):
    def __init__(self):
        self.accu = []

    def visitMeasureExpression(self, ctx: qasm3Parser.MeasureExpressionContext):
        self.accu.append(ctx.gateOperand().indexedIdentifier().Identifier().getText())
        return self.visitChildren(ctx)
```

Visitors are applied using the `accept` method of the parse tree:

```python
visitor = MeasureVisitor()
tree.accept(visitor)
assert visitor.accu == ["q1"]
```
