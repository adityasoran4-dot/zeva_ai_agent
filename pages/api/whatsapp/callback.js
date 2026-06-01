// import axios from "axios";
// import dbConnect from "../../../lib/database";
// import Clinic from "../../../models/Clinic";
// import Provider from "../../../models/Provider";
// import { getUserFromReq, requireRole } from "../lead-ms/auth";

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res
//       .status(405)
//       .json({ success: false, message: `${req.method} - Method not allowed` });
//   }
//   await processWhatsAppCallback(req, res);
//   res.status(200).json({ success: true });
// }

// export const processWhatsAppCallback = async (req, res) => {
//   try {
//     await dbConnect();

//     const { code, state, error, error_reason, error_description } = req.query;
//     console.log({ q: req.query });

//     // Handle OAuth errors from Facebook
//     if (error) {
//       console.error("OAuth Error from Facebook:", {
//         error,
//         error_reason,
//         error_description,
//       });
//       return res.status(400).json({
//         success: false,
//         message: `OAuth failed: ${error_description || error}`,
//         error,
//       });
//     }

//     if (!code || !state) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing authorization code or state parameter",
//       });
//     }

//     // Decode and validate state parameter
//     let stateData;
//     try {
//       const decodedState = Buffer.from(state, "base64").toString("utf-8");
//       stateData = JSON.parse(decodedState);

//       // Validate state expiration (10 minutes)
//       const stateAge = Date.now() - stateData.timestamp;
//       if (stateAge > 10 * 60 * 1000) {
//         return res.status(400).json({
//           success: false,
//           message: "OAuth state has expired. Please try again.",
//         });
//       }
//     } catch (error) {
//       console.error("Invalid state parameter:", error);
//       return res.status(400).json({
//         success: false,
//         message: "Invalid state parameter",
//       });
//     }

//     // Verify the state belongs to this user and clinic
//     if (stateData.clinicId !== stateData.clinicId) {
//       return res.status(403).json({
//         success: false,
//         message: "State parameter mismatch. Possible CSRF attack.",
//       });
//     }

//     const clinicId = stateData.clinicId;

//     // Exchange authorization code for access token
//     const clientId = process.env.FACEBOOK_CLIENT_ID;
//     const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
//     const redirectUri = process.env.FACEBOOK_REDIRECT_URI;

//     if (!clientId || !clientSecret || !redirectUri) {
//       return res.status(500).json({
//         success: false,
//         message: "Facebook OAuth configuration is missing",
//       });
//     }

//     try {
//       // Step 1: Exchange code for short-lived access token
//       const tokenResponse = await axios.get(
//         "https://graph.facebook.com/v19.0/oauth/access_token",
//         {
//           params: {
//             client_id: clientId,
//             client_secret: clientSecret,
//             redirect_uri: redirectUri,
//             code: code,
//           },
//         },
//       );

//       const shortLivedToken = tokenResponse.data.access_token;
//       const tokenExpiresIn = tokenResponse.data.expires_in; // Usually 5183939 seconds (~60 days)

//       console.log("Short-lived token received:", {
//         expires_in: tokenExpiresIn,
//       });

//       // Step 2: Exchange short-lived token for long-lived token
//       const longLivedTokenResponse = await axios.get(
//         "https://graph.facebook.com/v19.0/oauth/access_token",
//         {
//           params: {
//             grant_type: "fb_exchange_token",
//             client_id: clientId,
//             client_secret: clientSecret,
//             fb_exchange_token: shortLivedToken,
//           },
//         },
//       );

//       const longLivedToken = longLivedTokenResponse.data.access_token;
//       const longLivedExpiresIn = longLivedTokenResponse.data.expires_in; // Usually 5183939 seconds (~60 days)

//       console.log("Long-lived token received:", {
//         expires_in: longLivedExpiresIn,
//       });
//       // Check user's businesses
//       try {
//         const businessesResponse = await axios.get(
//           "https://graph.facebook.com/v19.0/me/businesses",
//           {
//             headers: { Authorization: `Bearer ${longLivedToken}` },
//           },
//         );
//         console.log(
//           "User's businesses:",
//           JSON.stringify(businessesResponse.data, null, 2),
//         );
//       } catch (err) {
//         console.log("No business access or no businesses found");
//       }

