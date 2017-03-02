# GSoC Student Assessment Tool

A simple application for initial GSoC proposal assessment.

- Projects grouped by subcategory
- Star Rating
- Mentor Comments
- Links to GSoC Site and Proposal PDF

![screenshot](https://maximilianhils.com/upload/2016-03/2016-03-28_04-09-27.png)

### Installation:

- `npm install` / `yarn install`
- Copy contents of https://summerofcode.withgoogle.com/api/om/program/current/proposal/?page_size=1000 to `data/proposals.json` (requires authentication). (I'm unable to check if page_size > 100 actually works)
- Adjust `data/config.js` to your needs.
- Replace contents of `data.json` with `{}`.

### Usage:

- `npm start --help`
- Share access with mentors.