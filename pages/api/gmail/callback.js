import { google } from "googleapis";
import dbConnect from "../../../lib/database";
import Provider from "../../../models/Provider";
import { encodeMessage } from "../../../services/gmail";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      await dbConnect();

      const { code, state } = req.query;

      // Extract clinicId from state if present
      let clinicId = "";
      let userId = "";
      if (state) {
        try {
          const decodedState = JSON.parse(
            Buffer.from(state, "base64").toString("utf-8"),
          );
          if (decodedState.clinicId) {
            clinicId = decodedState.clinicId;
          }
          if (decodedState.userId) {
            userId = decodedState.userId;
          }
        } catch (e) {
          console.error("Error parsing state:", e);
        }
      }
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const gmail = google.gmail({ version: "v1", auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: "me" });
      const email = profile.data.emailAddress;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email address not found.",
        });
      }

      // Send test email
      const testRaw = await encodeMessage({
        to: email,
        from: email,
        senderName: `Test User`,
        subject: "Gmail Connected Successfully",
        content:
          "Hi,\n\nYour Gmail account has been successfully connected to the HelloCRM. All future email activity will be synced automatically.\n\nBest,\nHelloCRM Team",
        attachments: [],
      });

      try {
        await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw: testRaw },
        });
      } catch (err) {
        console.log("Error in send test email: ", err);
        // Don't fail the whole process if test email fails
      }

      // Save or update Provider
      const secrets = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
      };

      let provider = await Provider.findOne({
        email,
        emailProviderType: "gmail",
      });

      if (provider) {
        provider.secrets = secrets;
        provider.isActive = true;
        provider.lastSyncedAt = new Date();
        await provider.save();
      } else {
        provider = await Provider.create({
          clinicId,
          userId,
          name: "gmail",
          label: email,
          email,
          status: "approved",
          emailProviderType: "gmail",
          type: ["email"],
          isActive: true,
          lastSyncedAt: new Date(),
          secrets,
        });
      }

      // Set up Gmail Watch
      try {
        // const resWatchData = await gmail.users.watch({
        //   userId: "me",
        //   requestBody: {
        //     labelIds: ["INBOX"],
        //     topicName: "projects/crm-messaging-427110/topics/gmail-sync-topic",
        //   },
        // });
        // console.log("Initial Gmail Watch Response:", resWatchData.data);
        // Schedule Gmail Watch Renewal (Commented out until queue is configured)
        /*
        const expirationTime = Number(resWatchData.data.expiration);
        const rewatchTime = expirationTime - 1000 * 60 * 60;

        const jobId = `rewatch-${provider._id}`;
        const gmailRewatchJob = await gmailWatchRenewalQueue.add(
          "rewatch-gmail",
          {
            providerId: provider._id,
          },
          {
            repeat: {
              every: RENEWAL_GMAIL_WATCH_INTERVAL,
            },
            jobId: `rewatch-${provider._id}`,
            removeOnComplete: true,
          },
        );
        if (gmailRewatchJob) {
          provider.gmailWatchJobId = gmailRewatchJob.id;
          provider.gmailWatchJobKey = gmailRewatchJob.repeatJobKey;
        }
        */
      } catch (watchErr) {
        console.error("Error setting up Gmail watch:", watchErr);
      }

      await provider.save();

      res.redirect("/clinic/providers");
    } catch (error) {
      console.error("Gmail Callback Error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  } else {
    res.status(405).end("Method Not Allowed");
  }
}
