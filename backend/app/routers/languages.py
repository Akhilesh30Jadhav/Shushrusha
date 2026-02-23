"""Languages endpoint."""

from fastapi import APIRouter
from ..schemas import LanguagesResponse, Language

router = APIRouter(tags=["Languages"])

SUPPORTED_LANGUAGES = [
    Language(code="en", name="English", native_name="English"),
    Language(code="hi", name="Hindi", native_name="हिन्दी"),
    Language(code="ta", name="Tamil", native_name="தமிழ்"),
    Language(code="bn", name="Bengali", native_name="বাংলা"),
    Language(code="te", name="Telugu", native_name="తెలుగు"),
]


@router.get("/languages", response_model=LanguagesResponse)
async def get_languages():
    return LanguagesResponse(languages=SUPPORTED_LANGUAGES)
