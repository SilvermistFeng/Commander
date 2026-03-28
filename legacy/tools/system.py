"""System control tools -- run commands, get system info, open apps."""

import platform
import shutil
import subprocess


def run_shell(command: str) -> str:
    """Execute a shell command and return output."""
    try:
        result = subprocess.run(
            command, shell=True, capture_output=True, text=True, timeout=30
        )
        output = result.stdout
        if result.stderr:
            output += "\n[stderr]\n" + result.stderr
        output = output or "(no output)"
        if len(output) > 10000:
            output = output[:10000] + "\n... (output truncated)"
        return output
    except subprocess.TimeoutExpired:
        return "Error: command timed out after 30 seconds"
    except Exception as e:
        return f"Error: {e}"


def get_system_info() -> str:
    """Return OS, hostname, Python version, and disk usage."""
    info = []
    info.append(f"OS: {platform.system()} {platform.release()}")
    info.append(f"Platform: {platform.platform()}")
    info.append(f"Hostname: {platform.node()}")
    info.append(f"Python: {platform.python_version()}")
    info.append(f"Architecture: {platform.machine()}")

    try:
        disk = shutil.disk_usage("/")
        total_gb = disk.total / (1024**3)
        free_gb = disk.free / (1024**3)
        info.append(f"Disk: {free_gb:.1f} GB free / {total_gb:.1f} GB total")
    except Exception:
        pass

    return "\n".join(info)


def open_application(app_name: str) -> str:
    """Open a desktop application by name."""
    system = platform.system()
    try:
        if system == "Linux":
            subprocess.Popen(["xdg-open", app_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif system == "Darwin":
            subprocess.Popen(["open", "-a", app_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif system == "Windows":
            subprocess.Popen(["start", app_name], shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            return f"Unsupported platform: {system}"
        return f"Opened {app_name}"
    except Exception as e:
        return f"Error opening {app_name}: {e}"


TOOLS = [
    (
        {
            "name": "run_shell",
            "description": "Execute a shell command on the user's system and return its output. Use for any system task: listing files, installing packages, checking processes, etc.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The shell command to execute",
                    }
                },
                "required": ["command"],
            },
        },
        run_shell,
    ),
    (
        {
            "name": "get_system_info",
            "description": "Get information about the user's system: OS, hostname, Python version, disk usage, and architecture.",
            "input_schema": {
                "type": "object",
                "properties": {},
            },
        },
        get_system_info,
    ),
    (
        {
            "name": "open_application",
            "description": "Open a desktop application by name. Works on Linux, macOS, and Windows.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "app_name": {
                        "type": "string",
                        "description": "The name of the application to open",
                    }
                },
                "required": ["app_name"],
            },
        },
        open_application,
    ),
]
