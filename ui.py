"""Terminal UI -- all Rich-based presentation lives here."""

from contextlib import contextmanager
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.text import Text
from rich.live import Live
from rich.spinner import Spinner

console = Console()

BANNER = r"""
     ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗
     ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝
     ██║███████║██████╔╝██║   ██║██║███████╗
██   ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║
╚█████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║███████║
 ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝
"""


def show_banner():
    """Display the JARVIS welcome banner."""
    text = Text(BANNER, style="bold cyan")
    panel = Panel(
        text,
        subtitle="[dim]Type 'exit' to quit | 'clear' to reset conversation[/dim]",
        border_style="cyan",
    )
    console.print(panel)
    console.print("[bold cyan]  Good evening. I am J.A.R.V.I.S. — at your service.[/bold cyan]")
    console.print()


def user_prompt() -> str:
    """Get input from the user with a styled prompt."""
    try:
        return console.input("[bold green]> [/bold green]")
    except EOFError:
        return "exit"


@contextmanager
def show_thinking():
    """Show a spinner while JARVIS is thinking."""
    spinner = Spinner("dots", text="[cyan]Processing, sir...[/cyan]")
    with Live(spinner, console=console, refresh_per_second=12, transient=True):
        yield


def show_response(text: str):
    """Render JARVIS's response as markdown in a panel."""
    md = Markdown(text)
    panel = Panel(md, title="[bold cyan]J.A.R.V.I.S.[/bold cyan]", border_style="cyan")
    console.print(panel)
    console.print()


def show_tool_call(name: str, args: dict):
    """Show which tool is being called."""
    args_str = ", ".join(f"{k}={v!r}" for k, v in args.items())
    # Truncate long args for display
    if len(args_str) > 200:
        args_str = args_str[:200] + "..."
    console.print(f"  [dim italic]Running: {name}({args_str})[/dim italic]")


def show_tool_result(result: str):
    """Show the output of a tool call."""
    if len(result) > 2000:
        display = result[:2000] + "\n... (truncated)"
    else:
        display = result
    console.print(Panel(display, title="[dim]Tool Output[/dim]", border_style="dim"))


def show_error(msg: str):
    """Show an error message."""
    console.print(Panel(msg, title="[bold red]Error[/bold red]", border_style="red"))


def show_farewell():
    """Show a goodbye message."""
    console.print("\n[bold cyan]J.A.R.V.I.S.:[/bold cyan] Will that be all, sir? Very well. Good evening.\n")
