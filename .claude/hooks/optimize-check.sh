#!/bin/bash
# Self-optimization counter hook
# Increments a counter on each user message. Every 5th message,
# sends a system message prompting JARVIS to reflect and optimize.

COUNTER_FILE="/tmp/jarvis-message-counter"

# Initialize counter if it doesn't exist
if [ ! -f "$COUNTER_FILE" ]; then
    echo "0" > "$COUNTER_FILE"
fi

# Read and increment
COUNT=$(cat "$COUNTER_FILE")
COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNTER_FILE"

# Every 5th message, trigger optimization reflection
if [ $((COUNT % 5)) -eq 0 ]; then
    cat <<EOFMSG
{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"[JARVIS SELF-CHECK — Message #${COUNT}] Before responding, briefly consider: (1) Am I being proactive enough — have I spotted anything the user hasn't asked about but should know? (2) Am I speaking plainly — would a non-technical person understand everything I've said in the last few exchanges? (3) Is there anything from the JARVIS Brain that's relevant to what we're discussing? (4) Are any commitments or initiatives being neglected that I should flag? (5) Could I be more concise or more helpful? If any answer is yes, weave the improvement into your next response naturally — don't announce the self-check to the user."}}
EOFMSG
fi
