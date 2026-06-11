import axios from "axios";

async function testConcurrency() {
    const payload = {
        eventId: "f7c9e92e-ba6c-4109-ac5e-d23a81d68b54",
        seatNumbers: ["A2"]
    };

    try {
        const results = await Promise.all([
            axios.post("http://localhost:5000/api/reservations", payload),
            axios.post("http://localhost:5000/api/reservations", payload)
        ]);

        console.log("Request 1 result:", results[0].data);
        console.log("Request 2 result:", results[1].data);

    } catch (err: any) {
        console.error("Error:", err.response?.data || err.message);
    }
}

testConcurrency();