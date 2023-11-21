import { blobToBase64 } from "@/lib/utils";

export const fetchImage = async (input_image: string, prompt: string) => {
  const response = await fetch("/api/run", {
    headers: {
      accept: "image/jpeg",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      input_image: input_image.replace(/^data:image\/(png|jpeg);base64,/, ""),
      prompt,
      guidance_scale: 8,
      lcm_steps: 50,
      seed: 2159232,
      steps: 4,
      strength: 0.7,
      width: 768,
      height: 768,
    }),
    method: "POST",
  });
  const blob = await response.blob();
  return await blobToBase64(blob);
};
