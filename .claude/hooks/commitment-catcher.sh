#!/bin/bash
# Session-end commitment catcher
#
# Reminds JARVIS to check whether any commitments made during the conversation
# still need logging to Notion.
#
# Fires AT MOST ONCE per session. This matters: injecting additionalContext
# makes the model produce another turn, that turn ends, and Stop fires again —
# so an unconditional version loops forever. Two guards prevent that:
#   1. stop_hook_active is true when the model is only still running because a
#      stop hook asked it to continue. Re-injecting there is what loops.
#   2. A per-session marker file, in case the field is ever missing.

input=$(cat)

# If we are here only because a stop hook already spoke, say nothing.
active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null)
[ "$active" = "true" ] && exit 0

session=$(printf '%s' "$input" | jq -r '.session_id // "unknown"' 2>/dev/null)
marker="${TMPDIR:-/tmp}/jarvis-commitment-check-${session}"

# Already prompted for this session — stay quiet.
[ -f "$marker" ] && exit 0
touch "$marker" 2>/dev/null

cat <<'EOFMSG'
{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"[SESSION END — COMMITMENT CHECK] Before closing, scan this conversation for any promises, commitments, or planned actions the user mentioned ('I'll do X', 'let's aim for Y by Friday', 'I need to Z this week'). If any were NOT already logged to the Commitments database in Notion, log them now using notion-create-pages with data_source_id: 3a034915-3c5a-448e-8e70-42320440cc20. Include: Commitment title, Due date (if mentioned), Related Initiative (if applicable), Context, Status: Open. If all commitments were already logged, do nothing. Do not repeat this check — it runs once per session."}}
EOFMSG
