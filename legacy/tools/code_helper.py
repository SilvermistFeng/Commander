"""Code assistant tools -- analyze code and run Python snippets."""

import subprocess


def analyze_code(code: str, language: str = "unknown") -> str:
    """Return code with basic metadata for Claude to analyze."""
    lines = code.strip().split("\n")
    line_count = len(lines)
    char_count = len(code)

    info = []
    info.append(f"Language: {language}")
    info.append(f"Lines: {line_count}")
    info.append(f"Characters: {char_count}")

    # Basic observations
    if line_count > 100:
        info.append("Note: This is a large code block.")
    if any(len(line) > 120 for line in lines):
        info.append("Note: Some lines exceed 120 characters.")

    return f"Code analysis:\n" + "\n".join(info) + f"\n\n```{language}\n{code}\n```"


def run_python(code: str) -> str:
    """Execute a Python code snippet and return its output."""
    try:
        result = subprocess.run(
            ["python3", "-c", code],
            capture_output=True,
            text=True,
            timeout=30,
        )
        output = result.stdout
        if result.stderr:
            output += "\n[stderr]\n" + result.stderr
        output = output or "(no output)"
        if len(output) > 10000:
            output = output[:10000] + "\n... (output truncated)"
        return output
    except subprocess.TimeoutExpired:
        return "Error: code execution timed out after 30 seconds"
    except Exception as e:
        return f"Error running code: {e}"


TOOLS = [
    (
        {
            "name": "analyze_code",
            "description": "Analyze a code snippet. Returns the code with metadata (line count, language, basic observations). Use this to help review or debug code the user provides.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "The code to analyze",
                    },
                    "language": {
                        "type": "string",
                        "description": "Programming language (e.g., 'python', 'javascript')",
                    },
                },
                "required": ["code"],
            },
        },
        analyze_code,
    ),
    (
        {
            "name": "run_python",
            "description": "Execute a Python code snippet and return its output. Use this to test or demonstrate code. The code runs with a 30-second timeout.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "The Python code to execute",
                    }
                },
                "required": ["code"],
            },
        },
        run_python,
    ),
]