//       // Step 3: Get WhatsApp Business Account ID and Phone Number ID
//       // ✅ CORRECT - Get WhatsApp Business Accounts
//       const accountsResponse = await axios.get(
//         "https://graph.facebook.com/v19.0/me/accounts",
//         {
//           headers: {
//             Authorization: `Bearer ${longLivedToken}`,
//           },
//         },
//       );

//       console.log("WhatsApp Business Accounts:", accountsResponse.data);

//       const accounts = accountsResponse.data.data || [];
//       const whatsappAccounts = accounts.filter(
//         (account) => account.tasks && account.tasks.includes("WHATSAPP_ADMIN"),
//       );

//       // Find the WhatsApp Business Account

//       console.log(
//         JSON.stringify({ accountsResponse: accountsResponse.data.data }),
//       );
//       console.log({ whatsappAccounts });

//       if (whatsappAccounts.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "No WhatsApp Business Account found. Please ensure you have WhatsApp Business API access.",
//         });
//       }

//       const wabaId = whatsappAccounts[0].id;
//       const wabaName = whatsappAccounts[0].name;

//       // Step 4: Get Phone Number ID
//       const phoneNumbersResponse = await axios.get(
//         `https://graph.facebook.com/v19.0/${wabaId}/phone_numbers`,
//         {
//           headers: {
//             Authorization: `Bearer ${longLivedToken}`,
//           },
//         },
//       );

//       if (
//         !phoneNumbersResponse.data.data ||
//         phoneNumbersResponse.data.data.length === 0
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "No phone numbers found in your WhatsApp Business Account. Please add a phone number first.",
//         });
//       }

//       const phoneNumber = phoneNumbersResponse.data.data[0];
//       const phoneNumberId = phoneNumber.id;
//       const displayPhoneNumber = phoneNumber.display_phone_number;

//       console.log("WhatsApp Business Account found:", {
//         wabaId,
//         wabaName,
//         phoneNumberId,
//         displayPhoneNumber,
//       });
//       // Step 5: Create or update Provider record
//       //   let provider = await Provider.findOne({
//       //     clinicId,
//       //     name: "whatsappCloud",
//       //     "secrets.wabaId": wabaId,
//       //   });

//       //   if (provider) {
//       //     // Update existing provider
//       //     provider.secrets.whatsappAccessToken = longLivedToken;
//       //     provider.secrets.wabaId = wabaId;
//       //     provider.secrets.phoneNumberId = phoneNumberId;
//       //     provider.secrets.tokenExpiresAt = new Date(
//       //       Date.now() + longLivedExpiresIn * 1000,
//       //     );
//       //     provider.status = "approved";
//       //     provider.phone = displayPhoneNumber;
//       //     await provider.save();
//       //     console.log("Provider updated:", provider._id);
//       //   } else {
//       //     // Create new provider
//       //     provider = new Provider({
//       //       clinicId,
//       //       userId: me._id,
//       //       name: "whatsappCloud",
//       //       label: `${wabaName} - ${displayPhoneNumber}`,
//       //       phone: displayPhoneNumber,
//       //       type: ["whatsapp"],
//       //       status: "approved",
//       //       secrets: {
//       //         whatsappAccessToken: longLivedToken,
//       //         wabaId: wabaId,
//       //         phoneNumberId: phoneNumberId,
//       //         tokenExpiresAt: new Date(Date.now() + longLivedExpiresIn * 1000),
//       //       },
//       //     });
//       //     await provider.save();
//       //     console.log("Provider created:", provider._id);
//       //   }

//       // Return success response
//       return res.status(200).json({
//         success: true,
//         message: "WhatsApp Business API connected successfully",
//         data: {
//           providerId: provider._id,
//           wabaId,
//           wabaName,
//           phoneNumber: displayPhoneNumber,
//           phoneNumberId,
//           tokenExpiresAt: provider.secrets.tokenExpiresAt,
//           expiresIn: longLivedExpiresIn,
//         },
//       });
//     } catch (error) {
//       console.error("Error exchanging OAuth code for tokens:", error);

//       if (error.response?.data?.error) {
//         const fbError = error.response.data.error;
//         return res.status(error.response.status || 500).json({
//           success: false,
//           message: fbError.message || "Facebook OAuth error",
//           error: fbError.type,
//           code: fbError.code,
//         });
//       }

//       return res.status(500).json({
//         success: false,
//         message: "Failed to complete OAuth flow",
//         error: error.message,
//       });
//     }
//   } catch (error) {
//     console.error("OAuth callback error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error?.message || "Internal server error",
//     });
//   }
// };
