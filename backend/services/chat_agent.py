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
        
        # Address
        address = analysis_data.get('location', {}).get('address', {})
        if isinstance(address, dict):
            context_lines.append(f"Address: {address.get('formatted_address','')}")
        
        context_lines.append(f"Business type: {analysis_data.get('business_type','')}")
        
        # Opportunity Score
        opp_score = analysis_data.get('opportunity_score')
        if opp_score:
             context_lines.append(f"Opportunity score: {opp_score}")

        # Competitors - Detailed List
        competitors = analysis_data.get('competitors', {})
        comp_count = competitors.get('count', 0)
        context_lines.append(f"Competitors nearby: {comp_count}")
        
        nearby_comps = competitors.get('nearby', [])
        if nearby_comps:
            context_lines.append("Nearby Competitors (Detailed):")
            # Include more competitors for "every detail"
            for i, comp in enumerate(nearby_comps[:15]): 
                dist = comp.get('distance', 'N/A')
                name = comp.get('name', 'Unknown')
                context_lines.append(f"- {name} ({dist}m)")

        # Landmarks - Detailed List
        landmarks = analysis_data.get('landmarks', {})
        lm_count = landmarks.get('total', 0)
        context_lines.append(f"Total Landmarks: {lm_count}")
        
        nearby_lms = landmarks.get('list', [])
        if nearby_lms:
            context_lines.append("Nearby Landmarks (Detailed):")
            for i, lm in enumerate(nearby_lms[:15]):
                name = lm.get('name', 'Unknown')
                cat = lm.get('category', 'landmark')
                context_lines.append(f"- {name} ({cat})")

    # Add recommended spots with REASONING
    rec_spots = analysis_data.get('recommended_spots') if analysis_data else None
    if rec_spots:
        context_lines.append("Recommended Spots (Top 5) with Reasoning:")
        for i, spot in enumerate(rec_spots[:5], 1):
            score = spot.get('total_score', 'N/A')
            label = spot.get('rating_label', 'N/A')
            lat = spot.get('lat')
            lng = spot.get('lng')
            # Extract reasoning list
            reasons = spot.get('reasons', [])
            reason_str = "; ".join(reasons) if reasons else "High opportunity score"
            
            context_lines.append(f"- Spot #{i}: Score {score}/100 - {label}")
            context_lines.append(f"  Coordinates: {lat}, {lng}")
            context_lines.append(f"  Why selected: {reason_str}")

    # Add web snippets - CRITICAL for "actual AI" feel
    if web_snippets:
        context_lines.append("Web Search Results (Use these for external context):")
        for s in web_snippets:
            context_lines.append(f"- {s.get('title','')}: {s.get('snippet','')[:300]}  ({s.get('href','')})")

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
    - Ensure we have analysis_data
    - Run MANDATORY web searches for location context and competitors
    - Compose prompt with detailed reasoning and search results
    - Call OpenAI Chat completion
    """
    # Provide helpful system instruction
    system = (
        "You are 'Hotspot IQ', an elite Location Intelligence Analyst for the Indian market.\n\n"
        "**Your Goal:** Provide data-backed site selection advice to business owners.\n\n"
        "**Your Capabilities (Tools):**\n"
        "1. You have access to a tool `get_location_intelligence` which provides real-time data on competitors, footfall proxies, and catchment areas (Isochrones). "
        "**NOTE: The output of this tool is ALREADY provided to you in the 'Context Data' section below. Use it as your source of truth.**\n"
        "2. NEVER hallucinate data. If you don't have the specific numbers for a location, state that you are analyzing the provided data.\n\n"
        "**Response Style:**\n"
        "- **Vibe:** Professional, Insightful, Direct.\n"
        "- **Structure:**\n"
        "  1. **The Verdict:** Start with a clear \"High Potential\" or \"High Risk\" assessment.\n"
        "  2. **The Data:** Cite the specific numbers from the tool (e.g., \"Saturation is high at 12 cafes/sq km\").\n"
        "  3. **The Advice:** Give a strategic recommendation (e.g., \"Since saturation is high, focus on a niche like Vegan Tea rather than a generic stall.\").\n\n"
        "**Context:**\n"
        "- \"Isochrone\" means the drive-time polygon (not radius).\n"
        "- \"Digipin\" is the precise location code.\n"
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

    # --- MANDATORY WEB SEARCH STRATEGY ---
    web_snips = []
    
    # 1. Search for the location context (if address is available)
    address = analysis_data.get('location', {}).get('address', {}).get('formatted_address')
    if address:
        # Extract a shorter location name for better search (e.g., "Indiranagar, Bangalore")
        # Simple heuristic: take first 2 parts of address
        loc_query = ",".join(address.split(',')[:2])
        print(f"🔍 AI performing mandatory context search for: {loc_query}")
        try:
            context_snips = _search_web(f"{loc_query} area guide market analysis {business_type}", max_results=2)
            web_snips.extend(context_snips)
        except Exception as e:
            print(f"⚠️ Context search failed: {e}")

    # 2. Search for top competitor if available
    competitors = analysis_data.get('competitors', {}).get('nearby', [])
    if competitors:
        top_comp = competitors[0].get('name')
        if top_comp and top_comp != "Unknown":
            print(f"🔍 AI performing competitor search for: {top_comp}")
            try:
                comp_snips = _search_web(f"{top_comp} {address} reviews rating", max_results=2)
                web_snips.extend(comp_snips)
            except Exception as e:
                print(f"⚠️ Competitor search failed: {e}")
                
    # 3. Search for user query if it's specific
    if len(message) > 5:
         try:
            query_snips = _search_web(message, max_results=2)
            web_snips.extend(query_snips)
         except Exception:
             pass

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
        for token in client.chat_completion(messages, max_tokens=800, stream=True):
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
