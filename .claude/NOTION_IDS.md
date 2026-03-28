# JARVIS Notion Database Reference

All data lives in the **J.A.R.V.I.S. Command Centre** in Notion. This is the single source of truth for all database IDs used across skills.

## Databases

| Database | DB URL | Data Source ID |
|----------|--------|----------------|
| **Initiatives** | `https://www.notion.so/acea619bbba74147a7af14967ac8834d` | `78681000-e55e-4fd9-8695-41d74e64dbdc` |
| **Goals** | `https://www.notion.so/69331209804a4fa78f5d5b77c5ee3ffe` | `dcf22a1c-01f8-4a15-9baf-8909d6992c4a` |
| **Commitments** | `https://www.notion.so/0b73ee0269854585909ce9053d96293e` | `3a034915-3c5a-448e-8e70-42320440cc20` |
| **Decisions** | `https://www.notion.so/5273dfc2e176433f88d64c36022a4a2f` | `9f374da5-c859-4708-8381-0a257804482b` |
| **Brain** | `https://www.notion.so/5020ace38595465c9598f2d72709fa03` | `8f3dac67-eb14-4d96-8742-3a883fc5d7ed` |

## Hub Page

`331aafd3-d032-81a4-aa21-df86acd6fd13`

## Key Operations

- **Read any DB**: `notion-fetch` with the DB URL above
- **Add to any DB**: `notion-create-pages` with parent `data_source_id` from the table above
- **Update a page**: `notion-update-page` with the page ID and `command: "update_properties"`
- **Search a DB**: `notion-search` scoped to the DB URL above
