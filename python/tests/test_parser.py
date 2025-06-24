"""Tests for OpenQASM parser."""

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
