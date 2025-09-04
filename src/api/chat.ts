import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const sendMessage = async (
  message: string
): Promise<AxiosResponse<{ response: string }>> => {
  const response = await axios.post(
    `${API_BASE_URL}/prod/v1/chat`,
    {
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      messages: message,
      max_tokens: 256,
      temperature: 0.7,
    },
    { headers: { "Content-Type": "application/json" }, withCredentials: false }
  );

  return response;
};
