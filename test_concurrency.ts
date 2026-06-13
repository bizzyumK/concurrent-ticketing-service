import axios from "axios";

async function testConcurrency() {
    const payload = {
        eventId: "f37caed9-6e1a-4beb-842b-2230f0307026",
        seatNumbers: ["I4"]
    };

    try {
        const results = await Promise.allSettled([
            axios.post("http://localhost:5000/api/reservations", payload),
            axios.post("http://localhost:5000/api/reservations", payload)
        ]);

        console.log("Request 1 result:", results[0]);
        console.log("Request 2 result:", results[1]);

    } catch (err: any) {
        console.error("Error:", err.response?.data || err.message);
    }
}

testConcurrency();