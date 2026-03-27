"""File management tools -- read, write, list, and search files."""

import glob
import os


def read_file(path: str) -> str:
    """Read and return the contents of a file."""
    try:
        path = os.path.expanduser(path)
        with open(path, "r") as f:
            lines = f.readlines()
        if len(lines) > 500:
            content = "".join(lines[:500])
            content += f"\n... (showing first 500 of {len(lines)} lines)"
            return content
        return "".join(lines)
    except Exception as e:
        return f"Error reading file: {e}"


def write_file(path: str, content: str) -> str:
    """Write content to a file, creating directories if needed."""
    try:
        path = os.path.expanduser(path)
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "w") as f:
            f.write(content)
        return f"Successfully wrote {len(content)} characters to {path}"
    except Exception as e:
        return f"Error writing file: {e}"


def list_directory(path: str = ".") -> str:
    """List the contents of a directory with file/directory indicators and sizes."""
    try:
        path = os.path.expanduser(path)
        entries = sorted(os.listdir(path))
        lines = []
        for entry in entries:
            full = os.path.join(path, entry)
            if os.path.isdir(full):
                lines.append(f"  [dir]  {entry}/")
            else:
                try:
                    size = os.path.getsize(full)
                    if size < 1024:
                        size_str = f"{size} B"
                    elif size < 1024 * 1024:
                        size_str = f"{size / 1024:.1f} KB"
                    else:
                        size_str = f"{size / (1024 * 1024):.1f} MB"
                    lines.append(f"  [file] {entry} ({size_str})")
                except OSError:
                    lines.append(f"  [file] {entry}")
        return "\n".join(lines) if lines else "(empty directory)"
    except Exception as e:
        return f"Error listing directory: {e}"


def search_files(pattern: str, directory: str = ".") -> str:
    """Search for files matching a glob pattern recursively."""
    try:
        directory = os.path.expanduser(directory)
        matches = glob.glob(os.path.join(directory, "**", pattern), recursive=True)
        if not matches:
            return f"No files found matching '{pattern}' in {directory}"
        if len(matches) > 100:
            matches = matches[:100]
            result = "\n".join(matches)
            result += "\n... (showing first 100 matches)"
            return result
        return "\n".join(matches)
    except Exception as e:
        return f"Error searching files: {e}"


TOOLS = [
    (
        {
            "name": "read_file",
            "description": "Read the contents of a file. Returns the file text, limited to 500 lines.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Path to the file to read",
                    }
                },
                "required": ["path"],
            },
        },
        read_file,
    ),
    (
        {
            "name": "write_file",
            "description": "Write content to a file. Creates directories if they don't exist. Overwrites existing files.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Path to the file to write",
                    },
                    "content": {
                        "type": "string",
                        "description": "The content to write to the file",
                    },
                },
                "required": ["path", "content"],
            },
        },
        write_file,
    ),
    (
        {
            "name": "list_directory",
            "description": "List the contents of a directory, showing files with sizes and subdirectories.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Path to the directory (default: current directory)",
                    }
                },
            },
        },
        list_directory,
    ),
    (
        {
            "name": "search_files",
            "description": "Search for files matching a glob pattern recursively. Example patterns: '*.py', '*.txt', 'test_*'.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "pattern": {
                        "type": "string",
                        "description": "Glob pattern to match (e.g., '*.py', 'README*')",
                    },
                    "directory": {
                        "type": "string",
                        "description": "Directory to search in (default: current directory)",
                    },
                },
                "required": ["pattern"],
            },
        },
        search_files,
    ),
]
