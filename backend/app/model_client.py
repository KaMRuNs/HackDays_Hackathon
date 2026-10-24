"""The only place that talks to the model. Fills a prompt, enforces a JSON schema, validates, retries once."""
from typing import TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from .config import MODEL_NAME, MODEL_TIMEOUT, OLLAMA_URL, PROMPTS_DIR

T = TypeVar("T", bound=BaseModel)


class ModelError(Exception):
    pass


class ModelTimeout(ModelError):
    pass


def render(prompt_name: str, variables: dict) -> str:
    template = (PROMPTS_DIR / f"{prompt_name}.md").read_text(encoding="utf-8")
    for key, value in variables.items():
        template = template.replace("{{" + key + "}}", str(value))
    return template


async def chat_json(prompt_name: str, variables: dict, schema: type[T], temperature: float = 0.3) -> T:
    messages = [{"role": "user", "content": render(prompt_name, variables)}]
    last_error = ""
    for _ in range(2):
        try:
            async with httpx.AsyncClient(timeout=MODEL_TIMEOUT) as client:
                r = await client.post(f"{OLLAMA_URL}/api/chat", json={
                    "model": MODEL_NAME,
                    "stream": False,
                    "think": False,
                    "keep_alive": "30m",
                    "format": schema.model_json_schema(),
                    "options": {"temperature": temperature},
                    "messages": messages,
                })
                r.raise_for_status()
        except httpx.TimeoutException as e:
            raise ModelTimeout("The model took too long to respond.") from e
        except httpx.HTTPError as e:
            raise ModelError(f"Could not reach the model server: {e}") from e

        content = r.json()["message"]["content"]
        try:
            return schema.model_validate_json(content)
        except ValidationError as e:
            last_error = str(e)
            messages += [
                {"role": "assistant", "content": content},
                {"role": "user", "content": f"Your JSON was invalid:\n{last_error}\nReturn corrected JSON only."},
            ]
    raise ModelError(f"The model returned invalid output twice: {last_error[:300]}")
