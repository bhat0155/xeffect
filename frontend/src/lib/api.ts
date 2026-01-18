const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function apiUrl(path: string){
    if(!path.startsWith("/")) path = `/${path}`;
    return `${API_URL}${path}`;
}

export async function apiFetch<T>(path: string, init: RequestInit={}):Promise<T>{
    const res = await fetch(apiUrl(path),{
        ...init,
        credentials: "include", // for cookie auth
        headers: {
         "Content-Type": "application/json",
         ...API_URL(init.headers || {})
        }
    });

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

