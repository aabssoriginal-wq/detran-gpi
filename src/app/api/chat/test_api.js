
async function test() {
  const apiKey = "AIzaSyDRGTm8TyskfYG3tr803syryu8dOIbYqaY";
  const payload = {
    contents: [{ parts: [{ text: "Olá, você está funcionando?" }] }]
  };
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

test();
