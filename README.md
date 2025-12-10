# Lingasamudram Cricket Tournament Web App

## Features
- Home page with tabs: Add Team, Teams Registered, Archives, Schedule, Match Live
- Add Team: Register a team with 11 players and a mandatory captain (must be one of the players)
- Teams Registered: Lists all teams from Firebase
- Archives: Sub-tabs for Images and Videos (upload your files to `archives/images/` and `archives/videos/`)
- Schedule: Placeholder for match schedule
- Match Live: Redirects to YouTube livestream
- Scrolling blue bar at the bottom with tournament message
- Firebase integration for team data

## Setup
1. **Add your cricket background image**
   - Place your image as `cricket-bg.jpg` in the project root (`lsmcrickettournament/`).
2. **Firebase**
   - The app uses the provided Firebase configuration. Update `app.js` if you need to change it.
3. **Archives**
   - Place images in `archives/images/` and videos in `archives/videos/`.
4. **Run the app**
   - Open `index.html` in your browser.

## Notes
- This project uses only HTML, CSS, and JavaScript (no frameworks).
- For any issues with Firebase, check your configuration and internet connection.

---

**Enjoy the tournament!**
