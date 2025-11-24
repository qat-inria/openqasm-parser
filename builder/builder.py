from __future__ import annotations

import contextlib
import os
import subprocess
import tarfile
import urllib.request
from pathlib import Path
import shutil

import typer

import contextlib


@contextlib.contextmanager
def cd(path: Path):
    old_dir = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(old_dir)

def run_antlr4(antlr4_version: str, grammar_path: Path, target: Path, language: str) -> None:
    relative_target = os.path.relpath(target, grammar_path)
    subprocess.run(["antlr4", "-v", antlr4_version, "-o", relative_target, f"-Dlanguage={language}", "-visitor", "qasm3Lexer.g4", "qasm3Parser.g4"], cwd=grammar_path, check=True)

def make_tarball(path: Path) -> Path:
    tarball_path = path.with_name(path.name + ".tar.gz")
    with tarfile.open(tarball_path, "w:gz") as tar:
        tar.add(path, arcname=os.path.basename(path))
    return tarball_path

def copy_documents(target_path: Path) -> None:
    shutil.copy("LICENSE", target_path)
    shutil.copy("CHANGELOG.md", target_path)
    shutil.copy("CONTRIBUTING.md", target_path)

def build_python(package_version: str, antlr4_version: str, openqasm_version: str, grammar_path: Path) -> Path:
    python_package_name = "openqasm_parser"
    python_repository_path = Path(f"openqasm-python-parser-{package_version}")
    python_repository_path.mkdir(exist_ok=True)
    run_antlr4(antlr4_version, grammar_path, python_repository_path / python_package_name, "Python3")
    with (python_repository_path / "pyproject.toml").open("w") as f:
        f.write(f"""[project]
name = "openqasm-parser"
authors = [
    {{ name = "Thierry Martinez", email = "thierry.martinez@inria.fr" }},
]
version = "{package_version}"
dependencies = [
    "antlr4-python3-runtime=={antlr4_version}",
]
""")
    with Path(python_repository_path / python_package_name / "__init__.py").open("w") as f:
        f.write("""\"\"\""Lexer and parser generated from OpenQASM specification.\"\"\"

from openqasm_parser.qasm3Lexer import qasm3Lexer
from openqasm_parser.qasm3Parser import qasm3Parser
from openqasm_parser.qasm3ParserVisitor import qasm3ParserVisitor

__all__ = ["qasm3Lexer", "qasm3Parser", "qasm3ParserVisitor"]
""")
    shutil.copytree("python/tests", python_repository_path / "tests", dirs_exist_ok=True)
    shutil.copy("python/README.md", python_repository_path)
    copy_documents(python_repository_path)
    subprocess.run(["pytest"], cwd=python_repository_path, check=True)
    tarball_path = make_tarball(python_repository_path)
    return tarball_path

def build_javascript(package_version: str, antlr4_version: str, openqasm_version: str, grammar_path: Path) -> Path:
    javascript_repository_path = Path(f"openqasm-javascript-parser-{package_version}")
    run_antlr4(antlr4_version, grammar_path, javascript_repository_path, "JavaScript")
    shutil.copy("javascript/README.md", javascript_repository_path)
    copy_documents(javascript_repository_path)
    tarball_path = make_tarball(javascript_repository_path)
    return tarball_path

def main(package_version: str, antlr4_version: str, openqasm_version: str) -> None:
    spec_url = f"https://github.com/openqasm/openqasm/archive/refs/tags/spec/{openqasm_version}.tar.gz"
    tarfile_name, _headers = urllib.request.urlretrieve(spec_url)
    with tarfile.open(tarfile_name) as tar:
        tar.extractall(filter="data")
    grammar_path = f"openqasm-spec-{openqasm_version}/source/grammar"
    build_python(package_version, antlr4_version, openqasm_version, grammar_path)
    build_javascript(package_version, antlr4_version, openqasm_version, grammar_path)

if __name__ == "__main__":
    typer.run(main)
