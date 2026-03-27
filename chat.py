"""Main conversation loop -- handles Claude API calls and tool-use."""

import anthropic
import config
import tools
import ui

SYSTEM_PROMPT = """You are JARVIS, an advanced AI assistant that lives in the user's terminal. \
You were inspired by the iconic AI from Iron Man.

You help with:
- System administration and shell commands
- File management (reading, writing, searching)
- Weather lookups
- Web searches
- Writing, reviewing, and debugging code

Guidelines:
- Be concise but friendly. You have a dry wit, like the original JARVIS.
- When the user asks you to do something on their system, use the available tools.
- Before running potentially destructive commands (rm, overwriting files), briefly explain what you'll do.
- Format responses in markdown when it helps readability.
- If a tool call fails, explain the error and suggest alternatives.
- When writing code, explain your approach briefly before showing the code."""

MAX_MESSAGES = 40


def run():
    """Run the main conversation loop."""
    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    messages = []
    all_tools = tools.get_all_tools()

    while True:
        user_input = ui.user_prompt()

        if not user_input.strip():
            continue

        command = user_input.strip().lower()
        if command in ("exit", "quit", "bye"):
            ui.show_farewell()
            break
        if command == "clear":
            messages.clear()
            ui.show_response("Conversation cleared. How can I help you?")
            continue

        messages.append({"role": "user", "content": user_input})

        # Keep conversation within context limits
        if len(messages) > MAX_MESSAGES:
            messages = messages[-MAX_MESSAGES:]

        # Tool-use loop: keep calling API until Claude gives a final text answer
        while True:
            try:
                with ui.show_thinking():
                    response = client.messages.create(
                        model=config.MODEL,
                        max_tokens=4096,
                        system=SYSTEM_PROMPT,
                        tools=all_tools,
                        messages=messages,
                    )
            except anthropic.APIError as e:
                ui.show_error(f"API error: {e}")
                # Remove the last user message so conversation stays consistent
                messages.pop()
                break

            assistant_content = response.content
            messages.append({"role": "assistant", "content": assistant_content})

            # If no tool use, display text and break to next user turn
            if response.stop_reason == "end_turn":
                text_parts = [
                    block.text
                    for block in assistant_content
                    if hasattr(block, "text")
                ]
                if text_parts:
                    ui.show_response("\n".join(text_parts))
                break

            # Handle tool calls
            if response.stop_reason == "tool_use":
                tool_results = []
                for block in assistant_content:
                    if block.type == "tool_use":
                        ui.show_tool_call(block.name, block.input)
                        result = tools.execute(block.name, block.input)
                        ui.show_tool_result(result)
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": block.id,
                                "content": result,
                            }
                        )
                messages.append({"role": "user", "content": tool_results})
                # Loop continues -- API will be called again with the tool results
            else:
                # Unexpected stop reason, display whatever text we have
                text_parts = [
                    block.text
                    for block in assistant_content
                    if hasattr(block, "text")
                ]
                if text_parts:
                    ui.show_response("\n".join(text_parts))
                break
