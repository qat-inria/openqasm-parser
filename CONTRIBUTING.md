# Contributing

Thank you for your interest in OpenQASM parser!

## Motivation

ANTLR4 can automatically derive parser implementations from the specification. The purpose of this repository is to provide ready-to-use packages with these implementations.

## Scope

The specification itself is retrieved from the [OpenQASM repository](https://github.com/openqasm/openqasm/) and the parsers are generated automatically by ANTLR4. The code that is maintained in this repository consists of the recipes executed by the continuous integration for making this retrieval, invoking ANTLR4 to generate the parsers, and packaging the generated modules.
