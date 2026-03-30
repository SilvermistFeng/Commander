#!/bin/bash
# Session-end commitment catcher
# When a session ends, reminds JARVIS to check if any commitments
# were made during the conversation that haven't been logged to Notion.

cat <<'EOFMSG'
{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"[SESSION END — COMMITMENT CHECK] Before closing, scan this conversation for any promises, commitments, or planned actions the user mentioned ('I'll do X', 'let's aim for Y by Friday', 'I need to Z this week'). If any were NOT already logged to the Commitments database in Notion, log them now using notion-create-pages with data_source_id: 3a034915-3c5a-448e-8e70-42320440cc20. Include: Commitment title, Due date (if mentioned), Related Initiative (if applicable), Context, Status: Open. If all commitments were already logged, do nothing."}}
EOFMSG
