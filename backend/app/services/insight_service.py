import json
import logging
import re

from openai import APIError, AsyncOpenAI
from pydantic import BaseModel, Field, ValidationError

from app.core.config import get_settings
from app.models.insight import AIInsight, InsightSource, Sentiment
from app.models.interaction import Interaction

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a customer success analyst. You receive raw meeting or interaction "
    "notes between a customer success manager and a customer. Produce a concise, "
    "factual analysis. Base every statement strictly on the notes; do not invent "
    "details. Sentiment reflects the customer's disposition in the notes."
)

# JSON Schema for OpenAI Structured Outputs. With strict mode, every property
# must be listed in `required` and `additionalProperties` must be false.
INSIGHT_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string", "description": "2-4 sentence summary of the interaction"},
        "sentiment": {"type": "string", "enum": ["positive", "neutral", "negative"]},
        "action_items": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Concrete follow-up actions or commitments",
        },
        "risks": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Key risks, blockers, or churn signals",
        },
    },
    "required": ["summary", "sentiment", "action_items", "risks"],
    "additionalProperties": False,
}


class InsightPayload(BaseModel):
    summary: str = Field(min_length=1)
    sentiment: Sentiment
    action_items: list[str]
    risks: list[str]


class InsightService:
    """Generates structured insights from interaction notes via the OpenAI API,
    with a deterministic heuristic fallback when the API is unavailable or fails."""

    def __init__(self, client: AsyncOpenAI | None = None):
        settings = get_settings()
        self._model = settings.openai_model
        self._timeout = settings.ai_request_timeout_seconds
        if client is not None:
            self._client = client
        elif settings.openai_api_key:
            self._client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=self._timeout)
        else:
            self._client = None

    async def generate(self, interaction: Interaction) -> AIInsight:
        if self._client is None:
            logger.info("OPENAI_API_KEY not configured; using fallback insight")
            return self._fallback(interaction, error="AI not configured")
        try:
            payload = await self._call_ai(interaction)
            return AIInsight(
                summary=payload.summary,
                sentiment=payload.sentiment,
                action_items=payload.action_items,
                risks=payload.risks,
                source=InsightSource.AI,
                model=self._model,
            )
        except (APIError, json.JSONDecodeError, ValidationError, KeyError, StopIteration) as exc:
            logger.warning("AI insight generation failed (%s); using fallback", exc)
            return self._fallback(interaction, error=str(exc)[:500])

    async def _call_ai(self, interaction: Interaction) -> InsightPayload:
        user_prompt = (
            f"Interaction type: {interaction.type.value}\n"
            f"Title: {interaction.title}\n"
            f"Notes:\n{interaction.notes}"
        )
        response = await self._client.chat.completions.create(
            model=self._model,
            max_tokens=1024,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "interaction_insight",
                    "strict": True,
                    "schema": INSIGHT_SCHEMA,
                },
            },
        )
        text = response.choices[0].message.content
        return InsightPayload.model_validate(json.loads(text))

    @staticmethod
    def _fallback(interaction: Interaction, error: str) -> AIInsight:
        """Heuristic analysis: keyword sentiment scoring and pattern-based
        extraction of action items and risks from the raw notes."""
        text = interaction.notes
        lower = text.lower()

        positive_hits = sum(lower.count(w) for w in (
            "happy", "great", "excellent", "satisfied", "renew", "expand", "love", "impressed", "positive",
        ))
        negative_hits = sum(lower.count(w) for w in (
            "unhappy", "frustrat", "churn", "cancel", "angry", "blocker", "complain", "escalat", "negative", "disappoint",
        ))
        if negative_hits > positive_hits:
            sentiment = Sentiment.NEGATIVE
        elif positive_hits > negative_hits:
            sentiment = Sentiment.POSITIVE
        else:
            sentiment = Sentiment.NEUTRAL

        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+", text) if s.strip()]
        summary = " ".join(sentences[:2])[:600] or interaction.title

        action_markers = ("will ", "follow up", "follow-up", "need to", "todo", "to do", "schedule", "send ", "next step")
        risk_markers = ("risk", "blocker", "concern", "issue", "churn", "delay", "escalat", "problem")
        action_items = [s[:300] for s in sentences if any(m in s.lower() for m in action_markers)][:5]
        risks = [s[:300] for s in sentences if any(m in s.lower() for m in risk_markers)][:5]

        return AIInsight(
            summary=summary,
            sentiment=sentiment,
            action_items=action_items,
            risks=risks,
            source=InsightSource.FALLBACK,
            model=None,
            error_message=error,
        )
