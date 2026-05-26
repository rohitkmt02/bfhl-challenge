export default async (req, context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Environment variables fallback values
  const userId = process.env.USER_ID || "john_doe_17091999";
  const email = process.env.EMAIL || "john@xyz.com";
  const rollNumber = process.env.ROLL_NUMBER || "ABCD123";

  if (req.method === "GET") {
    return new Response(JSON.stringify({ operation_code: 1 }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { data, file_b64 } = body;

      if (!data || !Array.isArray(data)) {
        return new Response(JSON.stringify({ is_success: false, error: "data field must be a valid array" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }

      const numbers = [];
      const alphabets = [];
      const lowercaseAlphabets = [];

      for (const val of data) {
        const valStr = String(val).trim();
        if (!valStr) continue;

        if (/^-?\d+$/.test(valStr)) {
          numbers.push(valStr);
        } else if (/^[a-zA-Z]$/.test(valStr)) {
          alphabets.push(valStr);
          if (/^[a-z]$/.test(valStr)) {
            lowercaseAlphabets.push(valStr);
          }
        }
      }

      // 1. Highest lowercase alphabet logic
      let highest_lowercase_alphabet = [];
      if (lowercaseAlphabets.length > 0) {
        lowercaseAlphabets.sort((a, b) => a.localeCompare(b));
        highest_lowercase_alphabet = [lowercaseAlphabets[lowercaseAlphabets.length - 1]];
      }

      // 2. Prime checking logic
      const is_prime_found = numbers.some(numStr => isPrime(numStr));

      // 3. File validation and extraction
      let file_valid = false;
      let file_mime_type = undefined;
      let file_size_kb = undefined;

      if (file_b64) {
        const fileResult = parseBase64File(file_b64);
        if (fileResult.isValid) {
          file_valid = true;
          file_mime_type = fileResult.mimeType;
          file_size_kb = fileResult.sizeKb;
        }
      }

      const responsePayload = {
        is_success: true,
        user_id: userId,
        email: email,
        roll_number: rollNumber,
        numbers,
        alphabets,
        highest_lowercase_alphabet,
        is_prime_found,
        file_valid,
        ...(file_valid ? { file_mime_type, file_size_kb } : {}),
      };

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ is_success: false, error: "Invalid JSON input or processing error" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
  }

  return new Response(JSON.stringify({ is_success: false, error: "Method Not Allowed" }), {
    status: 405,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
};

export const config = {
  path: "/bfhl",
};

// Helper function to check if string represents a prime number
function isPrime(numStr) {
  const num = parseInt(numStr, 10);
  if (isNaN(num) || num <= 1) return false;
  if (num !== Number(numStr)) return false;

  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
}

// Helper to parse base64 file details
function parseBase64File(b64String) {
  if (!b64String || typeof b64String !== 'string') {
    return { isValid: false };
  }

  let mimeType = null;
  let base64Data = b64String;

  const dataUriMatch = b64String.match(/^data:(.*);base64,/);
  if (dataUriMatch) {
    mimeType = dataUriMatch[1];
    base64Data = b64String.substring(dataUriMatch[0].length);
  }

  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(base64Data);
  if (!isBase64) {
    return { isValid: false };
  }

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const sizeInBytes = buffer.length;
    const sizeInKb = (sizeInBytes / 1024).toFixed(2);

    if (!mimeType) {
      mimeType = detectMimeType(buffer);
    }

    return {
      isValid: true,
      mimeType: mimeType || 'application/octet-stream',
      sizeKb: sizeInKb,
    };
  } catch (e) {
    return { isValid: false };
  }
}

// Helper to detect MIME from magic bytes
function detectMimeType(buffer) {
  if (buffer.length < 4) return null;
  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  if (hex.startsWith('89504E47')) return 'image/png';
  if (hex.startsWith('FFD8FF')) return 'image/jpeg';
  if (hex.startsWith('474946')) return 'image/gif';
  if (hex.startsWith('25504446')) return 'application/pdf';
  return null;
}
