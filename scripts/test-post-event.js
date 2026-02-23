
fetch('http://localhost:3000/api/guild/events', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        title: "Test Event via Script",
        destination: "The Voidspire",
        event_date: new Date().toISOString(),
        difficulty: "Mythic (20)",
        status: "scheduled",
        selected_bosses: []
    })
})
    .then(res => res.text().then(text => ({ status: res.status, text })))
    .then(data => console.log("Response:", data))
    .catch(err => console.error("Error:", err))
