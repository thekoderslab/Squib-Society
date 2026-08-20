# X developer application

Everything here describes what the site actually does. Do not add capabilities
you have not built: the description is what X holds you to, and an account can
be terminated for a mismatch.

## Answer for "Describe all of your use cases of X data and API"

Squib Society is a website for an art collectibles project. We use the X API for
one thing: letting a visitor sign in with their X account so we can identify
them on our own allowlist.

In detail:

1. Sign in with X using OAuth 2.0 with PKCE, requesting read-only scopes
   (users.read, tweet.read). We are a confidential client and the token is
   held server side only, exchanged once and then discarded.

2. After sign-in we call GET /2/users/me once to read that account's numeric id,
   username, display name, profile image URL, description, public follower and
   following counts, and account creation date.

3. We show that profile back to the same signed-in person on their own page, so
   they can confirm which account they connected. We do not show one user's X
   data to another user, and we do not display posts or timelines anywhere on
   the site.

4. We store the numeric user id, username, display name and profile image URL in
   our own database against that person's allowlist entry. The numeric id is
   what stops one X account claiming two places. Account age and follower count
   are used only to filter out throwaway accounts created to farm entries. A
   public leaderboard shows a participant's username and display name and a
   points total, and nothing else.

5. We never post, like, repost, follow, send messages, or take any other action
   on a user's behalf. When someone chooses to share, we open the standard
   x.com/intent/post link in their browser, which is not an API call and
   requires them to press post themselves.

6. We do not resell, license, sublicense or otherwise share X data with any
   third party. We do not provide X data or derived information to any
   government entity. We do not use it for advertising, ad targeting, audience
   building, profiling, surveillance, credit or insurance decisions, or to train
   machine learning or AI models.

7. Users can disconnect at any time, which deletes the stored profile and its
   associated data from our database.

Expected volume is low: on the order of a few thousand sign-ins in total, with
one GET /2/users/me call per sign-in and no polling or background jobs against
the API.

## Optional paragraph, ONLY if you decide to verify tasks through the API

Do not include this unless you are actually going to build it and have the
access tier for it. See the note below about which tier that needs.

We additionally check whether a signed-in user follows our account and whether
they liked or reposted one specific post of ours, so we can credit them for
completing a task on our allowlist. These checks are made only for the user who
is signed in, only against our own account and our own post, and only at the
moment they ask us to verify. We do not build any graph of relationships between
other users and we do not retain the result beyond a single boolean on that
user's own entry.

## Getting the credentials

1. developer.x.com, sign up for a developer account, answer the use case box
   with the text above.
2. Create a Project, then create an App inside that Project. Free access
   requires the App to belong to a Project.
3. Open the App, go to "User authentication settings", press "Set up".
   - App permissions: Read
   - Type of App: Web App, Automated App or Bot. This gives you a confidential
     client, which is what the server side flow needs.
   - Callback URI / Redirect URL, add both:
       https://YOUR-DOMAIN/api/auth/x/callback
       http://localhost:3000/api/auth/x/callback
   - Website URL: your live domain.
4. Save. X shows the OAuth 2.0 Client ID and Client Secret once. Copy the secret
   immediately, it is not shown again, though it can be regenerated.
5. Put them in Vercel, Settings, Environment Variables:
       X_CLIENT_ID
       X_CLIENT_SECRET
   Neither is NEXT_PUBLIC_. Both are read server side only.

The API Key / API Secret and Bearer Token on the Keys page are for OAuth 1.0a
and app-only auth. This site does not use them.

## The tier problem, worth knowing before you plan around it

Sign in with X and GET /2/users/me work on the free tier. That covers everything
the allowlist login needs.

Reading who follows an account, who liked a post, or who reposted it is not on
the free tier. Those endpoints have been repeatedly restricted and repriced, and
at the time of writing they need paid access. Check the current pricing page
before committing to API based task verification, because the tier that unlocks
it costs real money per month.

This is exactly why the quote-tweet task is a bonus and not a gate, and why a
quest platform (Zealy, Galxe, TaskOn) is usually the cheaper answer for the
follow, like and repost checks. They already hold the paid access and amortise
it across every project using them.
