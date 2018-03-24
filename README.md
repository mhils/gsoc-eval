# GSoC Student Assessment Tool

A simple application for initial GSoC proposal assessment.

- Projects grouped by subcategory
- Star Rating
- Mentor Comments
- Link to GSoC Proposal
- [Github-style Emojis](http://emoji-cheat-sheet.com/) as a poor man's tagging system


![screenshot](https://maximilianhils.com/upload/2016-03/2016-03-28_04-09-27.png)

### Installation

- Clone this repository
- Copy contents of https://summerofcode.withgoogle.com/api/om/program/current/proposal/?page_size=1000 to `data/json/proposals.json` (requires authentication). I am unable to check if page_size > 100 actually works.
- Adjust `data/config.js` to your needs.
- Replace contents of `data/json/data.json` with `{}`. This will later be filled with your mentors' comments (it also retains deleted ones).

#### Run using locally installed Node.js

- `yarn install --production`
- `npm start`

#### Run using Docker

- `docker-compose up`

### Update

If you use Docker, you need to re-build the docker image after updating the repo:

- `docker-compose build`

### Development

#### Using locally installed Node.js

Run these two in parallel:

- `npm run develop`
- `npm start`

#### Using Docker

Development can also be done without installing Node.js on the host system.
For this to work, you first have to uncomment the second volume mount in `docker-compose.yml`.
You can then run the two following commands in parallel:

- `docker-compose run gsoc-eval npm run develop`
- `docker-compose run -p 3000:3000 gsoc-eval npm start`