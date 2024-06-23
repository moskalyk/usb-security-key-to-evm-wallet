import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
	// generateAuthenticationOptions,
	// verifyAuthenticationResponse,
} from '@simplewebauthn/server';

export interface Env {
	wallet_challenge_db: KVNamespace;
}

function strToUint8Array(str: any) {
	return new TextEncoder().encode(str);
}
  
async function handleRequest(request: Request, env: Env, ctx: ExecutionContext) {
	if (request.method === "OPTIONS") {
		return new Response(null, {
			headers: {
				// Allow requests from any origin - adjust this as necessary
				"Access-Control-Allow-Origin": "*",
				
				// Allow POST method - add any other methods you need to support
				"Access-Control-Allow-Methods": "GET",
				
				// Optional: allow credentials
				"Access-Control-Allow-Credentials": "true",
				
				// Preflight cache period
				"Access-Control-Max-Age": "86400", // 24 hours
			}
		});
	}

	let url = new URL(request.url)

	if (url.pathname === "/register-options") {

		const payload: any = await request.json()
		const { userID, userName } = payload

		const options = await generateRegistrationOptions({
			rpName: 'Your App',
			rpID: 'localhost', // Replace with your domain
			userID: strToUint8Array(userID),
			userName: userName,
		});

		await env.wallet_challenge_db.put(userID, String(options.challenge))

		return new Response(JSON.stringify(options), {status: 200});
	}
	if (url.pathname === "/register"){

		const payload: any = await request.json()
		const { userID, attResp } = payload

		const expectedChallenge: any = await env.wallet_challenge_db.get(userID);

		const verification: any = await verifyRegistrationResponse({
			response: attResp,
			expectedChallenge,
			expectedOrigin: 'http://localhost:5173', // Replace with your origin
			expectedRPID: 'localhost', // Replace with your RP ID
		});

		if (verification.verified) {
			return new Response(JSON.stringify({
					credentialID: verification.registrationInfo.credentialID,
					publicKey: verification.registrationInfo.credentialPublicKey,
				}
			), {status: 200});
		}
	} 
	return new Response(JSON.stringify({
		msg: 'bad link'
	}), {status: 401});
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext) {

        // Process the request and create a response
        const response = await handleRequest(request, env, ctx);
 
        // Set CORS headers
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type");
 
        // return response
        return response;
    }
}