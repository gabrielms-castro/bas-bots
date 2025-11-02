document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token")
    if (token) {
        document.getElementById("auth-section").style.display = "none";
        document.getElementById("dashboard-section").style.display = "block";
        document.getElementById("logout-button").style.display = "block";
    } else {
        document.getElementById("auth-section").style.display = "block";
        document.getElementById("dashboard-section").style.display = "none";
        document.getElementById("logout-button").style.display = "none";
    }
})

async function login() {
    const email = document.getElementById("email")
    const password = document.getElementById("password")

    try {
        const response = await fetch ("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({email, password})
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Falha ao logar: ${data.error}`)
        }

        if (data.token) {
            localStorage.setItem("token", data.token)
            document.getElementById("auth-section").style.display = "none";
            document.getElementById("dashboard-section").style.display = "block";
            document.getElementsByName("header").style.display = "block";
        } else {
            alert("Login failed. Please check your credentials.");
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}        
