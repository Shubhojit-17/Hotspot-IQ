"""
Hotspot IQ - Chat Agent Service
Provides a retrieval-augmented generation (RAG) helper that:
- fetches local analysis/POI/landmark data
- fetches short web snippets using DuckDuckGo
- composes a contextual prompt and queries OpenAI

The implementation strives to be simple and self-contained so it is
easy to extend later (add embeddings store, richer document loader, etc.).
"""

import os
import requests
from typing import Dict, Any, List, Tuple
from config import Config

try:
    from duckduckgo_search import ddg
except Exception:
    ddg = None


def _load_local_docs(repo_root: str) -> List[Tuple[str, str]]:
    """Load small local documentation files (README, DESIGN) as (title, text).
    This lets the assistant reference project-specific details visible in the repo.
    """
    docs = []
    candidates = ["README.md", "DESIGN.md", "TASKS.md"]
    for name in candidates:
        path = os.path.join(repo_root, name)
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    text = f.read(2048)
                docs.append((name, text))
            except Exception:
                continue
    return docs


def _search_web(query: str, max_results: int = 3) -> List[Dict[str, str]]:
    """Run a quick DuckDuckGo search and return small snippets.
    Falls back to an empty list if the package isn't installed.
    """
    results = []
    if ddg is None:
        return results

    try:
        hits = ddg(query, max_results=max_results)
        if not hits:
            return results

        for h in hits[:max_results]:
            results.append({
                "title": h.get("title") or h.get("text") or "",
                "href": h.get("href") or h.get("url") or "",
                "snippet": h.get("body") or h.get("snippet") or ""
            })
    except Exception:
        return []

    return results


def _compose_prompt(system_instructions: str, analysis_data: Dict[str, Any], message: str,
                    web_snippets: List[Dict[str, str]], local_docs: List[Tuple[str, str]]) -> List[Dict[str, str]]:
    """Compose chat messages list for OpenAI Chat API.
    We include: system, user context, web snippets, and user's question.
    """
    context_lines = []

    # Basic location & analysis
    if analysis_data:
        context_lines.append(f"Location: {analysis_data.get('lat')},{analysis_data.get('lng')}")
        address = analysis_data.get('address', {})
        if isinstance(address, dict):
            context_lines.append(f"Address: {address.get('formatted_address','')}")
        context_lines.append(f"Business type: {analysis_data.get('business_type','')}")
        context_lines.append(f"Opportunity score: {analysis_data.get('opportunity_score','N/A')}")
        comp_count = 0
        try:
            comp_count = analysis_data.get('competitors', {}).get('count', 0)
        except Exception:
            comp_count = 0
        context_lines.append(f"Competitors nearby: {comp_count}")

    # Add brief landmarks summary if present
    landmarks = analysis_data.get('landmarks') if analysis_data else None
    if landmarks:
        try:
            by_cat = landmarks.get('by_category', {})
            for k, v in (by_cat.items() if isinstance(by_cat, dict) else []):
                context_lines.append(f"Landmarks - {k}: {v}")
        except Exception:
            pass

    # Add recommended spots
    rec_spots = analysis_data.get('recommended_spots') if analysis_data else None
    if rec_spots:
        context_lines.append("Recommended Spots (Top 5):")
        for i, spot in enumerate(rec_spots[:5], 1):
            context_lines.append(f"- Spot #{i}: Score {spot.get('total_score', 'N/A')}/100 - {spot.get('rating_label', 'N/A')} (Lat: {spot.get('lat')}, Lng: {spot.get('lng')})")

    # Add web snippets
    if web_snippets:
        context_lines.append("Web snippets:")
        for s in web_snippets:
            context_lines.append(f"- {s.get('title','')}: {s.get('snippet','')[:240]}  ({s.get('href','')})")

    # Add small local docs
    if local_docs:
        context_lines.append("Local docs:")
        for name, text in local_docs:
            excerpt = text.replace('\n', ' ')[:400]
            context_lines.append(f"- {name}: {excerpt}...")

    user_prompt = "\n".join(context_lines) + "\n\nUser question: " + message

    messages = [
        {"role": "system", "content": system_instructions},
        {"role": "user", "content": user_prompt}
    ]

    return messages


def answer_question(message: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """Main entrypoint used by the route.

    Steps:
    - Ensure we have analysis_data (fetch if needed using provided services in context)
    - Run a quick web search for the user query
    - Load small local docs
    - Compose prompt and call OpenAI Chat completion
    """
    # Provide helpful system instruction
    system = (
        "You are Hotspot IQ, an expert location intelligence assistant for small businesses. "
        "Answer concisely, cite which data sources you used (local analysis, project docs, web search), "
        "and when you are uncertain say so. Prioritize local analysis data over web snippets."
    )

    analysis_data = context.get('analysis_data') or {}
    lat = context.get('lat')
    lng = context.get('lng')
    business_type = context.get('business_type')

    # If coords provided but no analysis, try to call provided retriever in context
    retriever = context.get('retriever')
    if (lat and lng) and not analysis_data and callable(retriever):
        try:
            analysis_data = retriever(lat, lng, business_type)
        except Exception:
            analysis_data = {}

    # Web snippets
    web_snips = []
    try:
        web_snips = _search_web(message, max_results=3)
    except Exception:
        web_snips = []

    # Local docs from repo root
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    local_docs = _load_local_docs(repo_root)

    # Compose messages
    messages = _compose_prompt(system, analysis_data or {}, message, web_snips, local_docs)

    # If Hugging Face not configured, return template/fallback
    if not Config.HUGGINGFACE_API_KEY:
        # Return minimal template response
        response = {
            'response': 'AI not configured. Provide HUGGINGFACE_API_KEY in environment to enable the assistant.',
            'data_sources': ['local_analysis', 'local_docs', 'web_snippets' if web_snips else 'none'],
            'ai_powered': False
        }
        return response

    # Call Hugging Face
    try:
        from huggingface_hub import InferenceClient
        client = InferenceClient(
            model=Config.HUGGINGFACE_MODEL,
            token=Config.HUGGINGFACE_API_KEY
        )

        # Use chat_completion for instruction-tuned models
        # We need to convert our messages format to what HF expects (list of dicts with role/content)
        # Our 'messages' variable is already in that format: [{'role': 'system', ...}, {'role': 'user', ...}]
        
        response_text = ""
        for token in client.chat_completion(messages, max_tokens=600, stream=True):
            if token.choices and token.choices[0].delta.content:
                response_text += token.choices[0].delta.content

        return {
            'response': response_text,
            'data_sources': ['local_analysis'] + (['local_docs'] if local_docs else []) + (['web_snippets'] if web_snips else []),
            'ai_powered': True
        }

    except Exception as e:
        return {
            'response': f'Error contacting AI service: {e}',
            'data_sources': ['local_analysis'],
            'ai_powered': False,
            'error': str(e)
        }
