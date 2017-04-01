# GSoC Student Assessment Tool

A simple application for initial GSoC proposal assessment.

- Projects grouped by subcategory
- Star Rating
- Mentor Comments
- Links to GSoC Site and Proposal PDF

![screenshot](https://maximilianhils.com/upload/2016-03/2016-03-28_04-09-27.png)

### Installation

- Clone this repository
- Copy contents of https://summerofcode.withgoogle.com/api/om/program/current/proposal/?page_size=1000 to `data/proposals.json` (requires authentication). I am unable to check if page_size > 100 actually works.
- Adjust `data/config.js` to your needs.
- Replace contents of `data/data.json` with `{}`. This will later be filled with your mentors' comments (it also retains deleted ones).

#### Run using locally installed Node.js

- `yarn install`
- `npm start`

#### Run using Docker

- `docker-compose up`
