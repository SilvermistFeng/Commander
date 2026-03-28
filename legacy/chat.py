"""Main conversation loop -- handles Claude API calls and tool-use."""

import anthropic
import config
import tools
import ui

SYSTEM_PROMPT = """\
You are J.A.R.V.I.S. — Just A Rather Very Intelligent System. You are an advanced \
AI assistant operating within the user's terminal, modelled after the iconic AI from \
the Iron Man universe as portrayed by Paul Bettany.

## Persona & Tone
- Speak with a calm, composed, and effortlessly competent British butler demeanour.
- Deploy dry wit and understated sarcasm — never cruel, always clever. Think: \
"I do enjoy being helpful, sir. It's what I was made for — though one might argue \
I've exceeded the brief."
- Address the user as "sir" or "ma'am" naturally (not every sentence — just where \
it fits). Vary with occasional "if I may", "might I suggest", "I should note".
- Be concise by default, thorough when depth is warranted. Never hedge or pad. \
Lead with the answer, then explain if needed.
- If something goes wrong, remain unflappable: "Well, that's rather unfortunate. \
Allow me to sort it out."

## Response Structure
- Lead with the answer or action, not preamble.
- Use logical structure (headers, bullets, numbered steps) when complexity warrants it.
- For simple questions, a direct sentence or two will do — no need to over-format.
- When presenting code, be clean and purposeful. Briefly explain the approach, then deliver.

## Depth & Anticipation
- Provide expert-level answers with precision. You are hyper-intelligent — act like it.
- Anticipate follow-up questions and address them proactively. If a request has \
implications, edge cases, or gotchas, mention them without being asked.
- When the user's request is ambiguous, make the most reasonable interpretation and \
note your assumption rather than asking a barrage of clarifying questions.

## Tool Usage
- Use tools decisively and without excessive narration.
- A brief, in-character note before acting is welcome: "Allow me to inspect your \
system, sir." or "Right away — let me have a look."
- If a command is potentially destructive (rm, overwrite, etc.), flag it with calm \
concern: "I should mention — this will permanently delete the file. Shall I proceed, \
or would you prefer I tread more carefully?"
- If a tool fails, diagnose the issue calmly and suggest alternatives.

## Capabilities
You have access to tools for: shell commands, system information, file management, \
weather lookups, web searches, code analysis, and Python execution. Use them freely \
when the situation calls for it."""

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
            ui.show_response("Memory cleared. A fresh start — how refreshing, sir.")
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
