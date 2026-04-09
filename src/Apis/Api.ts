import api from "./Authorization";

export const getRequest = async <T>(endpoint: string): Promise<T> => {
  try {
    const response = await api.get<T>(endpoint);
    return response.data;
  } catch (error) {
    console.error("GET request failed", error);
    throw error;
  }
};

export const postRequest = async <T>(
  endpoint: string,
  data: Record<string, unknown>
): Promise<T> => {
  try {
    const response = await api.post<T>(endpoint, data);
    return response.data;
  } catch (error) {
    console.error("POST request failed", error);
    throw error;
  }
};

export const putRequest = async <T>(
  endpoint: string,
  data: Record<string, unknown>
): Promise<T> => {
  try {
    const response = await api.put<T>(endpoint, data);
    return response.data;
  } catch (error) {
    console.error("PUT request failed", error);
    throw error;
  }
};

export const deleteRequest = async <T>(endpoint: string): Promise<T> => {
  try {
    const response = await api.delete<T>(endpoint);
    return response.data;
  } catch (error) {
    console.error("DELETE request failed", error);
    throw error;
  }
};