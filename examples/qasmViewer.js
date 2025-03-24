import antlr4 from "antlr4";
import qasm3Lexer from "qasm3Lexer";
import qasm3Parser from "qasm3Parser";

export default function drawQASMCircuit(input, circuitDiv) {
    const chars = new antlr4.InputStream(input);
    const lexer = new qasm3Lexer(chars);
    const tokens  = new antlr4.CommonTokenStream(lexer);
    const parser = new qasm3Parser(tokens);
    parser.buildParseTrees = true;
    const tree = parser.program();
    const rule_version = parser.ruleNames.indexOf("version");
    const rule_statement = parser.ruleNames.indexOf("statement");
    const rule_statementOrScope = parser.ruleNames.indexOf("statementOrScope");
    const rule_includeStatement = parser.ruleNames.indexOf("includeStatement");
    const rule_oldStyleDeclarationStatement =  parser.ruleNames.indexOf("oldStyleDeclarationStatement");
    const rule_gateCallStatement = parser.ruleNames.indexOf("gateCallStatement");
    const rule_designator = parser.ruleNames.indexOf("designator");
    const rule_indexedIdentifier = parser.ruleNames.indexOf("indexedIdentifier");
    const symbol_QREG = parser.symbolicNames.indexOf("QREG");
    const symbol_CREG = parser.symbolicNames.indexOf("CREG");
    const symbol_DecimalIntegerLiteral = parser.symbolicNames.indexOf("DecimalIntegerLiteral");
    const symbol_FloatLiteral = parser.symbolicNames.indexOf("FloatLiteral");
    const symbol_ASTERISK = parser.symbolicNames.indexOf("ASTERISK");
    const symbol_SLASH = parser.symbolicNames.indexOf("SLASH");
    const symbol_Identifier = parser.symbolicNames.indexOf("Identifier");
    function evaluate_expression(expr) {
        if (expr.children[0].symbol == undefined) {
            throw new Error(`Unknown expression: ${expr}`)
        }
        else {
            if (expr.children[0].symbol.type == symbol_DecimalIntegerLiteral) {
                return parseInt(expr.children[0].symbol.text)
            }
            else {
                throw new Error(`Unknown symbol: ${expr.children[0]}`)
            }
        }
    }
    function format_expression(expr) {
        if (expr.children.length == 3) {
            const lhs = format_expression(expr.children[0]);
            const rhs = format_expression(expr.children[2]);
            if (expr.children[1].symbol.type == symbol_SLASH) {
                return `${lhs}/${rhs}`
            }
            else if (expr.children[1].symbol.type == symbol_ASTERISK) {
                return `${lhs}·${rhs}`
            }
        }
        else {
            if (expr.children[0].symbol.type == symbol_DecimalIntegerLiteral || expr.children[0].symbol.type == symbol_FloatLiteral) {
                return expr.children[0].symbol.text
            }
            else if (expr.children[0].symbol.type == symbol_Identifier) {
                const identifier = expr.children[0].symbol.text;
                if (identifier == "pi") {
                    return "π"
                }
                else {
                    throw new Error(`Unknown identifier: ${identifier}`)
                }
            }
            else {
                throw new Error(`Unknown symbol: ${expr.children[0]}`)
            }
        }
    }
    const qubits = [];
    const qubit_dict = {};
    const operations = [];
    function fresh_qubit() {
        const index = qubits.length;
        const qubit = { id: index };
        qubits.push(qubit);
        return qubit;
    }
    function get_qubit(operand) {
        if (operand.ruleIndex == rule_indexedIdentifier) {
            const identifier = operand.Identifier().getText();
            const index = evaluate_expression(operand.children[1].children[1]);
            return qubit_dict[identifier][index];
        }
        else {
            console.log(operand);
            throw new Error("get_qubit");
        }
    }
    for (const [i, child] of tree.children.entries()) {
        if (i == tree.children.length - 1) {
            // EOF
        }
        else if (i == 0 && child.ruleIndex == rule_version) {
            const version = child.VersionSpecifier().getText();
            if (version != "2.0") {
                throw new Error(`Unknown OpenQASM version: ${version}`)
            }
        }
        else if (child.ruleIndex == rule_statementOrScope) {
            const statementOrScope = child.children[0];
            if (statementOrScope.ruleIndex == rule_statement) {
                const statement = statementOrScope.children[0];
                if (statement.ruleIndex == rule_includeStatement) {
                    // ignored
                }
                else if (statement.ruleIndex == rule_oldStyleDeclarationStatement) {
                    const kind = statement.children[0];
                    if (kind.symbol.type == symbol_CREG) {
                        // ignored
                    }
                    else if (kind.symbol.type == symbol_QREG) {
                        const identifier = statement.Identifier().getText();
                        const designator = statement.designator();
                        if (designator) {
                            const count = evaluate_expression(designator.expression());
                            qubit_dict[identifier] = Array.from({length: count}, (_, i) => (fresh_qubit()));
                        }
                        else {
                            qubit_dict[identifier] = fresh_qubit();
                        }
                    }
                    else {
                        throw new Error(`Unknown kind: ${kind}`)
                    }
                }
                else if (statement.ruleIndex == rule_gateCallStatement) {
                    const gate = statement.Identifier().getText();
                    if (gate == "rz" || gate == "rx") {
                        const operands = statement.gateOperandList();
                        const q = get_qubit(operands.children[0].children[0]);
                        operations.push(
                            {
                                gate: gate.toUpperCase(),
                                targets: [{ qId: q.id }],
                                displayArgs: format_expression(statement.expressionList().children[0])
                            }
                        );
                    }
                    else if (gate == "cx") {
                        const operands = statement.gateOperandList();
                        const q0 = get_qubit(operands.children[0].children[0]);
                        const q1 = get_qubit(operands.children[2].children[0]);
                        operations.push(
                            {
                                gate: 'X',
                                isControlled: true,
                                controls: [{ qId: q0.id }],
                                targets: [{ qId: q1.id }]
                            }
                        );
                    }
                    else {
                        throw new Error(`Unexpected gate: ${gate}`)
                    }
                }
                else {
                    throw new Error(`Unexpected statement: ${child}`)
                }
            }
            else {
                throw new Error(`Unexpected element: ${child}`)
            }
        }
        else {
            throw new Error(`Unexpected element: ${child}`)
        }
    }
    const circuit = {
        qubits: qubits,
        operations: operations
    };
    qviz.draw(circuit, circuitDiv, qviz.STYLES['Default']);
}
