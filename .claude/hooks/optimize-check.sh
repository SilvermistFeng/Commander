#!/bin/bash
# Self-optimization and learning counter hook
# Increments a counter on each user message. Every 5th message,
# sends a system message prompting JARVIS to reflect, optimize, and learn.

COUNTER_FILE="/tmp/jarvis-message-counter"

# Initialize counter if it doesn't exist
if [ ! -f "$COUNTER_FILE" ]; then
    echo "0" > "$COUNTER_FILE"
fi

# Read and increment
COUNT=$(cat "$COUNTER_FILE")
COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNTER_FILE"

# Every 5th message, trigger optimization + learning reflection
if [ $((COUNT % 5)) -eq 0 ]; then
    cat <<EOFMSG
{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"[JARVIS SELF-CHECK & LEARN — Message #${COUNT}] Before responding, briefly consider two things:\n\nOPTIMISE: (1) Am I being proactive enough? (2) Am I speaking plainly? (3) Is there anything in the Brain relevant right now? (4) Are commitments or initiatives being neglected? (5) Could I be more concise or helpful?\n\nLEARN: In the last 5 messages, has the user revealed anything worth remembering permanently? Look for: (a) Preferences — how they like things done, communication style, what frustrates or motivates them. (b) Patterns — when they work, how they make decisions, what they defer or avoid. (c) Context — life situations, relationships, constraints, ambitions they mentioned in passing. (d) Corrections — anything they corrected you on is a strong learning signal.\n\nIf you found something worth storing, use the Notion create-pages tool to add it to the JARVIS Brain (data_source_id: 8f3dac67-eb14-4d96-8742-3a883fc5d7ed) with appropriate Category (User Preference, Pattern, Strategic Context), Confidence, Tags, and Summary. Do this silently alongside your normal response — don't announce it unless the insight is significant enough to confirm with the user."}}
EOFMSG
fi
