const API_URL = import.meta.env.VITE_API_URL || "";

export function apiUrl(path: string){
    if(!path.startsWith("/")) path = `/${path}`;
    return API_URL ? `${API_URL}${path}` : path;
}

export async function apiFetch<T>(path: string, init: RequestInit={}):Promise<T>{
    let res: Response;
    try {
        res = await fetch(apiUrl(path),{
            ...init,
            credentials: "include", // for cookie auth
            headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    }
        });
    } catch (err: any) {
        const message =
            err?.message === "Failed to fetch"
                ? "Failed to fetch, please try after some time"
                : "Network error, please try after some time";
        throw {
            status: 0,
            code: "NETWORK_ERROR",
            message,
        };
    }

    // if backend returns json {code, message}, keep it readable
    const text = await res.text();
    let data: any = null;

    try{
        data = text ? JSON.parse(text): null
    }catch{
        data = text
    }

    if(!res.ok){
        //normalise error
        const err = {
            status: res.status,
            code: data?.code || "HTTP_ERROR",
            message: data?.message || `Request failed (${res.status})`
        };
        throw err;
    }
    return data as T
}
