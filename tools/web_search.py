"""Web search tool -- search the web via DuckDuckGo (no API key needed)."""

import requests
import re


def web_search(query: str) -> str:
    """Search the web using DuckDuckGo and return results."""
    try:
        url = "https://html.duckduckgo.com/html/"
        headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
        }
        resp = requests.post(url, data={"q": query}, headers=headers, timeout=10)
        resp.raise_for_status()
        html = resp.text

        # Extract result titles and snippets from DuckDuckGo HTML
        results = []
        # Find result blocks
        blocks = re.findall(
            r'<a rel="nofollow" class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)</a>.*?'
            r'<a class="result__snippet"[^>]*>(.*?)</a>',
            html,
            re.DOTALL,
        )

        for href, title, snippet in blocks[:5]:
            title = re.sub(r"<[^>]+>", "", title).strip()
            snippet = re.sub(r"<[^>]+>", "", snippet).strip()
            if title:
                results.append(f"- {title}\n  {snippet}\n  {href}")

        if not results:
            return f"No results found for '{query}'. Try a different search."

        return f"Search results for '{query}':\n\n" + "\n\n".join(results)
    except Exception as e:
        return f"Error searching the web: {e}"


TOOLS = [
    (
        {
            "name": "web_search",
            "description": "Search the web using DuckDuckGo. Returns the top 5 results with titles, snippets, and URLs. No API key needed.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query",
                    }
                },
                "required": ["query"],
            },
        },
        web_search,
    ),
]
