"""Tool registry -- aggregates all tools and dispatches execution."""

from tools import system, files, weather, web_search, code_helper

_ALL_MODULES = [system, files, weather, web_search, code_helper]

TOOL_SCHEMAS = {}
TOOL_FUNCTIONS = {}

for _mod in _ALL_MODULES:
    for _schema, _func in _mod.TOOLS:
        TOOL_SCHEMAS[_schema["name"]] = _schema
        TOOL_FUNCTIONS[_schema["name"]] = _func


def get_all_tools() -> list[dict]:
    """Return all tool schemas in Claude's expected format."""
    return list(TOOL_SCHEMAS.values())


def execute(tool_name: str, tool_input: dict) -> str:
    """Execute a tool by name and return the result as a string."""
    if tool_name not in TOOL_FUNCTIONS:
        return f"Unknown tool: {tool_name}"
    try:
        func = TOOL_FUNCTIONS[tool_name]
        return str(func(**tool_input))
    except Exception as e:
        return f"Tool error ({tool_name}): {e}"
