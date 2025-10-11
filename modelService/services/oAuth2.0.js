const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const OAuthClient = () => {
    try {
        const credentialsFile = path.join(__dirname, '../config/googleCredentials.json');
        const credentials = JSON.parse(fs.readFileSync(credentialsFile));
        const { client_id, client_secret, redirect_uris } = credentials.web
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        return oAuth2Client
    } catch (error) {
        console.log('oAuth2.0.js : OAuthClient => Unable to initiate OAuth Client from google', error);
        return error
    }
}

const verifyAuthCredentials = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const oAuth2Client = OAuthClient()

            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: "offline",
                prompt: "consent",
                scope: ["https://www.googleapis.com/auth/calendar"],
            })

            console.log('oAuth2.0.js : verifyAuthCredentials => Get the credentials on this site', authUrl);

            resolve(authUrl)
        } catch (error) {
            console.log('oAuth2.0.js : verifyAuthCredentials => Something went wrong while verifying credentials', error);
            reject(error)
        }
    })
}

const setToken = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const oAuth2Client = OAuthClient()

            const tokenPath = path.join(__dirname, '../authCredentials/user123Token.json');
            let tokenFile = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));

            const { tokens } = await oAuth2Client.getToken(tokenFile.secretCode);
            oAuth2Client.setCredentials(tokens);

            console.log('oAuth2.0.js : setToken => ✅ Tokens retrieved:', tokens);

            const updatedTokenFile = {
                ...tokenFile,
                ...tokens,
            };

            delete updatedTokenFile.secretCode;

            fs.writeFileSync(tokenPath, JSON.stringify(updatedTokenFile, null, 2));

            resolve("Success");
        } catch (error) {
            console.log('oAuth2.0.js : setToken => Unable to set the token credentials on OAUTH', error);
            reject(error)
        }
    })
}

const createEvent = async (meetingInfo, oAuth2Client, tool, isRecurring = false) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { attendees, meetingDate, startTime, endTime, title, venue, recurringType, recurringCount, recurringUntil } = meetingInfo;
            const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
            let event = {
                summary: title,
                location: venue,
                start: {
                    dateTime: `${meetingDate}T${startTime}:00+05:30`,
                    timeZone: "Asia/Kolkata",
                },
                end: {
                    dateTime: `${meetingDate}T${endTime}:00+05:30`,
                    timeZone: "Asia/Kolkata",
                },
                attendees: attendees.split(",").map((email) => ({ email: email.trim() })),
            };

            if (tool === 'meet') {
                event['conferenceData'] = {
                    createRequest: { requestId: "meet-" + Date.now() }
                }
            }

            if (isRecurring) {
                let rule = "FREQ=DAILY";
                if (recurringType === "weekly") rule = "FREQ=WEEKLY";
                if (recurringType === "monthly") rule = "FREQ=MONTHLY";
                if (recurringCount) rule += `;COUNT=${recurringCount}`;
                if (recurringUntil) rule += `;UNTIL=${recurringUntil}T235959Z`;
        
                event.recurrence = [`RRULE:${rule}`];
            }

            const response = await calendar.events.insert({
                calendarId: "primary",
                resource: event,
                conferenceDataVersion: tool === "meet" ? 1 : undefined
            });

            const meetUrl = response.data.hangoutLink ? `Meeting link : ${response.data.hangoutLink}` : "Calendar Booked"
            resolve({
                success: true,
                meetLink: meetUrl,
                eventLink: response.data.htmlLink,
            });
        } catch (error) {
            console.log('oAuth2.0.js : createEvent => Issue while creating event on calendar', error);
            reject(error)
        }
    })
}

module.exports = {
    verifyAuthCredentials,
    OAuthClient,
    setToken,
    createEvent
}