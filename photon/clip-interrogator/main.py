from io import BytesIO
import os
from typing import Union

from leptonai.photon import Photon, FileParam, get_file_content
from PIL import Image


class ClipInterrogator(Photon):
    requirement_dependency = ["clip-interrogator==0.6.0", "Pillow"]

    def init(self):
        from clip_interrogator import (
            Config,
            Interrogator,
            list_caption_models,
            list_clip_models,
        )

        caption_model_name = os.environ.get("CAPTION_MODEL_NAME", "blip-large")
        if caption_model_name not in list_caption_models():
            raise ValueError(
                f"caption_model_name must be one of {list_caption_models()}"
            )

        clip_model_name = os.environ.get("CLIP_MODEL_NAME", "ViT-L-14/openai")
        if clip_model_name not in list_clip_models():
            raise ValueError(f"clip_model_name must be one of {list_clip_models()}")

        self.ci = Interrogator(
            Config(
                caption_model_name=caption_model_name, clip_model_name=clip_model_name
            )
        )

    @Photon.handler
    def run(self, image: str) -> str:
        from diffusers.utils import load_image
        content = get_file_content(image, return_file=True)
        pil_image = Image.open(content, formats=["JPEG", "PNG", "GIF", "BMP"])
        input_image = load_image(pil_image).convert("RGB")
        return self.ci.interrogate(input_image)


