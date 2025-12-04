async function request(url, options) {
    try {
        const res = await fetch(url, options);

        if (!res.ok) {
            throw new Error(`Http ${res.status}: ${await res.text()}`);
        }

        try {
            return res.json();
        } catch { return null; }

    } catch (error) {
        console.error('Request error: ', error)
        throw error;
    }
}

async function API_GET(path) {
    return request(window.API_BASE_URL + path, { method: `GET` });
}

async function API_POST(path, body) {
    return request(window.API_BASE_URL + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
}

export {API_GET, API_POST};