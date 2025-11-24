"""Tests for OpenQASM parser."""

from antlr4 import CommonTokenStream, InputStream
from openqasm_parser import qasm3Lexer, qasm3Parser, qasm3ParserVisitor


def example() -> str:
    return """
OPENQASM 2.0;
include "qelib1.inc";
qreg q1[8];
creg c0[1];
rz(5*pi/4) q1[0];
rx(3*pi/4) q1[0];
c0 = measure q1[0];
"""


def get_parser() -> qasm3Parser:
    lexer = qasm3Lexer(InputStream(example()))
    stream = CommonTokenStream(lexer)
    return qasm3Parser(stream)


def test_parser() -> None:
    parser = get_parser()
    tree = parser.program()
    assert isinstance(tree, qasm3Parser.ProgramContext)


class MeasureVisitor(qasm3ParserVisitor):
    def __init__(self) -> None:
        self.accu = []

    def visitMeasureExpression(self, ctx: qasm3Parser.MeasureExpressionContext) -> None:
        self.accu.append(ctx.gateOperand().indexedIdentifier().Identifier().getText())
        return self.visitChildren(ctx)


def test_parser_visitor() -> None:
    parser = get_parser()
    tree = parser.program()
    visitor = MeasureVisitor()
    tree.accept(visitor)
    assert visitor.accu == ["q1"]
