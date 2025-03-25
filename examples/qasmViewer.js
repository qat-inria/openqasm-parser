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
    const rule_assignmentStatement = parser.ruleNames.indexOf("assignmentStatement");
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
        if (expr.children.length == 3) {
            const lhs = evaluate_expression(expr.children[0]);
            const rhs = evaluate_expression(expr.children[2]);
            if (expr.children[1].symbol.type == symbol_SLASH) {
                return lhs / rhs;
            }
            else if (expr.children[1].symbol.type == symbol_ASTERISK) {
                return lhs * rhs;
            }
        }
        else {
            if (expr.children[0].symbol.type == symbol_DecimalIntegerLiteral) {
                return parseInt(expr.children[0].symbol.text);
            }
            else if (expr.children[0].symbol.type == symbol_FloatLiteral) {
                return parseFloat(expr.children[0].symbol.text);
            }
            else if (expr.children[0].symbol.type == symbol_Identifier) {
                const identifier = expr.children[0].symbol.text;
                if (identifier == "pi") {
                    return Math.PI;
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
    function gcd(a, b) {
        while (b != 0) {
            const m = a % b;
            a = b;
            b = m;
        }
        return a;
    }
    function format_expression(expr) {
        const value = evaluate_expression(expr);
        const value_over_pi = value / Math.PI;
        if (Math.abs((value_over_pi * 16) % 1) < 0.00001) {
            const num = Math.round(value_over_pi * 16);
            const denom = 16;
            const d = gcd(num, denom);
            const rnum = num / d;
            const rdenom = denom / d;
            if (rdenom == 1) {
                if (rnum == 1) {
                    return "π";
                }
                else {
                    return `${rnum}π`;
                }
            }
            else {
                if (rnum == 1) {
                    return "π/${rdenom}";
                }
                else {
                    return `${rnum}π/${rdenom}`;
                }
            }
        }
        else {
            return value.toFixed(2)
        };
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
                else if (statement.ruleIndex == rule_assignmentStatement) {
                    const measured_qubit = get_qubit(statement.measureExpression().gateOperand().indexedIdentifier());
                    const id = measured_qubit.id;
                    qubits[id].numChildren = 1;
                    operations.push(
                        {
                            gate: "Measure",
                            isMeasurement: true,
                            controls: [{ qId: id }],
                            targets: [{ type: 1, qId: id, cId: 0 }]
                        }
                    );
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
